import { Text, View } from 'react-native';

/** Route stub. Every screen but Home is this until its sprint lands. */
export function ScreenPlaceholder({ title }: { title: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-xl font-semibold text-foreground">{title}</Text>
    </View>
  );
}
