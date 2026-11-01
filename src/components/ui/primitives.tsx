import { type ReactNode, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  TextInput,
  type TextInputProps,
  View,
  type ViewProps,
} from 'react-native';
import { clayShadow, hardShadow } from '@/lib/shadows';
import { colors } from '@/lib/theme';
import { T } from './text';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'forest' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}) {
  const busy = disabled || loading;
  const palette = {
    primary: 'border-ink bg-primary',
    forest: 'border-ink bg-secondary',
    outline: 'border-ink bg-card',
    ghost: 'border-transparent bg-transparent',
  }[variant];
  const text = variant === 'forest' ? 'text-cream' : 'text-ink';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={onPress}
      className={`min-h-[52px] flex-row items-center justify-center gap-2 rounded-full border-2 px-5 ${palette} ${busy ? 'opacity-60' : 'active:opacity-80'}`}
      style={variant === 'ghost' ? undefined : hardShadow}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'forest' ? colors.cream : colors.ink} />
      ) : (
        icon
      )}
      <T weight="bold" className={`text-base ${text}`}>
        {label}
      </T>
    </Pressable>
  );
}

export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View className="gap-2">
      <T weight="semibold" className="text-sm text-ink">
        {label}
      </T>
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        className="min-h-[52px] rounded-[18px] border-2 border-ink bg-card px-4 text-base text-ink"
        style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
        {...props}
      />
      {error ? (
        <T weight="semibold" className="text-sm text-destructive">
          {error}
        </T>
      ) : null}
    </View>
  );
}

export function ClayCard({
  children,
  className = '',
  style,
  ...props
}: ViewProps & { children: ReactNode }) {
  return (
    <View
      {...props}
      className={`rounded-[28px] border-2 border-ink bg-card p-4 ${className}`}
      style={[hardShadow, style]}
    >
      {children}
    </View>
  );
}

export function SoftCard({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: ViewProps['style'];
}) {
  return (
    <View className={`rounded-[28px] bg-card p-4 ${className}`} style={[clayShadow, style]}>
      {children}
    </View>
  );
}

export function ForestCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`overflow-hidden rounded-[32px] bg-secondary px-5 py-5 ${className}`}
      style={clayShadow}
    >
      {children}
    </View>
  );
}

export function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const body = (
    <View
      className={`rounded-full border-2 px-4 py-2 ${active ? 'border-ink bg-primary' : 'border-transparent bg-card'}`}
    >
      <T weight="bold" className="text-sm text-ink">
        {label}
      </T>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-80">
      {body}
    </Pressable>
  );
}

export function ChoiceTile({
  label,
  hint,
  selected,
  onPress,
  compact,
}: {
  label: string;
  hint?: string;
  selected?: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`rounded-[20px] border-2 px-3 py-3 active:opacity-80 ${selected ? 'border-ink bg-primary' : 'border-border bg-card'} ${compact ? 'min-h-[64px] items-center justify-center' : 'min-h-[72px] justify-center'}`}
      style={selected ? hardShadow : undefined}
    >
      <T weight="bold" className={`text-center text-ink ${compact ? 'text-sm' : 'text-base'}`}>
        {label}
      </T>
      {hint ? (
        <T className="mt-1 text-center text-xs text-muted-foreground" weight="medium">
          {hint}
        </T>
      ) : null}
    </Pressable>
  );
}

export function Note({ children }: { children: string }) {
  return (
    <View className="rounded-[18px] bg-accent px-3 py-2">
      <T className="text-xs leading-5 text-forest" weight="semibold">
        {children}
      </T>
    </View>
  );
}

export function EmptyBlock({ title, body }: { title: string; body: string }) {
  return (
    <SoftCard>
      <T weight="bold" className="text-lg text-ink">
        {title}
      </T>
      <T className="mt-1 text-sm leading-5 text-muted-foreground">{body}</T>
    </SoftCard>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <View className="items-center justify-center py-10">
      <ActivityIndicator color={colors.forest} />
      <T className="mt-3 text-sm text-muted-foreground">{label}</T>
    </View>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <ClayCard>
      <T weight="bold" className="text-base text-ink">
        That didn’t load
      </T>
      <T className="mt-1 text-sm leading-5 text-muted-foreground">{message}</T>
      {onRetry ? (
        <View className="mt-4">
          <Button label="Try again" variant="outline" onPress={onRetry} />
        </View>
      ) : null}
    </ClayCard>
  );
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="mb-3 mt-6 flex-row items-end justify-between">
      <T weight="extrabold" className="text-xl text-ink">
        {title}
      </T>
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <T weight="bold" className="text-sm text-forest">
            {action}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Stepper({
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-[22px] border-2 border-ink bg-card px-2 py-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        onPress={() => onChange(Math.max(min, value - 1))}
        className="h-12 w-12 items-center justify-center rounded-full bg-muted"
      >
        <T weight="extrabold" className="text-2xl text-ink">
          −
        </T>
      </Pressable>
      <View className="items-center">
        <T weight="extrabold" className="text-3xl text-ink">
          {value}
        </T>
        {suffix ? <T className="text-xs text-muted-foreground">{suffix}</T> : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase"
        onPress={() => onChange(Math.min(max, value + 1))}
        className="h-12 w-12 items-center justify-center rounded-full bg-primary"
      >
        <T weight="extrabold" className="text-2xl text-ink">
          +
        </T>
      </Pressable>
    </View>
  );
}

export function SliderField({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const width = useRef(1);
  const span = Math.max(1, max - min);
  const pct = ((value - min) / span) * 100;
  const setFromX = (x: number) => {
    const ratio = Math.min(1, Math.max(0, x / width.current));
    onChange(Math.round(min + ratio * span));
  };
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityValue={{ min, max, now: value }}
      className="h-14 justify-center"
      onLayout={(event) => {
        width.current = event.nativeEvent.layout.width || 1;
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => setFromX(event.nativeEvent.locationX)}
      onResponderMove={(event) => setFromX(event.nativeEvent.locationX)}
    >
      <View className="h-3 overflow-hidden rounded-full bg-muted">
        <View className="h-3 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </View>
      <View
        className="absolute h-8 w-8 rounded-full border-2 border-ink bg-primary"
        style={{ left: `${pct}%`, marginLeft: -16 }}
      />
    </View>
  );
}
