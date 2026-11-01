import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import type { CalendarEventInput } from './google-calendar';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

let configured = false;

export async function insertGoogleCalendarEvent(event: CalendarEventInput): Promise<string> {
  const body = {
    summary: event.title,
    description: event.description,
    location: [event.venueName, event.venueAddress].filter(Boolean).join(', ') || undefined,
    start: { dateTime: new Date(event.startAt).toISOString() },
    end: { dateTime: new Date(endIso(event.startAt, event.endAt)).toISOString() },
  };
  const response = await calendarFetch('', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const created = (await response.json()) as { id?: unknown };
  if (typeof created.id !== 'string' || !created.id) {
    throw new Error('Google Calendar did not save this event.');
  }
  return created.id;
}

export async function deleteGoogleCalendarEvent(eventId: string): Promise<void> {
  await calendarFetch(`/${encodeURIComponent(eventId)}`, { method: 'DELETE' }, [404, 410]);
}

async function calendarFetch(
  path: string,
  init: RequestInit,
  accept: number[] = [],
): Promise<Response> {
  let token = await calendarAccessToken();
  let response = await authorized(token, path, init);
  if (response.status === 401) {
    await GoogleSignin.clearCachedAccessToken(token);
    token = await calendarAccessToken();
    response = await authorized(token, path, init);
  }
  if (response.status === 403) {
    const failure = await googleFailure(response.clone());
    if (failure.reason !== 'insufficientPermissions') throw new Error(failure.message);
    await grantCalendarScope();
    token = await calendarAccessToken();
    response = await authorized(token, path, init);
  }
  if (!response.ok && !accept.includes(response.status)) {
    throw new Error((await googleFailure(response)).message);
  }
  return response;
}

function endIso(startIso: string, endIsoValue: string): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIsoValue).getTime();
  if (Number.isNaN(start)) throw new Error('This event has no valid time.');
  if (Number.isNaN(end) || end <= start) return new Date(start + 2 * 60 * 60 * 1000).toISOString();
  return endIsoValue;
}

async function authorized(token: string, path: string, init: RequestInit): Promise<Response> {
  return fetch(`${CALENDAR_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

async function calendarAccessToken(): Promise<string> {
  configure();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    await ensureSignedIn();
    await grantCalendarScope();
    const { accessToken } = await GoogleSignin.getTokens();
    if (!accessToken) throw new Error('Google did not return a calendar token.');
    return accessToken;
  } catch (error) {
    throw new Error(signInMessage(error));
  }
}

function configure(): void {
  if (configured) return;
  GoogleSignin.configure({ scopes: [CALENDAR_SCOPE] });
  configured = true;
}

async function ensureSignedIn(): Promise<void> {
  if (GoogleSignin.hasPreviousSignIn()) {
    const silent = await GoogleSignin.signInSilently();
    if (silent.type === 'success') return;
  }
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) throw new Error('Google sign-in was cancelled.');
}

async function grantCalendarScope(): Promise<void> {
  const user = GoogleSignin.getCurrentUser();
  if (user?.scopes.includes(CALENDAR_SCOPE)) return;
  const added = await GoogleSignin.addScopes({ scopes: [CALENDAR_SCOPE] });
  if (!added || !isSuccessResponse(added)) {
    throw new Error('Google Calendar permission was not granted.');
  }
}

function signInMessage(error: unknown): string {
  if (error instanceof Error && !isErrorWithCode(error)) return error.message;
  if (!isErrorWithCode(error)) return 'Google Calendar sign-in failed.';
  if (error.code === statusCodes.SIGN_IN_CANCELLED) return 'Google sign-in was cancelled.';
  if (error.code === statusCodes.IN_PROGRESS) return 'Google sign-in is already open.';
  if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return 'Google Play services are missing or out of date on this phone.';
  }
  if (error.code === '10') {
    return 'Google rejected sign-in. This build’s certificate does not match the Calendar client.';
  }
  return error.message || 'Google Calendar sign-in failed.';
}

async function googleFailure(response: Response): Promise<{ reason: string; message: string }> {
  const text = await response.text();
  let reason = '';
  let message = '';
  try {
    const body = JSON.parse(text) as {
      error?: { message?: string; errors?: { reason?: string }[] };
    };
    reason = body.error?.errors?.[0]?.reason ?? '';
    message = body.error?.message ?? '';
  } catch {
    message = '';
  }
  if (reason === 'accessNotConfigured' || /has not been used|it is disabled/i.test(message)) {
    return {
      reason,
      message: 'Turn on the Google Calendar API for this app’s Cloud project, then try again.',
    };
  }
  if (reason === 'insufficientPermissions') {
    return { reason, message: 'Allow EcoLife to add events to Google Calendar, then try again.' };
  }
  if (message && message.length < 180 && !message.startsWith('<')) {
    return { reason, message };
  }
  return { reason, message: `Google Calendar could not update this event (${response.status}).` };
}
