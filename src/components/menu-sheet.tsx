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
import { createContext, type ReactNode, useContext, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';
import { useAuth } from '@/providers/auth-provider';
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

export function MenuProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuth();

  return (
    <MenuContext.Provider value={{ open: () => setVisible(true) }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable className="flex-1 bg-ink/40" onPress={() => setVisible(false)} />
        <View
          className="absolute bottom-0 left-0 right-0 rounded-t-[32px] border-2 border-ink bg-card px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
        >
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <T weight="extrabold" className="text-xl text-ink">
                Menu
              </T>
              <T className="text-sm text-muted-foreground">{user?.email}</T>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              onPress={() => setVisible(false)}
              className="h-11 w-11 items-center justify-center rounded-full bg-muted"
            >
              <X color={colors.ink} size={18} />
            </Pressable>
          </View>
          {LINKS.map((link) => (
            <Pressable
              key={link.href}
              accessibilityRole="button"
              onPress={() => {
                setVisible(false);
                router.push(link.href as Href);
              }}
              className="min-h-[48px] flex-row items-center gap-3 border-b border-border py-2"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-accent">
                <link.icon color={colors.forest} size={18} />
              </View>
              <T weight="bold" className="text-base text-ink">
                {link.label}
              </T>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setVisible(false);
              void signOut();
            }}
            className="mt-3 min-h-[48px] flex-row items-center gap-3"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
              <LogOut color={colors.destructive} size={18} />
            </View>
            <T weight="bold" className="text-base text-destructive">
              Log out
            </T>
          </Pressable>
        </View>
      </Modal>
    </MenuContext.Provider>
  );
}
