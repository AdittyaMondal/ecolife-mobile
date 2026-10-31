import { Text, View } from 'react-native';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { percent } from '@/components/ui/format';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { ActiveGoalSummary } from '@/hooks/use-home';

/**
 * `activeGoal` is `anyOf: [$ref, null]` in the contract — genuinely nullable, because at most
 * one goal is active per user and most users have none. Null gets a real empty state, not a
 * hidden card: the goal is part of the loop (PRD-v2 §6.4) and a blank is a dead end.
 */
export function GoalCard({ goal }: { goal: ActiveGoalSummary | null }) {
  if (goal === null) {
    return (
      <Card>
        <CardTitle title="Active goal" />
        <View className="mt-3">
          <EmptyState
            title="No goal running"
            body="A goal turns a daily number into something to beat. Set one from Track."
          />
        </View>
      </Card>
    );
  }

  const dayWord = goal.daysLeft === 1 ? 'day' : 'days';

  return (
    <Card>
      <CardTitle title="Active goal" />

      <View className="mt-2 flex-row items-baseline justify-between gap-3">
        <Text accessibilityRole="header" className="flex-1 text-base font-semibold text-foreground">
          {goal.label}
        </Text>
        <Text className="text-sm font-semibold text-foreground">{percent(goal.progressPct)}</Text>
      </View>

      <View className="mt-3">
        <ProgressBar
          percent={goal.progressPct}
          label={`${goal.label}: ${percent(goal.progressPct)} complete`}
          tone={goal.onTrack ? 'primary' : 'warning'}
        />
      </View>

      {/* "on track" / "behind" in words — the bar's colour alone would not say which. */}
      <Text
        accessibilityLabel={`${goal.daysLeft} ${dayWord} left, ${goal.onTrack ? 'on track' : 'behind schedule'}`}
        className="mt-2 text-sm text-muted-foreground"
      >
        {goal.daysLeft} {dayWord} left ·{' '}
        <Text className={goal.onTrack ? 'text-eco-700' : 'text-destructive'}>
          {goal.onTrack ? '✓ on track' : '⚠ behind'}
        </Text>
      </Text>
    </Card>
  );
}
