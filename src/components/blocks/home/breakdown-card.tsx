import { Text, View } from 'react-native';
import { Card, CardTitle } from '@/components/ui/card';
import { kg, percent } from '@/components/ui/format';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { Breakdown } from '@/hooks/use-home';

const CATEGORIES = [
  { key: 'transportKg', label: 'Transport' },
  { key: 'foodKg', label: 'Food' },
  { key: 'homeEnergyKg', label: 'Home energy' },
  { key: 'wasteKg', label: 'Waste' },
  { key: 'waterKg', label: 'Water' },
] as const satisfies readonly { key: keyof Breakdown; label: string }[];

export function BreakdownCard({ breakdown }: { breakdown: Breakdown }) {
  // Not `totalKg`: the five categories are what the bars are a share of, and a clamped or
  // rounded total would make the percentages disagree with the bars.
  const sum = CATEGORIES.reduce((running, category) => running + breakdown[category.key], 0);

  const rows = CATEGORIES.map((category) => ({
    ...category,
    value: breakdown[category.key],
    share: sum > 0 ? (breakdown[category.key] / sum) * 100 : 0,
  })).sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardTitle title="Breakdown (30 days)" />

      {sum === 0 ? (
        <Text className="mt-2 text-sm text-muted-foreground">
          Nothing to break down yet. Log a day and this fills in.
        </Text>
      ) : (
        <View className="mt-3 gap-3">
          {rows.map((row) => (
            <View key={row.key}>
              <View className="flex-row items-baseline justify-between gap-2">
                <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                  {row.label}
                </Text>
                <Text className="text-sm font-semibold text-foreground">{percent(row.share)}</Text>
                <Text className="w-20 text-right text-sm text-muted-foreground">
                  {kg(row.value)} kg
                </Text>
              </View>
              <View className="mt-1">
                <ProgressBar
                  percent={row.share}
                  label={`${row.label}: ${percent(row.share)} of the last 30 days, ${kg(row.value)} kilograms`}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
