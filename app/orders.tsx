import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, TopBar } from '@/components/ui/header';
import { EmptyBlock, Note } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { useOrders } from '@/hooks/resources';
import { formatCount, formatInrFromPaise, formatWhen } from '@/lib/format';
import { orderItemName } from '@/lib/normalizers';
import { useAuth } from '@/providers/auth-provider';

export default function Orders() {
  const { user } = useAuth();
  const { orders, deviceOrders, loading } = useOrders();
  const empty = !loading && orders.length === 0 && deviceOrders.length === 0;
  return (
    <Screen>
      <TopBar title="Redemptions" back />
      {deviceOrders.length > 0 ? (
        <View className="mb-4">
          <Note>Phone-only redemptions are listed first. EcoLife has not charged those coins.</Note>
        </View>
      ) : null}
      <View className="gap-3">
        {deviceOrders.map((order, index) => (
          <Animated.View
            key={order.id}
            entering={FadeInDown.duration(300).delay(Math.min(index, 6) * 40)}
            className="rounded-[22px] border-2 border-ink bg-accent p-4"
          >
            <T weight="bold" className="text-ink">
              {order.productName}
            </T>
            <T className="text-sm text-forest">
              {formatCount(order.coins)} coins · saved on this phone
            </T>
            <T className="text-xs text-muted-foreground">
              {formatWhen(order.createdAt, user?.timezone)}
            </T>
          </Animated.View>
        ))}
        {orders.map((order, index) => (
          <Animated.View
            key={order.id}
            entering={FadeInDown.duration(300).delay(Math.min(index, 6) * 40)}
            className="rounded-[22px] bg-card p-4"
          >
            <View className="flex-row justify-between">
              <T weight="bold" className="text-ink">
                {order.orderNumber}
              </T>
              <T className="text-xs uppercase text-forest">{order.status}</T>
            </View>
            <T className="mt-1 text-sm text-muted-foreground">
              {order.items.map((item) => orderItemName(item)).join(', ')}
            </T>
            <T weight="bold" className="mt-2 text-ink">
              {formatInrFromPaise(order.totalPaise)}
              {order.coinsSpent ? ` · ${formatCount(order.coinsSpent)} coins` : ''}
            </T>
            <T className="text-xs text-muted-foreground">
              {formatWhen(order.createdAt, user?.timezone)}
            </T>
          </Animated.View>
        ))}
      </View>
      {empty ? (
        <EmptyBlock
          title="No redemptions yet"
          body="Products you redeem or order will show up here, with phone-only ones marked separately."
        />
      ) : null}
    </Screen>
  );
}
