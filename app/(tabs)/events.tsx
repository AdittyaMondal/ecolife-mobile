import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { Screen, TopBar } from '@/components/ui/header';
import { PressableScale, Rise } from '@/components/ui/motion';
import { Note, Pill } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { EVENT_LABELS } from '@/data/content';
import { useEventList } from '@/hooks/resources';
import { formatWhen } from '@/lib/format';
import { hardShadow } from '@/lib/shadows';
import { useAuth } from '@/providers/auth-provider';

const FILTERS = [
  'all',
  'plant_drive',
  'cleanup_drive',
  'workshop',
  'recycling_drive',
  'awareness',
] as const;

export default function Events() {
  const { isEmployee, user, local } = useAuth();
  const [type, setType] = useState<(typeof FILTERS)[number]>('all');
  const { events, source, loading } = useEventList(type);
  const featured = events[0];
  const registered = events.filter((event) => event.viewer.registered);

  return (
    <Screen dock>
      <TopBar eyebrow="Community" title="Events" avatar />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row gap-2">
          {FILTERS.map((item) => (
            <Pill
              key={item}
              label={item === 'all' ? 'All' : (EVENT_LABELS[item] ?? item)}
              active={type === item}
              onPress={() => setType(item)}
            />
          ))}
        </View>
      </ScrollView>
      {isEmployee ? (
        <View className="mb-4">
          <Note>
            {`You can see public events and ${user?.organization?.name ?? local.organizationName ?? 'your organization'} events.`}
          </Note>
        </View>
      ) : (
        <View className="mb-4">
          <Note>Public events are open to every EcoLife account.</Note>
        </View>
      )}
      {source === 'device' ? (
        <View className="mb-4">
          <Note>
            These events are samples on this phone. Registering saves a device pass, not a venue QR.
          </Note>
        </View>
      ) : null}
      {loading ? <T className="text-muted-foreground">Looking for events…</T> : null}
      {featured ? (
        <Rise>
          <PressableScale
            onPress={() => router.push(`/event/${featured.slug}` as Href)}
            className="mb-4 overflow-hidden rounded-[28px] border-2 border-ink"
            style={hardShadow}
          >
            {featured.coverUrl ? (
              <Image source={{ uri: featured.coverUrl }} className="h-44 w-full" />
            ) : (
              <View className="h-44 bg-accent" />
            )}
            <View className="bg-card p-4">
              <T className="text-xs uppercase tracking-wide text-forest">
                {EVENT_LABELS[featured.type]}
              </T>
              <T weight="extrabold" className="text-2xl text-ink">
                {featured.title}
              </T>
              <T className="mt-1 text-sm text-muted-foreground">
                {formatWhen(featured.startAt, user?.timezone)} · {featured.venueName}
              </T>
            </View>
          </PressableScale>
        </Rise>
      ) : null}
      {registered.length > 0 ? (
        <View className="mb-4">
          <T weight="extrabold" className="mb-2 text-lg text-ink">
            Your pass
          </T>
          {registered.map((event, index) => (
            <Rise key={event.slug} index={index}>
              <PressableScale
                onPress={() => router.push(`/event/${event.slug}` as Href)}
                className="mb-2 rounded-[22px] bg-card p-4"
              >
                <T weight="bold" className="text-ink">
                  {event.title}
                </T>
                <T className="text-sm text-forest">{event.sample ? 'Device pass' : 'Registered'}</T>
              </PressableScale>
            </Rise>
          ))}
        </View>
      ) : null}
      <View className="gap-3">
        {events.slice(1).map((event, index) => (
          <Rise key={event.slug} index={index}>
            <PressableScale
              onPress={() => router.push(`/event/${event.slug}` as Href)}
              className="overflow-hidden rounded-[24px] bg-card"
            >
              <View className="flex-row">
                {event.coverUrl ? (
                  <Image source={{ uri: event.coverUrl }} className="h-28 w-28" />
                ) : (
                  <View className="h-28 w-28 bg-accent" />
                )}
                <View className="flex-1 justify-center px-3">
                  <T className="text-[11px] uppercase text-forest">
                    {EVENT_LABELS[event.type]}
                    {event.audience === 'organization' ? ' · Organization' : ''}
                  </T>
                  <T weight="bold" className="text-base text-ink" numberOfLines={2}>
                    {event.title}
                  </T>
                  <T className="text-xs text-muted-foreground">{event.venueName}</T>
                  {event.pointsLabel && event.sample ? (
                    <T weight="bold" className="mt-1 text-xs text-forest">
                      {event.pointsLabel} sample
                    </T>
                  ) : null}
                </View>
              </View>
            </PressableScale>
          </Rise>
        ))}
      </View>
      {!loading && events.length === 0 ? (
        <T className="mt-6 text-center text-muted-foreground">No events in this category.</T>
      ) : null}
    </Screen>
  );
}
