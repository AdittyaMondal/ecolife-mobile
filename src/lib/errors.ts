import { ApiError } from './fetcher';

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  password: 'Password',
  name: 'Name',
  phone: 'Phone',
  timezone: 'Timezone',
};

function readableIssue(path: string, message: string): string {
  const label = FIELD_LABELS[path] ?? (path ? path : 'This field');
  const length = message.match(/>=(\d+) characters/);
  if (length) return `${label} needs at least ${length[1]} characters.`;
  if (/invalid email/i.test(message)) return 'Enter a valid email address.';
  return `${label}: ${message.charAt(0).toLowerCase()}${message.slice(1)}`;
}

function issuesText(details: Record<string, unknown>): string | null {
  if (!Array.isArray(details.issues)) return null;
  const lines = details.issues
    .map((issue) => {
      if (!issue || typeof issue !== 'object') return null;
      const record = issue as { path?: unknown; message?: unknown };
      const path = typeof record.path === 'string' ? record.path : '';
      const message = typeof record.message === 'string' ? record.message : '';
      return message ? readableIssue(path, message) : null;
    })
    .filter((line): line is string => Boolean(line));
  return lines.length ? lines.join(' ') : null;
}

export function errorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error instanceof ApiError) return issuesText(error.details) ?? error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Network loss and unfinished server routes should not blank a screen. */
export function isUnavailable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return error.httpStatus === 0 || error.httpStatus === 501 || error.httpStatus >= 500;
}

export function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && error.httpStatus === 401;
}
