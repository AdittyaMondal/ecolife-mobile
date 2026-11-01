import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Avatar } from '@/components/ui/avatar';
import { Screen, TopBar } from '@/components/ui/header';
import { Note, Pill } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { useLeaderboard } from '@/hooks/resources';
import { formatCount } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';

const PERIODS = ['week', 'month', 'all'] as const;

export default function Leaderboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('all');
  const [tab, setTab] = useState<'global' | 'org'>('global');
  const board = useLeaderboard(period);
  const rows = tab === 'org' ? board.orgRows : board.rows;

  return (
    <Screen>
      <TopBar title="Leaderboard" back />
      <View className="mb-4 flex-row gap-2">
        {PERIODS.map((item) => (
          <Pill
            key={item}
            label={item === 'all' ? 'All time' : item[0]?.toUpperCase() + item.slice(1)}
            active={period === item && tab === 'global'}
            onPress={() => {
              setTab('global');
              setPeriod(item);
            }}
          />
        ))}
        {board.showOrg ? (
          <Pill label="Organization" active={tab === 'org'} onPress={() => setTab('org')} />
        ) : null}
      </View>
      {board.source === 'device' && tab === 'global' ? (
        <View className="mb-3">
          <Note>
            Live rankings could not be loaded. This sample board includes your real point balance.
          </Note>
        </View>
      ) : null}
      {tab === 'org' ? (
        <View className="mb-3">
          <Note>
            {`${board.organizationName ?? 'Organization'} rankings are a preview on this phone. EcoLife does not publish an organization board yet.`}
          </Note>
        </View>
      ) : null}
      {board.me && tab === 'global' && board.source === 'api' ? (
        <View className="mb-4 rounded-[24px] bg-secondary p-4">
          <T className="text-xs uppercase tracking-wide text-eco-100">Your rank</T>
          <T weight="extrabold" className="text-3xl text-cream">
            {board.me.rank ? `#${board.me.rank}` : 'Unranked'}
          </T>
          <T className="text-eco-100">
            {formatCount(board.me.pointsTotal)} pts · top {Math.round(100 - board.me.percentile)}%
            of {formatCount(board.me.totalRanked)}
          </T>
        </View>
      ) : null}
      <View className="gap-2">
        {rows.map((row, index) => {
          const mine = row.userId === user?.id;
          return (
            <Animated.View
              key={`${row.rank}-${row.name}`}
              entering={FadeInDown.duration(320).delay(Math.min(index, 8) * 40)}
              className={`flex-row items-center gap-3 rounded-[22px] px-3 py-3 ${mine ? 'bg-primary' : 'bg-card'}`}
            >
              <T weight="extrabold" className="w-8 text-lg text-ink">
                {row.rank}
              </T>
              <Avatar name={row.name} uri={row.avatarUrl} size={42} />
              <View className="flex-1">
                <T weight="bold" className="text-ink">
                  {mine ? `${row.name} · You` : row.name}
                </T>
                <T className="text-xs text-muted-foreground">{row.subtitle ?? 'Member'}</T>
              </View>
              <T weight="extrabold" className="text-ink">
                {formatCount(row.points)}
              </T>
            </Animated.View>
          );
        })}
      </View>
    </Screen>
  );
}
