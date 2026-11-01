import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Screen, TopBar } from '@/components/ui/header';
import { Button, ErrorBlock, LoadingBlock, Note } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { EVENT_LABELS } from '@/data/content';
import { useEventDetail, usePass } from '@/hooks/resources';
import { errorMessage } from '@/lib/errors';
import { api } from '@/lib/fetcher';
import { formatWhen } from '@/lib/format';
import { addEventToGoogleCalendar, removeEventFromGoogleCalendar } from '@/lib/google-calendar';
import { useAuth } from '@/providers/auth-provider';

export default function EventDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { event, loading, error } = useEventDetail(slug ?? '');
  const { user, local, updateLocal } = useAuth();
  const client = useQueryClient();
  const [pending, setPending] = useState<null | 'join' | 'calendar' | 'cancel'>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const pass = usePass(
    event && !event.sample && event.viewer.registered ? event.id : 0,
    Boolean(event && !event.sample && event.viewer.registered),
  );

  if (loading && !event) {
    return (
      <Screen>
        <TopBar title="Event" back />
        <LoadingBlock />
      </Screen>
    );
  }
  if (!event) {
    return (
      <Screen>
        <TopBar title="Event" back />
        <ErrorBlock message={error ?? 'Event not found.'} />
      </Screen>
    );
  }

  async function rememberOnCalendar(current: NonNullable<typeof event>) {
    const existing = local.calendarEvents?.[String(current.id)];
    if (existing) {
      return { text: 'This event is already on your calendar.', ok: true };
    }
    const savedOnDevice = current.sample || current.id < 0;
    try {
      const googleEventId = await addEventToGoogleCalendar(current);
      await updateLocal((state) => ({
        ...state,
        calendarEvents: {
          ...(state.calendarEvents ?? {}),
          [String(current.id)]: googleEventId,
        },
      }));
      return {
        text: savedOnDevice
          ? 'Saved on this phone, and added to your calendar. This is not a venue pass.'
          : 'You’re registered, and the event is on your calendar.',
        ok: true,
      };
    } catch (err) {
      const reason = errorMessage(err);
      return {
        text: savedOnDevice
          ? `Saved on this phone. Your calendar was not updated: ${reason}`
          : `You’re registered. Your calendar was not updated: ${reason}`,
        ok: false,
      };
    }
  }

  async function register() {
    if (!event) return;
    setPending('join');
    setMessage(null);
    try {
      if (event.sample || event.id < 0) {
        await updateLocal((state) => ({
          ...state,
          eventRegistrations: state.eventRegistrations.includes(event.id)
            ? state.eventRegistrations
            : [...state.eventRegistrations, event.id],
        }));
      } else {
        await api.post(`/events/${event.id}/register`);
        await client.invalidateQueries();
      }
      const calendar = await rememberOnCalendar(event);
      setMessage(calendar);
    } catch (err) {
      setMessage({ text: errorMessage(err), ok: false });
    } finally {
      setPending(null);
    }
  }

  async function addCalendar() {
    if (!event) return;
    setPending('calendar');
    setMessage(null);
    try {
      setMessage(await rememberOnCalendar(event));
    } catch (err) {
      setMessage({ text: errorMessage(err), ok: false });
    } finally {
      setPending(null);
    }
  }

  async function cancel() {
    if (!event) return;
    const current = event;
    setPending('cancel');
    setMessage(null);
    try {
      if (!(current.sample || current.id < 0)) {
        await api.delete(`/events/${current.id}/register`);
        await client.invalidateQueries();
      } else {
        await updateLocal((state) => ({
          ...state,
          eventRegistrations: state.eventRegistrations.filter((id) => id !== current.id),
        }));
      }
      const googleEventId = local.calendarEvents?.[String(current.id)];
      if (googleEventId) {
        try {
          await removeEventFromGoogleCalendar(googleEventId);
          await updateLocal((state) => {
            const calendarEvents = { ...(state.calendarEvents ?? {}) };
            delete calendarEvents[String(current.id)];
            return { ...state, calendarEvents };
          });
          setMessage({
            text: 'Registration cancelled, and the event was removed from your calendar.',
            ok: true,
          });
        } catch (err) {
          setMessage({
            text: `Registration cancelled. Your calendar still has the event: ${errorMessage(err)}`,
            ok: false,
          });
        }
      } else {
        setMessage({ text: 'Registration cancelled.', ok: true });
      }
    } catch (err) {
      setMessage({ text: errorMessage(err), ok: false });
    } finally {
      setPending(null);
    }
  }

  const registered = event.viewer.registered;
  const onCalendar = Boolean(local.calendarEvents?.[String(event.id)]);

  return (
    <Screen
      footer={
        registered ? (
          <View className="gap-3">
            {onCalendar ? null : (
              <Button
                label="Add to calendar"
                onPress={() => void addCalendar()}
                loading={pending === 'calendar'}
                disabled={pending !== null}
              />
            )}
            <Button
              label="Cancel registration"
              variant="outline"
              onPress={() => void cancel()}
              loading={pending === 'cancel'}
              disabled={pending !== null}
            />
          </View>
        ) : (
          <Button
            label="Register"
            variant="forest"
            onPress={() => void register()}
            loading={pending === 'join'}
          />
        )
      }
    >
      <TopBar title="Event" back />
      {event.coverUrl ? (
        <Image source={{ uri: event.coverUrl }} className="h-52 w-full rounded-[28px]" />
      ) : (
        <View className="h-52 rounded-[28px] bg-accent" />
      )}
      <T className="mt-4 text-xs uppercase tracking-wide text-forest">
        {EVENT_LABELS[event.type]}
        {event.audience === 'organization' ? ' · Organization' : ' · Public'}
        {event.sample ? ' · Sample' : ''}
      </T>
      <T weight="extrabold" className="text-3xl text-ink">
        {event.title}
      </T>
      <T className="mt-2 text-base leading-6 text-muted-foreground">{event.description}</T>
      <View className="mt-4 gap-2">
        <Row label="When" value={formatWhen(event.startAt, user?.timezone)} />
        <Row
          label="Where"
          value={[event.venueName, event.venueAddress].filter(Boolean).join(' · ')}
        />
        <Row label="Going" value={`${event.registeredCount} of ${event.capacity}`} />
        <Row label="Status" value={registered ? 'Registered' : event.status} />
      </View>
      {event.sample && registered ? (
        <View className="mt-5 items-center rounded-[28px] bg-card p-5">
          <T weight="bold" className="mb-3 text-ink">
            Device pass
          </T>
          <QRCode value={`ecolife://device-pass/${event.slug}`} size={160} />
          <View className="mt-3">
            <Note>Show this only as a reminder. Hosts cannot scan a device pass.</Note>
          </View>
        </View>
      ) : null}
      {pass.data ? (
        <View className="mt-5 items-center rounded-[28px] bg-card p-5">
          <T weight="bold" className="mb-1 text-ink">
            Your pass
          </T>
          <T className="mb-3 text-sm text-muted-foreground">{pass.data.status}</T>
          {pass.data.qrPayload || pass.data.passCode ? (
            <QRCode value={pass.data.qrPayload || pass.data.passCode} size={180} />
          ) : (
            <Note>The pass code is not on this phone yet.</Note>
          )}
        </View>
      ) : null}
      {message ? (
        <T
          weight="semibold"
          className={`mt-4 text-sm ${message.ok ? 'text-forest' : 'text-destructive'}`}
        >
          {message.text}
        </T>
      ) : null}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 rounded-[18px] bg-card px-4 py-3">
      <T className="text-muted-foreground">{label}</T>
      <T weight="bold" className="flex-1 text-right text-ink">
        {value}
      </T>
    </View>
  );
}
