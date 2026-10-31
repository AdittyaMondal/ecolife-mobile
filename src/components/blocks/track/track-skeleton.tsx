import { View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Five question cards, in the shape they will land in. */
export function TrackSkeleton() {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading today's questions"
      className="gap-4"
    >
      <Skeleton className="h-8 w-56" />

      {/* Q1 — travel: "same as usual", one trip row, "add another" */}
      <Card>
        <Skeleton className="h-3 w-44" />
        <Skeleton className="mt-3 h-12 w-full" />
        <Skeleton className="mt-4 h-28 w-full" />
        <Skeleton className="mt-4 h-12 w-full" />
      </Card>

      {/* Q2 — three steppers */}
      <Card>
        <Skeleton className="h-3 w-40" />
        <View className="mt-3 gap-3">
          {['veg', 'non-veg', 'vegan'].map((row) => (
            <Skeleton key={row} className="h-11 w-full" />
          ))}
        </View>
      </Card>

      {/* Q3/Q4 — segmented controls */}
      {['cooling', 'bathing'].map((row) => (
        <Card key={row}>
          <Skeleton className="h-3 w-48" />
          <Skeleton className="mt-3 h-11 w-full" />
        </Card>
      ))}

      {/* Q5 — chips */}
      <Card>
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-11 w-full" />
      </Card>

      <Skeleton className="h-12 w-full" />
    </View>
  );
}
