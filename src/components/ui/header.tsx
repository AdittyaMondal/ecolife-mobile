import { router } from 'expo-router';
import { Bell, ChevronLeft, Menu } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMenu } from '@/components/menu-sheet';
import { colors } from '@/lib/theme';
import { useAuth } from '@/providers/auth-provider';
import { Avatar } from './avatar';
import { T } from './text';

export function Screen({
  children,
  footer,
  dock = false,
}: {
  children: ReactNode;
  footer?: ReactNode;
  dock?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const dockLift = dock ? 108 + Math.max(insets.bottom - 10, 0) : 0;
  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: (dock ? 168 : 28) + insets.bottom + (footer ? 84 : 0),
        }}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View
          className="absolute left-0 right-0 border-t border-border bg-background px-5 pt-3"
          style={{
            bottom: dockLift,
            paddingBottom: dock ? 12 : Math.max(insets.bottom, 12),
          }}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export function TopBar({
  eyebrow,
  title,
  back,
  avatar,
}: {
  eyebrow?: string;
  title: string;
  back?: boolean;
  avatar?: boolean;
}) {
  const menu = useMenu();
  const { user } = useAuth();
  return (
    <View className="mb-4 flex-row items-center gap-3">
      {back ? (
        <IconButton label="Back" onPress={() => router.back()}>
          <ChevronLeft color={colors.ink} size={22} />
        </IconButton>
      ) : (
        <IconButton label="Open menu" onPress={menu.open}>
          <Menu color={colors.ink} size={20} />
        </IconButton>
      )}
      <View className="flex-1">
        {eyebrow ? (
          <T weight="semibold" className="text-xs uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </T>
        ) : null}
        <T weight="extrabold" className="text-2xl text-ink" numberOfLines={1}>
          {title}
        </T>
      </View>
      {avatar && user ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile"
          onPress={() => router.push('/profile')}
        >
          <Avatar name={user.name} uri={user.avatarUrl} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function IconButton({
  children,
  onPress,
  label,
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-card active:opacity-80"
    >
      {children}
    </Pressable>
  );
}

export function BellButton({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      onPress={onPress}
      className="relative"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-card">
        <Bell color={colors.ink} size={18} />
      </View>
      {count > 0 ? (
        <View className="absolute -right-1 -top-1 min-w-[18px] items-center rounded-full bg-primary px-1">
          <T weight="bold" className="text-[10px] text-ink">
            {count}
          </T>
        </View>
      ) : null}
    </Pressable>
  );
}
