import { Text, View } from 'react-native';
import { Card } from '@/components/ui/card';
import type { Streak } from '@/hooks/use-home';

export function StreakCard({ streak }: { streak: Streak }) {
  const dayWord = streak.current === 1 ? 'day' : 'days';

  return (
    <Card>
      <View className="flex-row items-center justify-between gap-3">
        <Text
          accessibilityLabel={
            streak.current === 0
              ? 'No streak yet. Log today to start one.'
              : `${streak.current}-${dayWord} streak`
          }
          className="flex-1 text-base font-semibold text-foreground"
        >
          {streak.current === 0
            ? '🔥 Log today to start a streak'
            : `🔥 ${streak.current}-${dayWord} streak`}
        </Text>
        <Text
          accessibilityLabel={`Longest streak: ${streak.longest} days`}
          className="text-sm text-muted-foreground"
        >
          Best {streak.longest}
        </Text>
      </View>
    </Card>
  );
}
