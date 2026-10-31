import { View } from 'react-native';
import { Card, CardTitle } from '@/components/ui/card';
import { Segmented } from '@/components/ui/segmented';
import type { AcHoursBucket } from '@/hooks/use-track';

const BUCKETS = [
  { value: '0', label: '0' },
  { value: '1_3', label: '1–3 h' },
  { value: '4_8', label: '4–8 h' },
  { value: '8_plus', label: '8 h+' },
] as const satisfies readonly { value: AcHoursBucket; label: string }[];

/**
 * Q3 — "How long was the AC on?" (PRD-v2 §3.4). The caller renders this only when
 * `trackToday.askCooling` is true; a profile with no cooling is never asked.
 */
export function CoolingQuestion({
  value,
  onChange,
}: {
  value: AcHoursBucket | undefined;
  onChange: (value: AcHoursBucket) => void;
}) {
  return (
    <Card>
      <CardTitle title="3 · How long was the AC on?" />
      <View className="mt-3">
        <Segmented
          label="Hours of air conditioning"
          options={BUCKETS}
          value={value}
          onChange={onChange}
        />
      </View>
    </Card>
  );
}
