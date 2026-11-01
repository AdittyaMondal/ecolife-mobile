import { View } from 'react-native';
import { Screen, TopBar } from '@/components/ui/header';
import { EmptyBlock, LoadingBlock } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { useRewards } from '@/hooks/resources';
import { formatCount, formatWhen } from '@/lib/format';
import { shownCoins, shownPoints } from '@/lib/local-state';
import { useAuth } from '@/providers/auth-provider';

export default function Rewards() {
  const { user, local } = useAuth();
  const { items, loading, unavailable, error } = useRewards();
  return (
    <Screen>
      <TopBar title="Rewards" back />
      <View className="mb-4 flex-row gap-3">
        <View className="flex-1 rounded-[22px] bg-primary p-4">
          <T className="text-xs uppercase text-forest">Points</T>
          <T weight="extrabold" className="text-2xl text-ink">
            {formatCount(shownPoints(user?.wallet.pointsTotal ?? 0, local))}
          </T>
        </View>
        <View className="flex-1 rounded-[22px] bg-secondary p-4">
          <T className="text-xs uppercase text-eco-100">Coins</T>
          <T weight="extrabold" className="text-2xl text-cream">
            {formatCount(shownCoins(user?.wallet.coinsBalance ?? 0, local, local.spentCoins))}
          </T>
        </View>
      </View>
      <T className="mb-3 text-sm leading-5 text-muted-foreground">
        Points only go up and decide rank. Coins can be spent in the marketplace, up to 20% of an
        order.
      </T>
      {loading ? <LoadingBlock /> : null}
      {error ? <EmptyBlock title="Ledger unavailable" body={error} /> : null}
      {!loading && items.length === 0 ? (
        <EmptyBlock
          title={unavailable ? 'Ledger isn’t ready' : 'No rewards yet'}
          body={
            unavailable
              ? 'EcoLife could not return the ledger. Your point and coin balances above still come from your account.'
              : 'Finish onboarding, log a day, or attend an event. Confirmed rewards will list here.'
          }
        />
      ) : null}
      <View className="gap-2">
        {items.map((item) => (
          <View key={item.id} className="rounded-[20px] bg-card px-4 py-3">
            <View className="flex-row justify-between">
              <T weight="bold" className="text-ink">
                {item.note || item.source}
              </T>
              <T weight="bold" className="text-forest">
                {item.pointsDelta >= 0 ? '+' : ''}
                {item.pointsDelta} pts
              </T>
            </View>
            <T className="text-xs text-muted-foreground">
              {item.coinsDelta ? `${item.coinsDelta} coins · ` : ''}
              {formatWhen(item.createdAt, user?.timezone)}
            </T>
          </View>
        ))}
      </View>
    </Screen>
  );
}
