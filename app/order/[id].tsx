import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { ORDER_STATUS } from '@/components/market';
import { Screen, TopBar } from '@/components/ui/header';
import { ErrorBlock, LoadingBlock } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { useOrder } from '@/hooks/resources';
import { formatCount, formatInrFromPaise, formatWhen } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import type { Order } from '@/types/domain';

const STEPS: Order['status'][] = ['placed', 'confirmed', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { order, loading, error } = useOrder(Number(id));

  if (loading) {
    return (
      <Screen>
        <TopBar title="Order" back />
        <LoadingBlock />
      </Screen>
    );
  }
  if (!order) {
    return (
      <Screen>
        <TopBar title="Order" back />
        <ErrorBlock message={error ?? 'That order is not on this account.'} />
      </Screen>
    );
  }

  const step = STEPS.indexOf(order.status);
  const address = order.address;

  return (
    <Screen>
      <TopBar title={order.orderNumber} back />
      <T className="text-xs uppercase tracking-wide text-muted-foreground">
        {formatWhen(order.createdAt, user?.timezone)}
      </T>
      <T weight="extrabold" className="mt-1 text-3xl text-ink">
        {ORDER_STATUS[order.status] ?? order.status}
      </T>
      {order.status === 'cancelled' ? (
        <T className="mt-2 text-sm text-destructive">This order was cancelled.</T>
      ) : (
        <View className="mt-4 flex-row gap-2">
          {STEPS.map((status, index) => (
            <View key={status} className="flex-1">
              <View className={`h-2 rounded-full ${index <= step ? 'bg-primary' : 'bg-muted'}`} />
              <T className="mt-1 text-[10px] text-muted-foreground">{ORDER_STATUS[status]}</T>
            </View>
          ))}
        </View>
      )}

      <View className="mt-6 gap-3">
        {order.items.map((item) => (
          <View
            key={`${item.productName}-${item.unitPaise}`}
            className="flex-row items-center justify-between rounded-[20px] border-2 border-ink bg-card p-4"
          >
            <View className="flex-1 pr-3">
              <T weight="bold" className="text-ink">
                {item.productName}
              </T>
              <T className="text-sm text-muted-foreground">
                {formatInrFromPaise(item.unitPaise)} × {item.quantity}
              </T>
            </View>
            <T weight="extrabold" className="text-ink">
              {formatInrFromPaise(item.unitPaise * item.quantity)}
            </T>
          </View>
        ))}
      </View>

      <View className="mt-4 rounded-[24px] bg-secondary p-4">
        <Row label="Subtotal" value={formatInrFromPaise(order.subtotalPaise)} />
        <Row label="Discount" value={`− ${formatInrFromPaise(order.discountPaise)}`} />
        <T weight="extrabold" className="mt-2 text-3xl text-cream">
          {formatInrFromPaise(order.totalPaise)}
        </T>
        {order.coinsSpent ? (
          <T className="mt-1 text-xs text-eco-100">{formatCount(order.coinsSpent)} coins spent</T>
        ) : null}
      </View>

      {address ? (
        <View className="mt-4 rounded-[22px] border-2 border-ink bg-card p-4">
          <T className="text-xs uppercase tracking-wide text-muted-foreground">Delivered to</T>
          <T weight="bold" className="mt-1 text-ink">
            {address.name}
          </T>
          <T className="mt-1 text-sm leading-5 text-muted-foreground">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state}{' '}
            {address.pincode}
          </T>
          <T className="text-sm text-muted-foreground">{address.phone}</T>
        </View>
      ) : null}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <T className="text-eco-100">{label}</T>
      <T className="text-cream">{value}</T>
    </View>
  );
}
