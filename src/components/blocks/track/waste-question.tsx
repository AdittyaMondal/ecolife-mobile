import { Text, View } from 'react-native';
import { Card, CardTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import type { WasteAction } from '@/hooks/use-track';

const ACTIONS = [
  { value: 'segregated', label: 'Segregated' },
  { value: 'composted', label: 'Composted' },
  { value: 'refused_plastic', label: 'Refused plastic' },
  { value: 'none_of_these', label: 'None of these' },
] as const satisfies readonly { value: WasteAction; label: string }[];

/**
 * Q5 — "Waste today?" Multi-select (PRD-v2 §3.4). "None of these" is exclusive: it and any
 * other answer contradict each other, so picking one clears the other.
 */
export function WasteQuestion({
  value,
  onChange,
}: {
  value: WasteAction[];
  onChange: (value: WasteAction[]) => void;
}) {
  const toggle = (action: WasteAction) => {
    if (action === 'none_of_these') {
      onChange(value.includes('none_of_these') ? [] : ['none_of_these']);
      return;
    }
    const withoutNone = value.filter((selected) => selected !== 'none_of_these');
    onChange(
      withoutNone.includes(action)
        ? withoutNone.filter((selected) => selected !== action)
        : [...withoutNone, action],
    );
  };

  return (
    <Card>
      <CardTitle title="5 · Waste today?" />
      <View className="mt-3 flex-row flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <Chip
            key={action.value}
            role="checkbox"
            label={action.label}
            selected={value.includes(action.value)}
            onPress={() => toggle(action.value)}
          />
        ))}
      </View>
      <Text className="mt-2 text-xs text-muted-foreground">Pick as many as apply.</Text>
    </Card>
  );
}
