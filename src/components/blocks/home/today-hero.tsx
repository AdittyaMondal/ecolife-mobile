import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { kg, percent, trend } from '@/components/ui/format';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { HomeToday } from '@/hooks/use-home';

/**
 * The top card and the biggest number on the screen (PRD-v2 §6.2). A day built mostly from
 * inferences is labelled as such — §3.5 is explicit that it must not be presented with the
 * same confidence as a fully logged one.
 */
export function TodayHero({ today, onLogPress }: { today: HomeToday; onLogPress: () => void }) {
  const delta = trend(today.deltaKg, {
    down: 'below your baseline',
    up: 'above your baseline',
    flat: 'level with your baseline',
  });

  return (
    <Card>
      <CardTitle title="Today" />

      <Text
        accessibilityRole="text"
        accessibilityLabel={`Today's footprint: ${kg(today.breakdown.totalKg)} kilograms of CO2 equivalent`}
        className="mt-2 text-5xl font-bold text-foreground"
      >
        {kg(today.breakdown.totalKg)}
        <Text className="text-xl font-semibold text-muted-foreground"> kg CO₂e</Text>
      </Text>

      {/* Arrow, word and colour all say the same thing, so colour is never load-bearing. */}
      <Text
        accessibilityLabel={
          delta.tone === 'flat'
            ? 'Level with your baseline'
            : `${kg(delta.magnitude)} kilograms ${delta.word}`
        }
        className={`mt-1 text-base font-semibold ${
          delta.tone === 'good'
            ? 'text-eco-700'
            : delta.tone === 'bad'
              ? 'text-destructive'
              : 'text-muted-foreground'
        }`}
      >
        {delta.tone === 'flat'
          ? `= ${delta.word}`
          : `${delta.arrow} ${kg(delta.magnitude)} kg ${delta.word}`}
      </Text>

      <View className="mt-4 flex-row items-center gap-3">
        <View className="flex-1">
          <ProgressBar
            percent={today.percentOfBaseline}
            label={`${percent(today.percentOfBaseline)} of your baseline of ${kg(today.baselineTotalKg)} kilograms`}
            tone={today.percentOfBaseline > 100 ? 'warning' : 'primary'}
          />
        </View>
        <Text className="text-sm font-semibold text-foreground">
          {percent(today.percentOfBaseline)}
        </Text>
      </View>

      {today.inferredCount > 0 ? (
        <Text
          accessibilityLabel={`Warning: ${today.inferredCount} of 5 categories are estimated, not logged`}
          className="mt-3 text-sm text-muted-foreground"
        >
          ⚠ {today.inferredCount} of 5 categories estimated
        </Text>
      ) : null}

      {today.logged ? null : (
        <Button
          label="Log today's activity"
          onPress={onLogPress}
          accessibilityHint="Opens the five daily questions on the Track tab"
          className="mt-4"
        />
      )}
    </Card>
  );
}
