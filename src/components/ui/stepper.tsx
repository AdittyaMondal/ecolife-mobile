import { Pressable, Text, View } from 'react-native';

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

/**
 * `accessibilityRole="adjustable"` is the React Native idiom for a stepper: the whole control
 * is one focus stop that a screen reader nudges with increment/decrement, instead of two
 * unlabelled buttons. The −/+ targets are still 44px for everyone else.
 */
export function Stepper({ label, value, onChange, min = 0, max = 12 }: Props) {
  const set = (next: number) => onChange(Math.max(min, Math.min(max, next)));

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: `${value} ${label}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') set(value + 1);
        if (event.nativeEvent.actionName === 'decrement') set(value - 1);
      }}
      className="flex-row items-center justify-between"
    >
      <Text className="flex-1 pr-3 text-base text-foreground">{label}</Text>

      <View className="flex-row items-center">
        <Pressable
          onPress={() => set(value - 1)}
          disabled={value <= min}
          style={{ minHeight: 44, minWidth: 44 }}
          className={`items-center justify-center rounded-l-xl border border-input bg-card ${
            value <= min ? 'opacity-40' : ''
          }`}
        >
          <Text className="text-xl font-semibold text-foreground">−</Text>
        </Pressable>

        <View
          style={{ minHeight: 44, minWidth: 48 }}
          className="items-center justify-center border-y border-input bg-card"
        >
          <Text className="text-lg font-semibold text-foreground">{value}</Text>
        </View>

        <Pressable
          onPress={() => set(value + 1)}
          disabled={value >= max}
          style={{ minHeight: 44, minWidth: 44 }}
          className={`items-center justify-center rounded-r-xl border border-input bg-card ${
            value >= max ? 'opacity-40' : ''
          }`}
        >
          <Text className="text-xl font-semibold text-foreground">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
