import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Card, CardTitle } from '@/components/ui/card';
import { kg, percent, trend } from '@/components/ui/format';
import type { HomeWeek } from '@/hooks/use-home';
import { colors } from '@/lib/theme';

const HEIGHT = 48;
/** Room for the end dot's radius, so it is not clipped by the viewport edge. */
const PAD = 5;

/**
 * Seven points, hand-drawn. A charting library would be several hundred kilobytes to plot
 * seven numbers (PRD-v2 §6.2).
 */
function Sparkline({ points: series, label }: { points: HomeWeek['sparkline']; label: string }) {
  // SVG needs pixels, not percentages, to place a point — so measure the row first.
  const [width, setWidth] = useState(0);

  const values = series.map((point) => point.totalKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat week would divide by zero; it draws as a centred line instead.
  const span = max - min || 1;
  const lastIndex = series.length - 1;

  const x = (index: number) =>
    PAD + (lastIndex === 0 ? 0 : (index * (width - PAD * 2)) / lastIndex);
  const y = (value: number) => PAD + (1 - (value - min) / span) * (HEIGHT - PAD * 2);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ height: HEIGHT }}
      className="w-full"
    >
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          <Polyline
            points={series.map((point, index) => `${x(index)},${y(point.totalKg)}`).join(' ')}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {series.map((point, index) => (
            <Circle
              key={point.date}
              cx={x(index)}
              cy={y(point.totalKg)}
              r={index === lastIndex ? 4 : 2}
              fill={index === lastIndex ? colors.eco[800] : colors.primary}
            />
          ))}
        </Svg>
      ) : null}
    </View>
  );
}

export function WeekCard({ week }: { week: HomeWeek }) {
  const change = trend(week.changeVsLastWeekPct, {
    down: 'lower than last week',
    up: 'higher than last week',
    flat: 'the same as last week',
  });

  if (week.sparkline.length === 0) {
    return (
      <Card>
        <CardTitle title="This week" />
        <Text className="mt-2 text-sm text-muted-foreground">
          No days logged this week yet. Your first log starts the chart.
        </Text>
      </Card>
    );
  }

  const values = week.sparkline.map((point) => point.totalKg);

  return (
    <Card>
      <CardTitle title="This week" />

      <View className="mt-3">
        <Sparkline
          points={week.sparkline}
          label={`Daily footprint over ${week.sparkline.length} days, ranging from ${kg(
            Math.min(...values),
          )} to ${kg(Math.max(...values))} kilograms CO2 equivalent.`}
        />
      </View>

      <View className="mt-3 flex-row flex-wrap items-baseline gap-x-2">
        <Text
          accessibilityLabel={`Averaging ${kg(week.avgKgPerDay)} kilograms per day`}
          className="text-base font-semibold text-foreground"
        >
          Avg {kg(week.avgKgPerDay)} kg/day
        </Text>
        <Text
          accessibilityLabel={
            change.tone === 'flat'
              ? 'The same as last week'
              : `${percent(change.magnitude)} ${change.word}`
          }
          className={`text-sm font-semibold ${
            change.tone === 'good'
              ? 'text-eco-700'
              : change.tone === 'bad'
                ? 'text-destructive'
                : 'text-muted-foreground'
          }`}
        >
          {change.tone === 'flat'
            ? '= same as last week'
            : `${change.arrow} ${percent(change.magnitude)} vs last week`}
        </Text>
      </View>
    </Card>
  );
}
