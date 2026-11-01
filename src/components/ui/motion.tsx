import { cssInterop } from 'nativewind';
import { type ReactNode, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  type PressableProps,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const PRESS = { damping: 18, stiffness: 420, mass: 0.35 };
const RELEASE = { damping: 14, stiffness: 260, mass: 0.45 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
cssInterop(Animated.View, { className: 'style' });
cssInterop(AnimatedPressable, { className: 'style' });

let reduceMotion = false;
const reduceListeners = new Set<(value: boolean) => void>();

AccessibilityInfo.isReduceMotionEnabled().then((value) => {
  reduceMotion = value;
  for (const listener of reduceListeners) listener(value);
});
AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
  reduceMotion = value;
  for (const listener of reduceListeners) listener(value);
});

export function useReduceMotion() {
  const [reduce, setReduce] = useState(reduceMotion);
  useEffect(() => {
    reduceListeners.add(setReduce);
    setReduce(reduceMotion);
    return () => {
      reduceListeners.delete(setReduce);
    };
  }, []);
  return reduce;
}

export function PressableScale({
  children,
  disabled,
  style,
  onPressIn,
  onPressOut,
  ...props
}: PressableProps) {
  const reduce = useReduceMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled && !reduce) scale.value = withSpring(0.96, PRESS);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, RELEASE);
        onPressOut?.(event);
      }}
      style={[animated, style as StyleProp<ViewStyle>]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function Rise({
  index = 0,
  children,
  className,
  style,
}: {
  index?: number;
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReduceMotion();
  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.duration(320).delay(Math.min(index, 8) * 40)}
      className={className}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function FadeInView({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReduceMotion();
  return (
    <Animated.View entering={reduce ? undefined : FadeIn.duration(220)} className={className}>
      {children}
    </Animated.View>
  );
}

export function FillBar({
  percent,
  trackClassName = 'h-2 bg-cream/15',
  fillClassName = 'bg-primary',
}: {
  percent: number;
  trackClassName?: string;
  fillClassName?: string;
}) {
  const reduce = useReduceMotion();
  const progress = useSharedValue(reduce ? percent : 0);
  useEffect(() => {
    const next = Math.min(100, Math.max(0, percent));
    progress.value = reduce
      ? next
      : withTiming(next, { duration: 520, easing: Easing.out(Easing.cubic) });
  }, [percent, progress, reduce]);
  const fill = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));
  return (
    <View className={`overflow-hidden rounded-full ${trackClassName}`}>
      <Animated.View className={`h-full rounded-full ${fillClassName}`} style={fill} />
    </View>
  );
}

export function Grow({ height, className }: { height: number; className?: string }) {
  const reduce = useReduceMotion();
  const h = useSharedValue(reduce ? height : 0);
  useEffect(() => {
    h.value = reduce
      ? height
      : withTiming(height, { duration: 460, easing: Easing.out(Easing.cubic) });
  }, [h, height, reduce]);
  const style = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View className={className} style={style} />;
}

export function Pulse({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReduceMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    scale.value = withRepeat(
      withTiming(1.05, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [reduce, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View className={className} style={style}>
      {children}
    </Animated.View>
  );
}
