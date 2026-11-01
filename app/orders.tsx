import { type Href, router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { ORDER_STATUS } from '@/components/market';
import { Screen, TopBar } from '@/components/ui/header';
import { Button, EmptyBlock, Note } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { useOrders } from '@/hooks/resources';
import { formatCount, formatInrFromPaise, formatWhen } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';

export default function Orders() {
  const { user } = useAuth();
  const { orders, deviceOrders, loading, hasMore, loadMore, loadingMore } = useOrders();
  const empty = !loading && orders.length === 0 && deviceOrders.length === 0;

  return (
    <Screen>
      <TopBar title="Orders" back />
      {deviceOrders.length > 0 ? (
        <View className="mb-4">
          <Note>Phone-only redemptions are listed first. EcoLife has not charged those coins.</Note>
        </View>
      ) : null}
      <View className="gap-3">
        {deviceOrders.map((order) => (
          <View key={order.id} className="rounded-[22px] border-2 border-ink bg-accent p-4">
            <T weight="bold" className="text-ink">
              {order.productName}
            </T>
            <T className="text-sm text-forest">
              {formatCount(order.coins)} coins · saved on this phone
            </T>
            <T className="text-xs text-muted-foreground">
              {formatWhen(order.createdAt, user?.timezone)}
            </T>
          </View>
        ))}
        {orders.map((order) => (
          <Pressable
            key={order.id}
            accessibilityRole="button"
            onPress={() => router.push(`/order/${order.id}` as Href)}
            className="rounded-[22px] border-2 border-ink bg-card p-4"
          >
            <View className="flex-row items-start justify-between gap-3">
              <T weight="bold" className="text-ink">
                {order.orderNumber}
              </T>
              <T
                weight="bold"
                className={
                  order.status === 'cancelled'
                    ? 'text-xs uppercase text-destructive'
                    : 'text-xs uppercase text-forest'
                }
              >
                {ORDER_STATUS[order.status] ?? order.status}
              </T>
            </View>
            <T className="mt-1 text-sm text-muted-foreground" numberOfLines={2}>
              {order.items.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}
            </T>
            <View className="mt-3 flex-row items-end justify-between">
              <View>
                <T weight="extrabold" className="text-lg text-ink">
                  {formatInrFromPaise(order.totalPaise)}
                </T>
                {order.coinsSpent ? (
                  <T className="text-xs text-forest">{formatCount(order.coinsSpent)} coins off</T>
                ) : null}
              </View>
              <T className="text-xs text-muted-foreground">
                {formatWhen(order.createdAt, user?.timezone)}
              </T>
            </View>
          </Pressable>
        ))}
      </View>
      {hasMore ? (
        <View className="mt-4">
          <Button
            label={loadingMore ? 'Loading…' : 'Older orders'}
            variant="outline"
            onPress={() => void loadMore()}
            loading={loadingMore}
          />
        </View>
      ) : null}
      {empty ? (
        <EmptyBlock
          title="No orders yet"
          body="Products you order show up here. Phone-only sample redemptions stay marked separately."
        />
      ) : null}
    </Screen>
  );
}
