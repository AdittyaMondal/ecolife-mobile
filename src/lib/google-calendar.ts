import { isRunningInExpoGo } from 'expo';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export type CalendarEventInput = {
  id: number;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  venueName: string;
  venueAddress: string | null;
};

/** Google event id when the Calendar API saved it. Null when Google Calendar was opened for the user to save. */
export async function addEventToGoogleCalendar(event: CalendarEventInput): Promise<string | null> {
  if (!canUseCalendarApi()) {
    await openCalendarDraft(event);
    return null;
  }
  const api = await import('./google-calendar-api');
  return api.insertGoogleCalendarEvent(event);
}

export async function removeEventFromGoogleCalendar(eventId: string): Promise<void> {
  if (!canUseCalendarApi()) return;
  const api = await import('./google-calendar-api');
  await api.deleteGoogleCalendarEvent(eventId);
}

function canUseCalendarApi(): boolean {
  return Platform.OS !== 'web' && !isRunningInExpoGo();
}

async function openCalendarDraft(event: CalendarEventInput): Promise<void> {
  const start = compactUtc(event.startAt);
  const end = compactUtc(endIso(event.startAt, event.endAt));
  const location = [event.venueName, event.venueAddress].filter(Boolean).join(', ');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
  });
  if (location) params.set('location', location);
  try {
    await Linking.openURL(
      `https://calendar.google.com/calendar/render?${params.toString()}&dates=${start}/${end}`,
    );
  } catch {
    throw new Error('This phone could not open Google Calendar.');
  }
}

function compactUtc(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error('This event has no valid time.');
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function endIso(startIso: string, endIsoValue: string): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIsoValue).getTime();
  if (Number.isNaN(start)) throw new Error('This event has no valid time.');
  if (Number.isNaN(end) || end <= start) return new Date(start + 2 * 60 * 60 * 1000).toISOString();
  return endIsoValue;
}
