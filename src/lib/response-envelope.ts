/**
 * Every EcoLife response is enveloped (PRD-v2 §8):
 *   success  { status: true,  data: T,    error: null }
 *   failure  { status: false, data: null, error: { code, message, details } }
 *
 * A proxy, gateway or crash can still hand us an empty body or an HTML error page. Those are
 * normalised here into an envelope failure so no raw body ever reaches a user.
 */
export type ApiErrorBody = {
  code: string;
  message: string;
  details: Record<string, unknown>;
};

export type Envelope<T> =
  | { status: true; data: T; error: null }
  | { status: false; data: null; error: ApiErrorBody };

/** Plain-language fallbacks, keyed by HTTP status, for a response with no usable envelope. */
const STATUS_MESSAGES: Record<number, string> = {
  400: "That request wasn't valid. Please check what you entered and try again.",
  401: 'Please sign in again to continue.',
  403: "You don't have access to that.",
  404: "We couldn't find that.",
  408: 'The request took too long. Please try again.',
  409: "That's already been done.",
  422: "Some of those details weren't valid. Please check them and try again.",
  429: "You've done that a few too many times. Please wait a moment.",
  500: 'Something went wrong on our end. Please try again shortly.',
  502: "We couldn't reach EcoLife. Please try again shortly.",
  503: 'EcoLife is temporarily unavailable. Please try again shortly.',
  504: 'EcoLife took too long to respond. Please try again shortly.',
};

export function messageForStatus(httpStatus: number): string {
  const exact = STATUS_MESSAGES[httpStatus];
  if (exact) return exact;
  if (httpStatus >= 500) return 'Something went wrong on our end. Please try again shortly.';
  if (httpStatus >= 400) return "That request couldn't be completed. Please try again.";
  return 'Something unexpected happened. Please try again.';
}

/** `GEN_500` / `GEN_429` keep the shape of a real server code so callers can branch uniformly. */
export function codeForStatus(httpStatus: number): string {
  if (httpStatus === 429) return 'GEN_429';
  if (httpStatus === 401) return 'AUTH_002';
  return `GEN_${httpStatus}`;
}

function isEnvelope(value: unknown): value is Envelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    typeof (value as { status: unknown }).status === 'boolean' &&
    'error' in value
  );
}

function normaliseError(error: unknown, httpStatus: number): ApiErrorBody {
  const e = error as Partial<ApiErrorBody> | null | undefined;
  return {
    code: typeof e?.code === 'string' ? e.code : codeForStatus(httpStatus),
    // Trust the server's prose only when a code came with it; otherwise substitute our own.
    message:
      typeof e?.code === 'string' && typeof e.message === 'string'
        ? e.message
        : messageForStatus(httpStatus),
    details: typeof e?.details === 'object' && e.details !== null ? e.details : {},
  };
}

/**
 * Turn any HTTP response into an envelope. `raw` is whatever came off the wire — a parsed
 * object, a string (HTML error page), or `undefined` (empty body).
 */
export function toEnvelope<T>(raw: unknown, httpStatus: number): Envelope<T> {
  if (isEnvelope(raw)) {
    if (raw.status === true) return { status: true, data: raw.data as T, error: null };
    return { status: false, data: null, error: normaliseError(raw.error, httpStatus) };
  }

  // Not an envelope: empty body, HTML error page, or a bare object from something that is not
  // our server. A 2xx here means the contract is broken, which is still a failure.
  return {
    status: false,
    data: null,
    error: {
      code: httpStatus >= 200 && httpStatus < 300 ? 'GEN_500' : codeForStatus(httpStatus),
      message:
        httpStatus >= 200 && httpStatus < 300
          ? 'Something went wrong on our end. Please try again shortly.'
          : messageForStatus(httpStatus),
      details: {},
    },
  };
}
