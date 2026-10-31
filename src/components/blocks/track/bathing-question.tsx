import { View } from 'react-native';
import { Card, CardTitle } from '@/components/ui/card';
import { Segmented } from '@/components/ui/segmented';
import type { BathChoice } from '@/hooks/use-track';

const CHOICES = [
  { value: 'bucket', label: 'Bucket' },
  { value: 'short_shower', label: 'Short shower' },
  { value: 'long_shower', label: 'Long shower' },
] as const satisfies readonly { value: BathChoice; label: string }[];

/** Q4 — "How did you bathe?" (PRD-v2 §3.4). */
export function BathingQuestion({
  value,
  onChange,
}: {
  value: BathChoice | undefined;
  onChange: (value: BathChoice) => void;
}) {
  return (
    <Card>
      <CardTitle title="4 · How did you bathe?" />
      <View className="mt-3">
        <Segmented label="Bathing method" options={CHOICES} value={value} onChange={onChange} />
      </View>
    </Card>
  );
}
