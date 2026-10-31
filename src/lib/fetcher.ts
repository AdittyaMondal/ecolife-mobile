import { type ApiErrorBody, type Envelope, toEnvelope } from './response-envelope';
import { getAccessToken } from './token-store';

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

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (text.trim() === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    // An HTML error page or a truncated body. Hand the raw string on; `toEnvelope` rejects it
    // without ever exposing it.
    return text;
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
  let res: Response;

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    // No radio, DNS failure, TLS failure. There is no HTTP status to map.
    throw new ApiError(
      {
        code: 'GEN_OFFLINE',
        message: "We couldn't reach EcoLife. Check your connection and try again.",
        details: {},
      },
      0,
    );
  }

  const envelope: Envelope<T> = toEnvelope<T>(await readBody(res), res.status);
  if (envelope.status === false) throw new ApiError(envelope.error, res.status);
  return envelope.data;
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
