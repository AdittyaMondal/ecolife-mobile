import * as Calendar from 'expo-calendar';

export type CalendarEventInput = {
  id: number;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  venueName: string;
  venueAddress: string | null;
};

export async function addEventToGoogleCalendar(event: CalendarEventInput): Promise<string> {
  const calendar = await writableCalendar();
  const created = await calendar.createEvent({
    title: event.title,
    startDate: new Date(event.startAt),
    endDate: new Date(endIso(event.startAt, event.endAt)),
    location: [event.venueName, event.venueAddress].filter(Boolean).join(', ') || null,
    notes: event.description,
  });
  if (!created.id) throw new Error('The calendar did not save this event.');
  return created.id;
}

export async function removeEventFromGoogleCalendar(eventId: string): Promise<void> {
  try {
    const existing = await Calendar.ExpoCalendarEvent.get(eventId);
    await existing.delete();
  } catch {
    // Already removed from the phone calendar.
  }
}

async function writableCalendar() {
  const permission = await Calendar.requestCalendarPermissions();
  if (permission.status !== 'granted') {
    throw new Error('Calendar permission was not granted.');
  }
  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  const writable = calendars.filter((calendar) => calendar.allowsModifications);
  const google = writable.find((calendar) => isGoogleCalendar(calendar));
  const chosen = google ?? writable.find((calendar) => calendar.isPrimary) ?? writable[0];
  if (!chosen) throw new Error('This phone has no calendar EcoLife can write to.');
  return chosen;
}

function isGoogleCalendar(calendar: Calendar.ExpoCalendar): boolean {
  const source = calendar.source;
  const label = [source?.name, source?.type, calendar.ownerAccount, calendar.title]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return label.includes('google');
}

function endIso(startIso: string, endIsoValue: string): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIsoValue).getTime();
  if (Number.isNaN(start)) throw new Error('This event has no valid time.');
  if (Number.isNaN(end) || end <= start) return new Date(start + 2 * 60 * 60 * 1000).toISOString();
  return endIsoValue;
}
