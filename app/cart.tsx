import { useQueryClient } from '@tanstack/react-query';
import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, TopBar } from '@/components/ui/header';
import { Button, EmptyBlock, Field, LoadingBlock, Note } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { useCart } from '@/hooks/resources';
import { errorMessage } from '@/lib/errors';
import { api } from '@/lib/fetcher';
import { formatCount, formatInrFromPaise } from '@/lib/format';
import { uuid } from '@/lib/ids';
import { useAuth } from '@/providers/auth-provider';

export default function Cart() {
  const { user } = useAuth();
  const client = useQueryClient();
  const { cart, addresses, loading, error, unavailable, refetch } = useCart();
  const [coins, setCoins] = useState('0');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    pincode: '',
  });

  if (loading) {
    return (
      <Screen>
        <TopBar title="Cart" back />
        <LoadingBlock />
      </Screen>
    );
  }

  if (unavailable || error || !cart) {
    return (
      <Screen>
        <TopBar title="Cart" back />
        <EmptyBlock
          title="Cart isn’t available"
          body={
            error ??
            'EcoLife could not load the cart. Sample products redeem from their own page and never enter this cart.'
          }
        />
      </Screen>
    );
  }

  if (orderNumber) {
    return (
      <Screen
        footer={
          <Button label="View redemptions" onPress={() => router.replace('/orders' as Href)} />
        }
      >
        <TopBar title="Order placed" back />
        <T weight="extrabold" className="text-4xl text-ink">
          {orderNumber}
        </T>
        <T className="mt-2 text-base text-muted-foreground">
          EcoLife placed this order and recorded the coin discount.
        </T>
      </Screen>
    );
  }

  async function ensureAddress() {
    const existing = addresses.find((item) => item.isDefault) ?? addresses[0];
    if (existing) return existing.id;
    if (
      !form.name ||
      !form.phone ||
      !form.line1 ||
      !form.city ||
      !form.state ||
      !/^\d{6}$/.test(form.pincode)
    ) {
      throw new Error('Add a full delivery address with a 6-digit PIN code.');
    }
    const created = await api.post<{ id: number }>('/addresses', {
      name: form.name,
      phone: form.phone,
      line1: form.line1,
      line2: null,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      isDefault: true,
    });
    return created.id;
  }

  async function place() {
    setPending(true);
    setMessage(null);
    try {
      const offeredCoins = Math.max(0, Number(coins) || 0);
      if (offeredCoins > 0) {
        await api.post('/marketplace/cart/preview', { offeredCoins });
      }
      const addressId = await ensureAddress();
      const order = await api.post<{ orderNumber: string }>('/marketplace/orders', {
        offeredCoins,
        addressId,
        idempotencyKey: uuid(),
      });
      setOrderNumber(order.orderNumber);
      await client.invalidateQueries();
      await refetch();
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen
      footer={
        <Button
          label="Place order"
          onPress={() => void place()}
          loading={pending}
          disabled={cart.items.length === 0}
        />
      }
    >
      <TopBar title="Cart" back />
      {cart.items.length === 0 ? (
        <EmptyBlock
          title="Nothing here yet"
          body="Add a product from the marketplace. Sample items redeem on their own page."
        />
      ) : (
        <View className="gap-3">
          {cart.items.map((item, index) => (
            <Animated.View
              key={item.productId}
              entering={FadeInDown.duration(300).delay(Math.min(index, 6) * 40)}
              className="rounded-[22px] bg-card p-4"
            >
              <T weight="bold" className="text-ink">
                {item.product.name}
              </T>
              <T className="text-sm text-muted-foreground">
                Qty {item.quantity} · {formatInrFromPaise(item.lineTotalPaise)}
              </T>
            </Animated.View>
          ))}
          <View className="rounded-[22px] bg-secondary p-4">
            <T className="text-eco-100">Subtotal {formatInrFromPaise(cart.subtotalPaise)}</T>
            <T weight="extrabold" className="text-2xl text-cream">
              {formatInrFromPaise(cart.totalPaise)}
            </T>
            <T className="text-xs text-eco-100">
              Max coin discount {formatInrFromPaise(cart.maxDiscountPaise)}
            </T>
          </View>
          <Field
            label="Coins to offer"
            keyboardType="number-pad"
            value={coins}
            onChangeText={setCoins}
            placeholder="0"
          />
          <T className="text-xs text-muted-foreground">
            Wallet {formatCount(user?.wallet.coinsBalance ?? 0)} coins. The server decides the
            discount.
          </T>
          {addresses.length === 0 ? (
            <View className="gap-3">
              <Field
                label="Name"
                value={form.name}
                onChangeText={(name) => setForm({ ...form, name })}
              />
              <Field
                label="Phone"
                value={form.phone}
                onChangeText={(phone) => setForm({ ...form, phone })}
                keyboardType="phone-pad"
              />
              <Field
                label="Address"
                value={form.line1}
                onChangeText={(line1) => setForm({ ...form, line1 })}
              />
              <Field
                label="City"
                value={form.city}
                onChangeText={(city) => setForm({ ...form, city })}
              />
              <Field
                label="State"
                value={form.state}
                onChangeText={(state) => setForm({ ...form, state })}
              />
              <Field
                label="PIN code"
                value={form.pincode}
                onChangeText={(pincode) => setForm({ ...form, pincode })}
                keyboardType="number-pad"
              />
            </View>
          ) : (
            <Note>{`Delivering to ${addresses[0]?.line1}, ${addresses[0]?.city}`}</Note>
          )}
        </View>
      )}
      {message ? (
        <T weight="semibold" className="mt-3 text-sm text-destructive">
          {message}
        </T>
      ) : null}
    </Screen>
  );
}
