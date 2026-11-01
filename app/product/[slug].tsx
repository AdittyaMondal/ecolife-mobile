import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, View } from 'react-native';
import { Screen, TopBar } from '@/components/ui/header';
import { Button, ErrorBlock, LoadingBlock, Note } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { CATEGORY_LABELS } from '@/data/content';
import { useProductDetail } from '@/hooks/resources';
import { errorMessage } from '@/lib/errors';
import { api } from '@/lib/fetcher';
import { formatCount, formatInrFromPaise, formatKg } from '@/lib/format';
import { uuid } from '@/lib/ids';
import { shownCoins } from '@/lib/local-state';
import { useAuth } from '@/providers/auth-provider';

export default function ProductDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { product, source, loading, error } = useProductDetail(slug ?? '');
  const { user, local, updateLocal } = useAuth();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (loading) {
    return (
      <Screen>
        <TopBar title="Product" back />
        <LoadingBlock />
      </Screen>
    );
  }
  if (!product) {
    return (
      <Screen>
        <TopBar title="Product" back />
        <ErrorBlock message={error ?? 'That product is not listed.'} />
      </Screen>
    );
  }

  const coinsLeft = shownCoins(user?.wallet.coinsBalance ?? 0, local, local.spentCoins);

  async function addToCart() {
    if (!product || product.sample) return;
    setPending(true);
    setMessage(null);
    try {
      await api.post('/marketplace/cart/items', { productId: product.id, quantity: 1 });
      router.push('/cart' as Href);
    } catch (err) {
      setMessage(errorMessage(err, 'The shop could not add this item.'));
    } finally {
      setPending(false);
    }
  }

  async function redeemSample() {
    if (!product) return;
    if (coinsLeft < product.coinPrice) {
      setMessage(
        `This sample asks for ${formatCount(product.coinPrice)} coins. You have ${formatCount(coinsLeft)} available on this phone.`,
      );
      return;
    }
    setPending(true);
    await updateLocal((state) => ({
      ...state,
      spentCoins: state.spentCoins + product.coinPrice,
      redemptions: [
        {
          id: uuid(),
          productName: product.name,
          productSlug: product.slug,
          coins: product.coinPrice,
          createdAt: new Date().toISOString(),
        },
        ...state.redemptions,
      ],
    }));
    setPending(false);
    setConfirmed(true);
  }

  if (confirmed) {
    return (
      <Screen
        footer={
          <Button label="Back to market" onPress={() => router.replace('/marketplace' as Href)} />
        }
      >
        <TopBar title="Redeemed" back />
        <T weight="extrabold" className="text-4xl text-ink">
          Saved on this phone
        </T>
        <T className="mt-2 text-base leading-6 text-muted-foreground">
          {product.name} is in your device redemption list. EcoLife has not taken any coins.
        </T>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          label={
            source === 'device'
              ? `Redeem for ${formatCount(product.coinPrice)} coins`
              : 'Add to cart'
          }
          onPress={() => void (source === 'device' ? redeemSample() : addToCart())}
          loading={pending}
        />
      }
    >
      <TopBar title={product.name} back />
      {product.imageUrl ? (
        <Image
          source={{ uri: product.imageUrl }}
          className="h-64 w-full rounded-[28px] bg-accent"
        />
      ) : (
        <View className="h-64 rounded-[28px] bg-accent" />
      )}
      <T className="mt-4 text-xs uppercase tracking-wide text-forest">
        {CATEGORY_LABELS[product.category]}
      </T>
      <T weight="extrabold" className="text-3xl text-ink">
        {product.name}
      </T>
      <T className="mt-2 text-base leading-6 text-muted-foreground">{product.description}</T>
      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-[20px] bg-card p-4">
          <T className="text-xs text-muted-foreground">Price</T>
          <T weight="extrabold" className="text-xl text-ink">
            {formatInrFromPaise(product.pricePaise)}
          </T>
        </View>
        <View className="flex-1 rounded-[20px] bg-accent p-4">
          <T className="text-xs text-forest">
            {source === 'device' ? 'Coin price' : 'Coins off, max'}
          </T>
          <T weight="extrabold" className="text-xl text-ink">
            {formatCount(product.coinPrice)}
          </T>
        </View>
      </View>
      {product.co2SavedKg ? (
        <T className="mt-3 text-sm text-forest">
          About {formatKg(product.co2SavedKg)} kg CO₂e avoided over its life.
        </T>
      ) : null}
      <T className="mt-2 text-sm text-muted-foreground">{product.stock} in stock</T>
      {source === 'device' ? (
        <View className="mt-4">
          <Note>This is a sample product. Redeeming it does not place an EcoLife order.</Note>
        </View>
      ) : null}
      {message ? (
        <T weight="semibold" className="mt-3 text-sm text-destructive">
          {message}
        </T>
      ) : null}
    </Screen>
  );
}
