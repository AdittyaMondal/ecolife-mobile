import { Pressable, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import type { Trip, TripMode } from '@/hooks/use-track';

const MODES = [
  { value: 'walk', label: 'Walk' },
  { value: 'cycle', label: 'Cycle' },
  { value: 'bus', label: 'Bus' },
  { value: 'metro_train', label: 'Metro / train' },
  { value: 'two_wheeler', label: 'Two-wheeler' },
  { value: 'car', label: 'Car' },
  { value: 'cab', label: 'Cab' },
  { value: 'auto_rickshaw', label: 'Auto' },
  { value: 'work_from_home', label: 'Worked from home' },
] as const satisfies readonly { value: TripMode; label: string }[];

const MODE_LABELS: Record<TripMode, string> = {
  walk: 'Walk',
  cycle: 'Cycle',
  bus: 'Bus',
  metro_train: 'Metro / train',
  two_wheeler: 'Two-wheeler',
  car: 'Car',
  cab: 'Cab',
  auto_rickshaw: 'Auto',
  work_from_home: 'Worked from home',
};

/** Working from home is a complete answer on its own (PRD-v2 §3.4) and has no distance. */
function hasDistance(mode: TripMode): boolean {
  return mode !== 'work_from_home';
}

/**
 * `km` stays a string while editing — a half-typed "1." is not a number, and coercing on every
 * keystroke fights the keyboard. `id` is local only: React needs a stable key for a row the
 * user can reorder by deleting, and an array index is not one.
 */
export type TripRow = { id: string; mode: TripMode; km: string };

let nextRowId = 0;
export function toTripRow(trip: Trip): TripRow {
  nextRowId += 1;
  return {
    id: `trip-${nextRowId}`,
    mode: trip.mode,
    km: hasDistance(trip.mode) ? String(trip.km) : '',
  };
}

export function tripRowsToTrips(rows: TripRow[]): Trip[] {
  return rows.map((row) => ({
    mode: row.mode,
    km: hasDistance(row.mode) ? Number.parseFloat(row.km) || 0 : 0,
  }));
}

type Props = {
  rows: TripRow[];
  onChange: (rows: TripRow[]) => void;
  /** From `trackToday.defaults.trips` — the baseline commute. */
  usualTrips: Trip[];
};

/**
 * Q1 — "How did you get around today?" (PRD-v2 §3.4). "Same as usual" is the one-tap path most
 * users take most days, so it is the primary action and sits above the rows it fills.
 */
export function TravelQuestion({ rows, onChange, usualTrips }: Props) {
  const update = (id: string, patch: Partial<TripRow>) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  return (
    <Card>
      <CardTitle title="1 · How did you get around?" />

      {usualTrips.length > 0 ? (
        <Button
          label="Same as usual"
          onPress={() => onChange(usualTrips.map(toTripRow))}
          accessibilityHint={`Fills in your usual commute: ${usualTrips
            .map((trip) =>
              hasDistance(trip.mode)
                ? `${MODE_LABELS[trip.mode]}, ${trip.km} kilometres`
                : MODE_LABELS[trip.mode],
            )
            .join('; ')}`}
          className="mt-3"
        />
      ) : null}

      <View className="mt-4 gap-4">
        {rows.map((row, index) => (
          <View key={row.id} className="rounded-xl border border-border p-3">
            <View className="flex-row items-center justify-between gap-2">
              <Text accessibilityRole="header" className="text-sm font-semibold text-foreground">
                Trip {index + 1}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove trip ${index + 1}, ${MODE_LABELS[row.mode]}`}
                onPress={() => onChange(rows.filter((candidate) => candidate.id !== row.id))}
                style={{ minHeight: 44, minWidth: 44 }}
                className="items-center justify-center"
              >
                <Text className="text-sm font-semibold text-destructive">Remove</Text>
              </Pressable>
            </View>

            <View
              accessibilityRole="radiogroup"
              accessibilityLabel={`Mode of transport for trip ${index + 1}`}
              className="mt-2 flex-row flex-wrap gap-2"
            >
              {MODES.map((mode) => (
                <Chip
                  key={mode.value}
                  role="radio"
                  label={mode.label}
                  selected={row.mode === mode.value}
                  onPress={() => update(row.id, { mode: mode.value })}
                />
              ))}
            </View>

            {hasDistance(row.mode) ? (
              <View className="mt-3 flex-row items-center gap-2">
                <Text className="text-sm text-foreground">Distance</Text>
                <TextInput
                  accessibilityLabel={`Distance in kilometres for trip ${index + 1}`}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  value={row.km}
                  onChangeText={(text) => update(row.id, { km: text.replace(/[^0-9.]/g, '') })}
                  placeholder="0"
                  style={{ minHeight: 44 }}
                  className="flex-1 rounded-xl border border-input bg-card px-3 text-base text-foreground"
                />
                <Text className="text-sm text-muted-foreground">km</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <Button
        label={rows.length === 0 ? 'Add a trip' : 'Add another trip'}
        variant="secondary"
        onPress={() => onChange([...rows, toTripRow({ mode: 'bus', km: 0 })])}
        className="mt-4"
      />

      {rows.length === 0 ? (
        <Text className="mt-3 text-xs text-muted-foreground">
          Left empty, we'll estimate travel from your baseline.
        </Text>
      ) : null}
    </Card>
  );
}
