import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ApiError, api } from '@/lib/fetcher';
import { googleAccessToken } from '@/lib/google-auth';
import { deviceTimeZone } from '@/lib/ids';
import { emptyLocal, readLocal, writeLocal } from '@/lib/local-state';
import { onSessionLost } from '@/lib/session-events';
import { clearTokens, getRefreshToken, setAccessToken, setRefreshToken } from '@/lib/token-store';
import type { AuthResult, LocalUserState, Me, Session } from '@/types/domain';

type SignUpInput = {
  name: string;
  email: string;
  password: string;
  accountType: 'individual' | 'employee';
  employeeId?: string;
  organizationName?: string;
};

type AuthContextValue = {
  status: 'loading' | 'signedOut' | 'signedIn';
  user: Me | null;
  local: LocalUserState;
  onboardingDone: boolean;
  isEmployee: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateLocal: (recipe: (prev: LocalUserState) => LocalUserState) => Promise<void>;
  setUser: (user: Me) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(session: Session) {
  setAccessToken(session.accessToken);
  if (session.refreshToken) await setRefreshToken(session.refreshToken);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');
  const [user, setUserState] = useState<Me | null>(null);
  const [local, setLocal] = useState<LocalUserState>(emptyLocal());
  const localRef = useRef(local);
  const userRef = useRef(user);
  localRef.current = local;
  userRef.current = user;

  const adopt = useCallback(async (next: Me, session?: Session) => {
    if (session) await persistSession(session);
    const stored = await readLocal(next.id);
    localRef.current = stored;
    setLocal(stored);
    setUserState(next);
    setStatus('signedIn');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        if (!cancelled) setStatus('signedOut');
        return;
      }
      try {
        const session = await api.post<Session>('/auth/refresh', { refreshToken });
        await persistSession(session);
        const me = await api.get<Me>('/auth/me');
        if (cancelled) return;
        await adopt(me);
      } catch {
        await clearTokens();
        if (!cancelled) setStatus('signedOut');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adopt]);

  useEffect(() => {
    return onSessionLost(() => {
      setUserState(null);
      setLocal(emptyLocal());
      setStatus('signedOut');
      queryClient.clear();
    });
  }, [queryClient]);

  const updateLocal = useCallback(async (recipe: (prev: LocalUserState) => LocalUserState) => {
    const next = recipe(localRef.current);
    localRef.current = next;
    setLocal(next);
    const current = userRef.current;
    if (current) await writeLocal(current.id, next);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await api.post<AuthResult>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      await adopt(result.user, result.session);
      await queryClient.invalidateQueries();
    },
    [adopt, queryClient],
  );

  const signInWithGoogle = useCallback(async () => {
    const accessToken = await googleAccessToken();
    try {
      const result = await api.post<AuthResult>('/auth/google', {
        accessToken,
        timezone: deviceTimeZone(),
      });
      await adopt(result.user, result.session);
      await queryClient.invalidateQueries();
    } catch (error) {
      if (error instanceof ApiError && error.httpStatus === 404) {
        throw new Error('Google sign-in is not turned on for this EcoLife server yet.');
      }
      throw error;
    }
  }, [adopt, queryClient]);

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const result = await api.post<AuthResult>('/auth/register', {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        timezone: deviceTimeZone(),
      });
      await persistSession(result.session);
      const stored = await readLocal(result.user.id);
      const next =
        input.accountType === 'employee'
          ? {
              ...stored,
              employeeId: input.employeeId?.trim() || null,
              organizationName: input.organizationName?.trim() || null,
            }
          : stored;
      await writeLocal(result.user.id, next);
      localRef.current = next;
      setLocal(next);
      setUserState(result.user);
      setStatus('signedIn');
      await queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // A failed revoke still ends the session on this device.
    }
    await clearTokens();
    setUserState(null);
    setLocal(emptyLocal());
    setStatus('signedOut');
    queryClient.clear();
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    const me = await api.get<Me>('/auth/me');
    setUserState(me);
  }, []);

  /**
   * The SERVER decides, once we have its answer.
   *
   * This was `user?.onboardingComplete || local.onboardingComplete`, so a
   * locally cached `true` outranked the server saying `false` — and that flag
   * is sticky, written to `ecolife.user.{id}` and read back on every launch.
   * Once set for an account it could never be cleared from the server side, so
   * an account the server considers un-onboarded would skip onboarding
   * permanently.
   *
   * The local flag now only covers the window BEFORE the user object loads
   * (a cold start offline), which is what it was there for.
   *
   * Tradeoff, deliberately taken: someone who finishes onboarding while
   * offline has `local.onboardingComplete = true` and no server record, so
   * once `user` loads they are asked again. That is the safe direction — being
   * asked twice is recoverable, silently skipping is not — but it is why
   * `finish()`'s offline path should eventually replay to the server the way
   * `pendingLogs` does.
   */
  const onboardingDone = user
    ? Boolean(user.onboardingComplete)
    : Boolean(local.onboardingComplete);

  /**
   * Make the disagreement visible. This is exactly the state that is invisible
   * on a device and impossible to diagnose from a bug report.
   */
  if (user && local.onboardingComplete && !user.onboardingComplete) {
    console.warn(
      `[auth] onboarding: server says incomplete for user ${user.id} but this device has a ` +
        'local completed flag. Following the server. An onboarding finished offline may not ' +
        'have reached the API.',
    );
  }
  const isEmployee = Boolean(user?.organization || local.employeeId);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      local,
      onboardingDone,
      isEmployee,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      refreshUser,
      updateLocal,
      setUser: setUserState,
    }),
    [
      status,
      user,
      local,
      onboardingDone,
      isEmployee,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      refreshUser,
      updateLocal,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
