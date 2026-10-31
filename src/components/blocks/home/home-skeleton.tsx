import { View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Shaped like the real cards, so nothing reflows when the payload lands. A spinner would be
 * one line, and would make the whole screen jump when it is replaced.
 */
export function HomeSkeleton() {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading your Home screen"
      className="gap-4"
    >
      {/* greeting + coins + rank */}
      <View className="flex-row items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-16" />
      </View>

      {/* today hero */}
      <Card>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-12 w-40" />
        <Skeleton className="mt-2 h-5 w-52" />
        <Skeleton className="mt-4 h-3 w-full" />
        <Skeleton className="mt-4 h-12 w-full" />
      </Card>

      {/* streak */}
      <Card>
        <Skeleton className="h-5 w-40" />
      </Card>

      {/* this week */}
      <Card>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-12 w-full" />
        <Skeleton className="mt-3 h-5 w-56" />
      </Card>

      {/* 30-day breakdown */}
      <Card>
        <Skeleton className="h-3 w-36" />
        <View className="mt-3 gap-3">
          {['transport', 'food', 'home-energy', 'waste', 'water'].map((row) => (
            <View key={row}>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-1 h-3 w-full" />
            </View>
          ))}
        </View>
      </Card>

      {/* active goal */}
      <Card>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-5 w-48" />
        <Skeleton className="mt-3 h-3 w-full" />
      </Card>

      {/* leaderboard */}
      <Card>
        <Skeleton className="h-3 w-28" />
        <View className="mt-3 gap-2">
          {['first', 'second', 'third'].map((row) => (
            <Skeleton key={row} className="h-6 w-full" />
          ))}
        </View>
      </Card>
    </View>
  );
}
