import { Text, View } from 'react-native';
import { Card, CardTitle } from '@/components/ui/card';
import type { NextEvent } from '@/hooks/use-home';

/**
 * "Sat 7 AM" (PRD-v2 §6.2). `startAt` is an ISO instant; the device renders it locally.
 * Null when it will not parse, so the venue is not left behind a stray separator.
 */
function whenLabel(startAt: string): string | null {
  const date = new Date(startAt);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.toLocaleDateString(undefined, { weekday: 'short' });
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${day} ${time}`;
}

/**
 * `nextEvent` is `anyOf: [$ref, null]`. Unlike the goal, §6.2 says this card is omitted when
 * there is nothing registered — events are discovered on their own tab, so an empty state
 * here would be an advert, not information.
 */
export function NextEventCard({ event }: { event: NextEvent | null }) {
  if (event === null) return null;

  const when = whenLabel(event.startAt);

  return (
    <Card>
      <CardTitle title="Next event" />

      <View
        accessible
        accessibilityLabel={`${event.title}, ${when === null ? '' : `${when}, `}at ${event.venueName}. ${
          event.passReady ? 'Your pass is ready.' : 'Your pass is not ready yet.'
        }`}
        className="mt-2"
      >
        <Text className="text-base font-semibold text-foreground" numberOfLines={2}>
          {event.title}
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          {when === null ? event.venueName : `${when} · ${event.venueName}`}
        </Text>
        <Text
          className={`mt-2 text-sm font-semibold ${
            event.passReady ? 'text-eco-700' : 'text-muted-foreground'
          }`}
        >
          {event.passReady ? '✓ Pass ready' : '… Pass pending'}
        </Text>
      </View>
    </Card>
  );
}
