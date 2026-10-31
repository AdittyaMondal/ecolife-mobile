import { Text, View } from 'react-native';
import { points } from '@/components/ui/format';
import type { LeaderboardPeek, Wallet } from '@/hooks/use-home';

/** The payload carries the name, not the salutation — the hour is the device's to know. */
function salutation(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function GreetingHeader({
  name,
  wallet,
  rank,
}: {
  name: string;
  wallet: Wallet;
  rank: LeaderboardPeek['me']['rank'];
}) {
  const greeting = `${salutation(new Date().getHours())}, ${name}`;

  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text
        accessibilityRole="header"
        className="flex-1 text-2xl font-bold text-foreground"
        numberOfLines={2}
      >
        {greeting}
      </Text>

      <View className="items-end">
        <Text
          accessibilityLabel={`${points(wallet.coinsBalance)} coins`}
          className="text-base font-semibold text-eco-700"
        >
          🪙 {points(wallet.coinsBalance)}
        </Text>
        {/* `rank` is nullable in the contract — a user with no points has no position yet. */}
        <Text
          accessibilityLabel={rank === null ? 'Not ranked yet' : `Ranked number ${rank}`}
          className="text-sm text-muted-foreground"
        >
          {rank === null ? 'Unranked' : `#${points(rank)}`}
        </Text>
      </View>
    </View>
  );
}
