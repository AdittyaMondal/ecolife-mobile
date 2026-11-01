import type { Session } from '@/types/domain';
import { type ApiErrorBody, type Envelope, toEnvelope } from './response-envelope';
import { emitSessionLost } from './session-events';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from './token-store';

/**
 * The only thing in the app that talks HTTP. Point `EXPO_PUBLIC_API_URL` at the Prism mock
 * (:4010) or the real server (:4000) — nothing else changes (PRD-v2 §2.3).
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

/** Branch on `code`, never on `message` (PRD-v2 §2.3 rule 5). */
export class ApiError extends Error {
  readonly code: string;
  readonly details: Record<string, unknown>;
  readonly httpStatus: number;

  constructor(error: ApiErrorBody, httpStatus: number) {
    super(error.message);
    this.name = 'ApiError';
    this.code = error.code;
    this.details = error.details;
    this.httpStatus = httpStatus;
  }
}

function skipRefresh(path: string): boolean {
  return (
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/google') ||
    path.startsWith('/auth/register') ||
    path.startsWith('/auth/refresh') ||
    path.startsWith('/auth/forgot-password') ||
    path.startsWith('/auth/reset-password')
  );
}

type HttpResult = { status: number; text: string; headerText: string };

/**
 * Identifies this client as native, so the server puts the refresh token in
 * `session.refreshToken` for expo-secure-store rather than only in an httpOnly
 * cookie (the server's `deliverRefresh`, and CLAUDE.md §4.1.0).
 *
 * Without it the server treats us as a browser and the token arrives ONLY as a
 * Set-Cookie. That made session persistence depend on scraping a cookie whose
 * name the server treats as configurable — `SESSION_COOKIE_NAME`, which is
 * `ecolife_session` on the deployment but `ecolife_refresh` by default. The
 * regex below hardcodes one of them, so mobile worked against one environment
 * and silently lost the session on the other. Declaring the platform removes
 * the coupling: the token comes back in the body and the cookie name stops
 * mattering.
 */
const PLATFORM_HEADER = { 'x-ecolife-platform': 'android' } as const;

/**
 * XMLHttpRequest, not fetch: the cookie fallback below reads `Set-Cookie`,
 * which fetch hides from script. Kept as a fallback for a server that has not
 * been told our platform, but PLATFORM_HEADER means the body token is used.
 */
function http(url: string, init?: RequestInit): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open((init?.method ?? 'GET').toUpperCase(), url);
    const headers = new Headers(init?.headers);
    headers.forEach((value, key) => {
      xhr.setRequestHeader(key, value);
    });
    xhr.onload = () => {
      resolve({
        status: xhr.status,
        text: xhr.responseText ?? '',
        headerText: xhr.getAllResponseHeaders() ?? '',
      });
    };
    xhr.onerror = () => reject(new Error('network'));
    xhr.send(typeof init?.body === 'string' ? init.body : null);
  });
}

function parseBody(text: string): unknown {
  if (text.trim() === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** The cookie value is the refresh token when `session.refreshToken` is null. */
function refreshFromHeaders(
  headerText: string,
  bodyToken: string | null | undefined,
): string | null {
  if (bodyToken) return bodyToken;
  // Either name the server may be configured with (SESSION_COOKIE_NAME).
  // Only a fallback now: PLATFORM_HEADER means the body token is normally set.
  const match = headerText.match(/ecolife_(?:session|refresh)=([^;\s,]+)/i);
  return match?.[1] ?? null;
}

function attachRefresh<T>(data: T, headerText: string): T {
  if (!data || typeof data !== 'object') return data;
  const record = data as Record<string, unknown>;
  if ('accessToken' in record) {
    const token = refreshFromHeaders(headerText, record.refreshToken as string | null);
    return { ...record, refreshToken: token } as T;
  }
  if (record.session && typeof record.session === 'object') {
    const session = record.session as Session;
    return {
      ...record,
      session: { ...session, refreshToken: refreshFromHeaders(headerText, session.refreshToken) },
    } as T;
  }
  return data;
}

let refreshInFlight: Promise<boolean> | null = null;

/** Rotate the stored refresh token. One in-flight refresh is shared by concurrent 401s. */
export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = rotateSession().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function rotateSession(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken || !BASE_URL) return false;

  try {
    const res = await http(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...PLATFORM_HEADER,
      },
      body: JSON.stringify({ refreshToken }),
    });
    const envelope: Envelope<Session> = toEnvelope<Session>(parseBody(res.text), res.status);
    const refresh = envelope.status
      ? refreshFromHeaders(res.headerText, envelope.data.refreshToken)
      : null;
    if (!envelope.status || !envelope.data.accessToken || !refresh) {
      await clearTokens();
      return false;
    }
    setAccessToken(envelope.data.accessToken);
    await setRefreshToken(refresh);
    return true;
  } catch {
    return false;
  }
}

export async function request<T>(path: string, init?: RequestInit, attempt = 0): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(
      {
        code: 'GEN_CONFIG',
        message: 'The app is not configured to reach EcoLife yet.',
        details: { missing: 'EXPO_PUBLIC_API_URL' },
      },
      0,
    );
  }

  const accessToken = getAccessToken();
  let res: HttpResult;

  try {
    res = await http(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        // Declares us as a native client, so the server returns the refresh
        // token in `session.refreshToken` instead of only as a cookie. See
        // PLATFORM_HEADER below for why that matters.
        ...PLATFORM_HEADER,
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      {
        code: 'GEN_OFFLINE',
        message: "We couldn't reach EcoLife. Check your connection and try again.",
        details: {},
      },
      0,
    );
  }

  const envelope: Envelope<T> = toEnvelope<T>(parseBody(res.text), res.status);
  if (envelope.status === false) {
    if (res.status === 401 && attempt === 0 && !skipRefresh(path) && (await refreshSession())) {
      return request<T>(path, init, attempt + 1);
    }
    if (res.status === 401 && !skipRefresh(path)) {
      await clearTokens();
      emitSessionLost();
    }
    throw new ApiError(envelope.error, res.status);
  }
  return attachRefresh(envelope.data, res.headerText);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
