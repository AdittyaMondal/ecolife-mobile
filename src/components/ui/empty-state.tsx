import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

/** A real empty state, not a blank card — a nullable field in the contract gets one of these. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <View className="items-start">
      <Text accessibilityRole="header" className="text-base font-semibold text-foreground">
        {title}
      </Text>
      <Text className="mt-1 text-sm text-muted-foreground">{body}</Text>
      {action ? <View className="mt-4 w-full">{action}</View> : null}
    </View>
  );
}
