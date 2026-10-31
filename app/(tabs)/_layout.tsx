import { Tabs } from 'expo-router/js-tabs';
import { CalendarDays, House, ShoppingBag, SquarePen } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';

/** 44px is the WCAG 2.2 minimum touch target (PRD-v2 §9.3). */
const TAB_HEIGHT = 56;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.eco[700],
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: TAB_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarItemStyle: { minHeight: 44, paddingVertical: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <House color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: ({ color }) => <SquarePen color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ color }) => <ShoppingBag color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => <CalendarDays color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
