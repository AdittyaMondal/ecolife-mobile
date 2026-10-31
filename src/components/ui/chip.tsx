import { Pressable, Text } from 'react-native';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** `radio` for a one-of-many segmented control, `checkbox` for a multi-select. */
  role?: 'radio' | 'checkbox' | 'button';
  accessibilityLabel?: string;
};

export function Chip({ label, selected, onPress, role = 'button', accessibilityLabel }: Props) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={role === 'radio' ? { selected } : { checked: selected }}
      onPress={onPress}
      style={{ minHeight: 44 }}
      className={`flex-row items-center justify-center rounded-full border px-4 ${
        selected ? 'border-primary bg-accent' : 'border-input bg-card'
      }`}
    >
      {/* A tick, not just the fill — colour is never the only signal (DESIGN.md). */}
      <Text className={`text-sm ${selected ? 'font-semibold text-eco-900' : 'text-foreground'}`}>
        {selected ? `✓ ${label}` : label}
      </Text>
    </Pressable>
  );
}
