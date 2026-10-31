import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-2xl border border-border bg-card p-5 ${className ?? ''}`}>
      {children}
    </View>
  );
}

/**
 * The small caps label every Home card opens with (PRD-v2 §6.2).
 *
 * Takes `title` rather than children: biome's `noReactNativeRawText` is AST-based and cannot
 * see that this renders a <Text>, and silencing it would mean editing biome.json.
 */
export function CardTitle({ title }: { title: string }) {
  return (
    <Text
      accessibilityRole="header"
      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
    >
      {title}
    </Text>
  );
}
