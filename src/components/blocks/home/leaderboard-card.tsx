import { Text, View } from 'react-native';
import { Card, CardTitle } from '@/components/ui/card';
import { points } from '@/components/ui/format';
import type { LeaderboardPeek } from '@/hooks/use-home';

/** Medals are decoration; the rank number next to them is what is actually read out. */
const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardCard({ leaderboard }: { leaderboard: LeaderboardPeek }) {
  const { me } = leaderboard;

  return (
    <Card>
      <CardTitle title="Leaderboard" />

      {leaderboard.top.length === 0 ? (
        <Text className="mt-2 text-sm text-muted-foreground">
          No one has scored yet this period.
        </Text>
      ) : (
        <View className="mt-3 gap-2">
          {leaderboard.top.map((entry, index) => (
            <View
              key={entry.id}
              accessible
              accessibilityLabel={`Number ${entry.rank}, ${entry.name}, ${points(entry.pointsTotal)} points`}
              className="flex-row items-center gap-3"
            >
              <Text className="w-8 text-base">{MEDALS[index] ?? `#${entry.rank}`}</Text>
              <Text className="flex-1 text-base text-foreground" numberOfLines={1}>
                {entry.name}
              </Text>
              <Text className="text-base font-semibold text-foreground">
                {points(entry.pointsTotal)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className="mt-3 border-t border-border pt-3">
        {/* `me.rank` is nullable: a user with no points this period has no position. */}
        <View
          accessible
          accessibilityLabel={
            me.rank === null
              ? `You have ${points(me.pointsTotal)} points and are not ranked yet`
              : `You are number ${me.rank} with ${points(me.pointsTotal)} points`
          }
          className="flex-row items-center gap-3"
        >
          <Text className="w-8 text-sm font-semibold text-muted-foreground">
            {me.rank === null ? '—' : `#${points(me.rank)}`}
          </Text>
          <Text className="flex-1 text-base font-semibold text-foreground">
            {me.rank === null ? 'You — unranked' : 'You'}
          </Text>
          <Text className="text-base font-semibold text-foreground">{points(me.pointsTotal)}</Text>
        </View>
        {me.rank === null ? (
          <Text className="mt-1 text-xs text-muted-foreground">
            Log a day to earn points and join the ranking.
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
