import { router } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BreakdownCard } from '@/components/blocks/home/breakdown-card';
import { GoalCard } from '@/components/blocks/home/goal-card';
import { GreetingHeader } from '@/components/blocks/home/greeting-header';
import { HomeSkeleton } from '@/components/blocks/home/home-skeleton';
import { LeaderboardCard } from '@/components/blocks/home/leaderboard-card';
import { NextEventCard } from '@/components/blocks/home/next-event-card';
import { StreakCard } from '@/components/blocks/home/streak-card';
import { TodayHero } from '@/components/blocks/home/today-hero';
import { WeekCard } from '@/components/blocks/home/week-card';
import { ErrorState } from '@/components/ui/error-state';
import { useHome } from '@/hooks/use-home';
import { colors } from '@/lib/theme';

/**
 * Home — PRD-v2 §6.2. One `GET /home`, one render, cards top to bottom. Three states:
 * card-shaped skeletons, a readable error branched on `error.code`, or the real thing.
 */
export default function Home() {
  const insets = useSafeAreaInsets();
  const home = useHome();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        // The tab bar already owns the bottom inset; this is just breathing room.
        paddingBottom: 24,
      }}
      refreshControl={
        <RefreshControl
          refreshing={home.isRefetching && !home.isPending}
          onRefresh={() => {
            home.refetch();
          }}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View className="gap-4 px-5">
        {home.isPending ? (
          <HomeSkeleton />
        ) : home.isError ? (
          <ErrorState error={home.error} onRetry={() => home.refetch()} />
        ) : (
          <>
            <GreetingHeader
              name={home.data.greetingName}
              wallet={home.data.wallet}
              rank={home.data.leaderboard.me.rank}
            />
            <TodayHero today={home.data.today} onLogPress={() => router.push('/track')} />
            <StreakCard streak={home.data.streak} />
            <WeekCard week={home.data.week} />
            <BreakdownCard breakdown={home.data.breakdown30d} />
            <GoalCard goal={home.data.activeGoal} />
            <LeaderboardCard leaderboard={home.data.leaderboard} />
            <NextEventCard event={home.data.nextEvent} />
          </>
        )}
      </View>
    </ScrollView>
  );
}
