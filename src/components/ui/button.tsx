import { Pressable, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  accessibilityHint?: string;
  className?: string;
};

/** 48px, comfortably over WCAG 2.2's 44px minimum (DESIGN.md). */
const MIN_TOUCH = 48;

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityHint,
  className,
}: Props) {
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{ minHeight: MIN_TOUCH }}
      className={`flex-row items-center justify-center rounded-xl px-5 ${
        primary ? 'bg-primary' : 'border border-input bg-card'
      } ${disabled ? 'opacity-50' : ''} ${className ?? ''}`}
    >
      <Text
        className={`text-center text-base font-semibold ${
          primary ? 'text-primary-foreground' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
