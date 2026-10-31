import { Text, View } from 'react-native';
import { ApiError } from '@/lib/fetcher';
import { Button } from './button';

/**
 * Branch on `code`, never on `message` (PRD-v2 §2.3 rule 5, README). The message itself is
 * always `ApiError.message`, which `response-envelope.ts` guarantees is prose — a raw body,
 * an HTML error page or an empty response is substituted there and never reaches here.
 */
const TITLES: Record<string, string> = {
  GEN_OFFLINE: "You're offline",
  GEN_CONFIG: 'Not set up yet',
  GEN_429: 'Slow down a moment',
  GEN_501: "That isn't built yet",
  AUTH_001: 'Sign in to continue',
  AUTH_002: 'Your session expired',
  AUTH_003: 'Your session expired',
  AUTH_004: 'Verify your email first',
  TRACK_001: 'Today is already logged',
  TRACK_002: "That date can't be logged",
  TRACK_003: 'Editing has closed for that day',
};

/** A different answer will not arrive from pressing the same button again. */
const NOT_RETRYABLE = new Set(['GEN_CONFIG', 'GEN_501', 'AUTH_004', 'TRACK_002', 'TRACK_003']);

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const apiError = error instanceof ApiError ? error : null;
  const code = apiError?.code ?? 'GEN_500';
  const title = TITLES[code] ?? "That didn't work";
  const message = apiError?.message ?? 'Something went wrong. Please try again.';
  const canRetry = onRetry !== undefined && !NOT_RETRYABLE.has(code);

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className="rounded-2xl border border-border bg-card p-5"
    >
      <Text accessibilityRole="header" className="text-base font-semibold text-destructive">
        {title}
      </Text>
      <Text className="mt-2 text-sm text-foreground">{message}</Text>
      <Text className="mt-3 text-xs text-muted-foreground">Reference: {code}</Text>
      {canRetry ? (
        <Button
          label="Try again"
          variant="secondary"
          onPress={onRetry}
          className="mt-4 self-start"
          accessibilityHint="Requests the screen again"
        />
      ) : null}
    </View>
  );
}
