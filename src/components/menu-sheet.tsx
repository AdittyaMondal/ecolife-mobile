import { type Href, router } from 'expo-router';
import {
  Bell,
  CalendarDays,
  Gift,
  House,
  LogOut,
  Settings,
  ShoppingBag,
  Trophy,
  UserRound,
  X,
} from 'lucide-react-native';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';
import { useAuth } from '@/providers/auth-provider';
import { PressableScale, Rise, useReduceMotion } from './ui/motion';
import { T } from './ui/text';

const MenuContext = createContext<{ open: () => void } | null>(null);

export function useMenu() {
  const value = useContext(MenuContext);
  if (!value) throw new Error('useMenu must be used within MenuProvider');
  return value;
}

const LINKS: { href: string; label: string; icon: typeof House }[] = [
  { href: '/', label: 'Home', icon: House },
  { href: '/profile', label: 'Profile', icon: UserRound },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/rewards', label: 'Rewards', icon: Gift },
  { href: '/orders', label: 'Redemptions', icon: ShoppingBag },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const SHEET = { damping: 22, stiffness: 260, mass: 0.75 };

export function MenuProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [openId, setOpenId] = useState(0);
  const ticket = useRef(0);
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuth();
  const reduce = useReduceMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!mounted || openId === 0) return;
    progress.value = 0;
    progress.value = reduce ? 1 : withSpring(1, SHEET);
  }, [mounted, openId, progress, reduce]);

  const pending = useRef<(() => void) | undefined>(undefined);

  const finish = () => {
    const after = pending.current;
    pending.current = undefined;
    setMounted(false);
    progress.value = 0;
    after?.();
  };

  const close = (after?: () => void) => {
    pending.current = after;
    const current = ticket.current;
    if (reduce) {
      finish();
      return;
    }
    progress.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished && current === ticket.current) runOnJS(finish)();
    });
  };

  const open = () => {
    pending.current = undefined;
    ticket.current += 1;
    setMounted(true);
    setOpenId((id) => id + 1);
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 480 }],
  }));

  return (
    <MenuContext.Provider value={{ open }}>
      {children}
      <Modal
        visible={mounted}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => close()}
      >
        <View className="flex-1 justify-end">
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(32,40,32,0.45)' },
              backdropStyle,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              className="flex-1"
              onPress={() => close()}
            />
          </Animated.View>
          <Animated.View
            className="rounded-t-[32px] border-2 border-ink bg-card px-5 pt-4"
            style={[sheetStyle, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
          >
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <T weight="extrabold" className="text-xl text-ink">
                  Menu
                </T>
                <T className="text-sm text-muted-foreground" numberOfLines={1}>
                  {user?.email}
                </T>
              </View>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Close menu"
                onPress={() => close()}
                className="h-11 w-11 items-center justify-center rounded-full bg-muted"
              >
                <X color={colors.ink} size={18} />
              </PressableScale>
            </View>
            {LINKS.map((link, index) => (
              <Rise key={link.href} index={index}>
                <PressableScale
                  accessibilityRole="button"
                  onPress={() => close(() => router.push(link.href as Href))}
                  className="min-h-[48px] flex-row items-center gap-3 border-b border-border py-2"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-accent">
                    <link.icon color={colors.forest} size={18} />
                  </View>
                  <T weight="bold" className="text-base text-ink">
                    {link.label}
                  </T>
                </PressableScale>
              </Rise>
            ))}
            <Rise index={LINKS.length}>
              <PressableScale
                accessibilityRole="button"
                onPress={() => close(() => void signOut())}
                className="mt-3 min-h-[48px] flex-row items-center gap-3"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <LogOut color={colors.destructive} size={18} />
                </View>
                <T weight="bold" className="text-base text-destructive">
                  Log out
                </T>
              </PressableScale>
            </Rise>
          </Animated.View>
        </View>
      </Modal>
    </MenuContext.Provider>
  );
}
