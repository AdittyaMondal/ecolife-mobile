import { useQueryClient } from '@tanstack/react-query';
import { type Href, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import { Screen, TopBar } from '@/components/ui/header';
import {
  Button,
  EmptyBlock,
  Field,
  LoadingBlock,
  Note,
  SliderField,
} from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { useAddresses, useCart, useShop } from '@/hooks/resources';
import { errorMessage } from '@/lib/errors';
import { api } from '@/lib/fetcher';
import { formatCount, formatInrFromPaise } from '@/lib/format';
import { uuid } from '@/lib/ids';
import { qk } from '@/lib/query-keys';
import { useAuth } from '@/providers/auth-provider';
import type { Address, AddressInput, CartQuote, Order } from '@/types/domain';

const EMPTY_FORM = {
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
};

function maxOffer(quote: CartQuote, wallet: number) {
  const fromCap = Math.floor((quote.maxDiscountPaise / 100) * quote.coinsPerRupee);
  return Math.max(0, Math.min(wallet, fromCap));
}

function phoneForApi(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith('+')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  return trimmed;
}

function draftFrom(address: Address): typeof EMPTY_FORM {
  return {
    name: address.name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? '',
    city: address.city,
    state: address.state,
    pincode: address.pincode,
  };
}

export default function Cart() {
  const { user, refreshUser } = useAuth();
  const client = useQueryClient();
  const { cart, loading, error, unavailable } = useCart();
  const { addresses } = useAddresses();
  const shop = useShop();
  const [offered, setOffered] = useState(0);
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const idempotencyKey = useRef(uuid());
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const wallet = user?.wallet.coinsBalance ?? 0;
  const itemKey = cart?.items.map((item) => `${item.productId}:${item.quantity}`).join('|') ?? '';

  useEffect(() => {
    if (selectedId != null) return;
    const pick = addresses.find((item) => item.isDefault) ?? addresses[0];
    if (pick) setSelectedId(pick.id);
  }, [addresses, selectedId]);

  useEffect(() => {
    const current = cartRef.current;
    if (!itemKey || !current || current.items.length === 0) {
      setQuote(null);
      return;
    }
    const ceiling = maxOffer(current, wallet);
    const spend = Math.min(offered, ceiling);
    if (spend !== offered) {
      setOffered(spend);
      return;
    }
    let cancel = false;
    setQuoting(true);
    const timer = setTimeout(() => {
      api
        .post<CartQuote>('/marketplace/cart/preview', { offeredCoins: spend })
        .then((next) => {
          if (!cancel) setQuote(next);
        })
        .catch(() => {
          if (!cancel) setQuote(null);
        })
        .finally(() => {
          if (!cancel) setQuoting(false);
        });
    }, 280);
    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [itemKey, offered, wallet]);

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

  if (placed) {
    return (
      <Screen
        footer={
          <Button
            label="View order"
            onPress={() => router.replace(`/order/${placed.id}` as Href)}
          />
        }
      >
        <TopBar title="Order placed" back />
        <T weight="extrabold" className="text-4xl text-ink">
          {placed.orderNumber}
        </T>
        <T className="mt-2 text-base leading-6 text-muted-foreground">
          EcoLife priced this order. You paid {formatInrFromPaise(placed.totalPaise)}
          {placed.coinsSpent ? ` after ${formatCount(placed.coinsSpent)} coins` : ''}.
        </T>
      </Screen>
    );
  }

  const priced = quote ?? cart;
  const ceiling = maxOffer(priced, wallet);
  const formOpen = showForm || addresses.length === 0;

  async function changeQty(productId: number, quantity: number, stock: number) {
    setBusyId(productId);
    setMessage(null);
    try {
      if (quantity <= 0) await shop.remove(productId);
      else await shop.setQuantity(productId, Math.min(quantity, stock, 20));
    } catch (err) {
      setMessage(errorMessage(err, 'The cart could not update that quantity.'));
    } finally {
      setBusyId(null);
    }
  }

  function openCreate() {
    setEditingId(undefined);
    setForm({ ...EMPTY_FORM, name: user?.name ?? '' });
    setShowForm(true);
  }

  function openEdit(address: Address) {
    setEditingId(address.id);
    setForm(draftFrom(address));
    setShowForm(true);
  }

  function readDraft(): AddressInput {
    if (
      !form.name.trim() ||
      !form.line1.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !/^\d{6}$/.test(form.pincode.trim())
    ) {
      throw new Error('Add a name, street, city, state, and a 6-digit PIN code.');
    }
    const phone = phoneForApi(form.phone);
    if (!/^\+\d{10,15}$/.test(phone) && !/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) {
      throw new Error('Use a 10-digit mobile number.');
    }
    return {
      name: form.name.trim(),
      phone,
      line1: form.line1.trim(),
      line2: form.line2.trim() || null,
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      isDefault: editingId
        ? (addresses.find((item) => item.id === editingId)?.isDefault ?? false)
        : addresses.length === 0,
    };
  }

  async function saveAddress() {
    setSavingAddress(true);
    setMessage(null);
    try {
      const body = readDraft();
      const saved = editingId
        ? await api.patch<Address>(`/addresses/${editingId}`, body)
        : await api.post<Address>('/addresses', body);
      await client.invalidateQueries({ queryKey: qk.addresses(user?.id ?? 0) });
      if (saved?.id) setSelectedId(saved.id);
      setShowForm(false);
      setEditingId(undefined);
    } catch (err) {
      setMessage(errorMessage(err, 'That address could not be saved.'));
    } finally {
      setSavingAddress(false);
    }
  }

  function removeAddress(address: Address) {
    Alert.alert('Remove address', `${address.line1}, ${address.city}`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void shop.removeAddress(address.id).then(() => {
            if (selectedId === address.id) setSelectedId(null);
          });
        },
      },
    ]);
  }

  async function place() {
    if (offered > wallet) {
      setMessage('That coin offer is higher than your wallet.');
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      let addressId = selectedId;
      if (!addressId) {
        const body = readDraft();
        const created = await api.post<Address>('/addresses', body);
        addressId = created.id;
        await client.invalidateQueries({ queryKey: qk.addresses(user?.id ?? 0) });
      }
      const order = await api.post<Order>('/marketplace/orders', {
        offeredCoins: offered,
        addressId,
        idempotencyKey: idempotencyKey.current,
      });
      idempotencyKey.current = uuid();
      setPlaced(order);
      await client.invalidateQueries({ queryKey: qk.cart(user?.id ?? 0) });
      await client.invalidateQueries({ queryKey: qk.orders(user?.id ?? 0) });
      await refreshUser().catch(() => undefined);
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen
      footer={
        cart.items.length > 0 ? (
          <Button
            label={quoting ? 'Pricing…' : `Pay ${formatInrFromPaise(priced.totalPaise)}`}
            onPress={() => void place()}
            loading={pending}
            disabled={quoting || (offered > 0 && !quote) || (!selectedId && !formOpen)}
          />
        ) : undefined
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
          {cart.items.map((item) => {
            const stock = Math.max(1, item.product.stock);
            const busy = busyId === item.productId;
            return (
              <View
                key={item.productId}
                className="flex-row gap-3 rounded-[22px] border-2 border-ink bg-card p-3"
              >
                {item.product.imageUrl ? (
                  <Image
                    source={{ uri: item.product.imageUrl }}
                    className="h-20 w-20 rounded-[16px] bg-accent"
                  />
                ) : (
                  <View className="h-20 w-20 rounded-[16px] bg-accent" />
                )}
                <View className="flex-1">
                  <T weight="bold" className="text-ink" numberOfLines={2}>
                    {item.product.name}
                  </T>
                  <T weight="extrabold" className="mt-1 text-forest">
                    {formatInrFromPaise(item.lineTotalPaise)}
                  </T>
                  <View className="mt-2 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Decrease quantity"
                        disabled={busy}
                        onPress={() => void changeQty(item.productId, item.quantity - 1, stock)}
                        className="h-9 w-9 items-center justify-center rounded-full bg-muted"
                      >
                        <T weight="extrabold" className="text-lg text-ink">
                          −
                        </T>
                      </Pressable>
                      <T weight="extrabold" className="min-w-6 text-center text-ink">
                        {item.quantity}
                      </T>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Increase quantity"
                        disabled={busy || item.quantity >= Math.min(20, stock)}
                        onPress={() => void changeQty(item.productId, item.quantity + 1, stock)}
                        className="h-9 w-9 items-center justify-center rounded-full bg-primary"
                      >
                        <T weight="extrabold" className="text-lg text-ink">
                          +
                        </T>
                      </Pressable>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      disabled={busy}
                      onPress={() => void changeQty(item.productId, 0, stock)}
                    >
                      <T weight="bold" className="text-sm text-destructive">
                        Remove
                      </T>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}

          <View className="rounded-[24px] bg-secondary p-4">
            <View className="flex-row justify-between">
              <T className="text-eco-100">Subtotal</T>
              <T className="text-cream">{formatInrFromPaise(priced.subtotalPaise)}</T>
            </View>
            <View className="mt-1 flex-row justify-between">
              <T className="text-eco-100">Coin discount</T>
              <T className="text-cream">− {formatInrFromPaise(priced.discountPaise)}</T>
            </View>
            <T weight="extrabold" className="mt-2 text-3xl text-cream">
              {formatInrFromPaise(priced.totalPaise)}
            </T>
            <T className="mt-1 text-xs text-eco-100">
              {priced.coinsSpent
                ? `${formatCount(priced.coinsSpent)} coins applied · ${formatCount(priced.coinsBalanceAfter)} left`
                : `Up to ${formatInrFromPaise(priced.maxDiscountPaise)} off with coins`}
            </T>
            {priced.capReached ? (
              <T className="mt-1 text-xs text-primary">The 20% coin cap is reached.</T>
            ) : null}
          </View>

          <View className="rounded-[22px] border-2 border-ink bg-card p-4">
            <T weight="bold" className="text-ink">
              Coins to use
            </T>
            <T className="mt-1 text-sm text-muted-foreground">
              Wallet {formatCount(wallet)}. The shop prices the discount.
            </T>
            {ceiling > 0 ? (
              <View className="mt-2">
                <SliderField
                  min={0}
                  max={ceiling}
                  value={Math.min(offered, ceiling)}
                  onChange={setOffered}
                />
                <T weight="extrabold" className="text-center text-2xl text-ink">
                  {formatCount(Math.min(offered, ceiling))}
                </T>
              </View>
            ) : (
              <T className="mt-2 text-sm text-muted-foreground">
                No coins can come off this order.
              </T>
            )}
          </View>

          <T weight="extrabold" className="mt-2 text-xl text-ink">
            Deliver to
          </T>
          {addresses.map((address) => {
            const selected = address.id === selectedId;
            return (
              <Pressable
                key={address.id}
                accessibilityRole="button"
                onPress={() => setSelectedId(address.id)}
                className={`rounded-[22px] border-2 p-4 ${selected ? 'border-ink bg-accent' : 'border-transparent bg-card'}`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <T weight="bold" className="text-ink">
                      {address.name}
                      {address.isDefault ? ' · Default' : ''}
                    </T>
                    <T className="mt-1 text-sm leading-5 text-muted-foreground">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state}{' '}
                      {address.pincode}
                    </T>
                    <T className="text-sm text-muted-foreground">{address.phone}</T>
                  </View>
                  {selected ? (
                    <T weight="bold" className="text-xs uppercase text-forest">
                      Selected
                    </T>
                  ) : null}
                </View>
                <View className="mt-3 flex-row gap-4">
                  <Pressable onPress={() => openEdit(address)}>
                    <T weight="bold" className="text-sm text-forest">
                      Edit
                    </T>
                  </Pressable>
                  {!address.isDefault ? (
                    <Pressable onPress={() => void shop.makeDefault(address.id)}>
                      <T weight="bold" className="text-sm text-ink">
                        Make default
                      </T>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => removeAddress(address)}>
                    <T weight="bold" className="text-sm text-destructive">
                      Remove
                    </T>
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
          {addresses.length > 0 && !formOpen ? (
            <Button label="Add address" variant="outline" onPress={openCreate} />
          ) : null}
          {formOpen ? (
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
                placeholder="10-digit mobile"
              />
              <Field
                label="Address"
                value={form.line1}
                onChangeText={(line1) => setForm({ ...form, line1 })}
              />
              <Field
                label="Apartment, optional"
                value={form.line2}
                onChangeText={(line2) => setForm({ ...form, line2 })}
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
                maxLength={6}
              />
              <Button
                label={editingId ? 'Save address' : 'Save and use this address'}
                variant="forest"
                onPress={() => void saveAddress()}
                loading={savingAddress}
              />
              {addresses.length > 0 ? (
                <Button
                  label="Cancel"
                  variant="ghost"
                  onPress={() => {
                    setShowForm(false);
                    setEditingId(undefined);
                  }}
                />
              ) : (
                <Note>An address is required before EcoLife can place the order.</Note>
              )}
            </View>
          ) : null}
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
