import { Text, View } from 'react-native';
import { Chip } from './chip';

type Props<T extends string> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
};

/**
 * One-of-many. Wraps rather than scrolls, so four options still fit at 360px.
 */
export function Segmented<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label}>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option.value}
            role="radio"
            label={option.label}
            selected={value === option.value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
      {value === undefined ? (
        <Text className="mt-2 text-xs text-muted-foreground">
          Not answered — we'll estimate it.
        </Text>
      ) : null}
    </View>
  );
}
