import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

/**
 * Android OAuth client for package `app.ecolife.mobile`.
 * Do not pass this as `webClientId` — that field must be a Web client.
 * Play Services selects this client from the app package and signing certificate.
 */
const ANDROID_CLIENT_ID =
  '789459681263-sovuuv1llrmccfijf2otrmorsdea2q3c.apps.googleusercontent.com';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

export type CalendarEventInput = {
  id: number;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  venueName: string;
  venueAddress: string | null;
};

let configured = false;

function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({ scopes: [CALENDAR_SCOPE] });
  configured = true;
}

export async function addEventToGoogleCalendar(event: CalendarEventInput): Promise<string> {
  const token = await calendarAccessToken();
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody(event)),
  });
  if (response.status === 401) {
    await GoogleSignin.clearCachedAccessToken(token);
    const retry = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await calendarAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody(event)),
    });
    return readCreatedId(retry);
  }
  return readCreatedId(response);
}

export async function removeEventFromGoogleCalendar(googleEventId: string): Promise<void> {
  const token = await calendarAccessToken();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 204 || response.status === 404 || response.status === 410) return;
  if (response.status === 401) {
    await GoogleSignin.clearCachedAccessToken(token);
    const retry = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${await calendarAccessToken()}` },
    });
    if (retry.status === 204 || retry.status === 404 || retry.status === 410) return;
    throw new Error(await googleError(retry));
  }
  throw new Error(await googleError(response));
}

async function calendarAccessToken(): Promise<string> {
  try {
    ensureConfigured();
    const playServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    if (!playServices) {
      throw new Error('Google Play services are missing or out of date on this phone.');
    }
    let signedIn = false;
    try {
      const silent = await GoogleSignin.signInSilently();
      signedIn = silent.type === 'success';
    } catch (error) {
      if (!isErrorWithCode(error) || error.code !== statusCodes.SIGN_IN_REQUIRED) throw error;
    }
    if (!signedIn) {
      const signed = await GoogleSignin.signIn();
      if (isCancelledResponse(signed) || !isSuccessResponse(signed)) {
        throw new Error('Google sign-in was cancelled.');
      }
    }
    const scoped = await GoogleSignin.addScopes({ scopes: [CALENDAR_SCOPE] });
    if (scoped && (isCancelledResponse(scoped) || !isSuccessResponse(scoped))) {
      throw new Error('Calendar access was not granted.');
    }
    const { accessToken } = await GoogleSignin.getTokens();
    if (!accessToken) throw new Error('Google did not return a calendar token.');
    return accessToken;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith('Google') || error.message.startsWith('Calendar'))
    ) {
      throw error;
    }
    throw authFailure(error);
  }
}

function authFailure(error: unknown): Error {
  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return new Error('Google sign-in was cancelled.');
    }
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return new Error('Google Play services are missing or out of date on this phone.');
    }
    if (error.code === statusCodes.IN_PROGRESS) {
      return new Error('Google sign-in is already open.');
    }
    if (String(error.code) === '10') {
      return new Error(
        `Google rejected this build. Android client ${ANDROID_CLIENT_ID} must list package app.ecolife.mobile and this APK’s SHA-1.`,
      );
    }
  }
  if (error instanceof Error) return error;
  return new Error('Could not open Google Calendar.');
}

function eventBody(event: CalendarEventInput) {
  const start = dateTime(event.startAt);
  const location = [event.venueName, event.venueAddress].filter(Boolean).join(', ');
  return {
    summary: event.title,
    description: event.description,
    location: location || undefined,
    start: { dateTime: start },
    end: { dateTime: endTime(event.startAt, event.endAt) },
    extendedProperties: { private: { ecolifeEventId: String(event.id) } },
  };
}

function dateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error('This event has no valid time.');
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function endTime(startIso: string, endIso: string): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(end) || end <= start) {
    return new Date(start + 2 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
  return dateTime(endIso);
}

async function readCreatedId(response: Response): Promise<string> {
  if (!response.ok) throw new Error(await googleError(response));
  const json = (await response.json()) as { id?: string };
  if (!json.id) throw new Error('Google Calendar did not return an event id.');
  return json.id;
}

async function googleError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string; status?: string; errors?: { reason?: string }[] };
    };
    const reason = body.error?.errors?.[0]?.reason;
    const message = body.error?.message ?? '';
    if (
      reason === 'accessNotConfigured' ||
      message.includes('has not been used in project') ||
      message.includes('is not been used') ||
      message.includes('accessNotConfigured')
    ) {
      return 'Enable the Google Calendar API on this Google Cloud project, then try again.';
    }
    if (response.status === 403 && message.toLowerCase().includes('insufficient')) {
      return 'This Google account did not grant calendar access.';
    }
    if (message) return message;
  } catch {
    // The body was not JSON.
  }
  return `Google Calendar returned ${response.status}.`;
}
