import { CalendarDays, Footprints, Gamepad2, House, ShoppingBag } from 'lucide-react-native';
import { type ReactNode, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';
import { PressableScale, useReduceMotion } from './motion';
import { T } from './text';

const ORDER = ['track', 'marketplace', 'index', 'events', 'game'] as const;

const META: Record<(typeof ORDER)[number], { label: string; icon: typeof House }> = {
  track: { label: 'Track', icon: Footprints },
  marketplace: { label: 'Market', icon: ShoppingBag },
  index: { label: 'Home', icon: House },
  events: { label: 'Events', icon: CalendarDays },
  game: { label: 'Game', icon: Gamepad2 },
};

const SELECT = { damping: 14, stiffness: 240, mass: 0.6 };

type DockProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigateToTab: (routeKey: string) => void;
};

export function Dock({ state, navigateToTab }: DockProps) {
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const active = state.routes[state.index]?.name;
  const routes = ORDER.map((name) => state.routes.find((route) => route.name === name)).filter(
    (route): route is { key: string; name: string } => Boolean(route),
  );

  return (
    <Animated.View
      pointerEvents="box-none"
      entering={reduce ? undefined : SlideInDown.duration(420).springify().damping(18)}
      style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 10) }}
    >
      <View className="flex-row items-end justify-between rounded-full border-2 border-ink bg-secondary px-2 pb-2 pt-2">
        {routes.map((route) => {
          const name = route.name as (typeof ORDER)[number];
          const item = META[name];
          if (!item) return null;
          const selected = active === route.name;
          if (name === 'index') {
            return (
              <HomeTab
                key={route.key}
                selected={selected}
                onPress={() => navigateToTab(route.key)}
              />
            );
          }
          return (
            <DockItem
              key={route.key}
              label={item.label}
              selected={selected}
              onPress={() => navigateToTab(route.key)}
              icon={
                <item.icon
                  color={selected ? colors.ink : colors.cream}
                  size={20}
                  strokeWidth={2.3}
                />
              }
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

function HomeTab({ selected, onPress }: { selected: boolean; onPress: () => void }) {
  const reduce = useReduceMotion();
  const scale = useSharedValue(selected ? 1 : 0.94);
  useEffect(() => {
    scale.value = reduce ? (selected ? 1 : 0.94) : withSpring(selected ? 1 : 0.94, SELECT);
  }, [reduce, scale, selected]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Home"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="w-16 items-center"
    >
      <Animated.View
        className={`-mt-7 h-16 w-16 items-center justify-center rounded-full border-[3px] border-cream ${selected ? 'bg-primary' : 'bg-leaf'}`}
        style={style}
      >
        <House color={colors.ink} size={26} strokeWidth={2.4} />
      </Animated.View>
      <T weight="bold" className="mt-1 text-[11px] text-cream">
        Home
      </T>
    </PressableScale>
  );
}

function DockItem({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon: ReactNode;
}) {
  const reduce = useReduceMotion();
  const scale = useSharedValue(selected ? 1 : 0.88);
  useEffect(() => {
    scale.value = reduce ? (selected ? 1 : 0.88) : withSpring(selected ? 1 : 0.88, SELECT);
  }, [reduce, scale, selected]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className="h-14 min-w-[56px] flex-1 items-center justify-center"
    >
      <Animated.View
        className={`h-9 w-9 items-center justify-center rounded-full ${selected ? 'bg-primary' : ''}`}
        style={style}
      >
        {icon}
      </Animated.View>
      <T weight="bold" className={`text-[11px] ${selected ? 'text-primary' : 'text-cream'}`}>
        {label}
      </T>
    </PressableScale>
  );
}
