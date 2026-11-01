import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ProductImage, ProductTile, stockLabel } from '@/components/market';
import { Screen, TopBar } from '@/components/ui/header';
import { Button, ErrorBlock, LoadingBlock, Note, Stepper } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { CATEGORY_LABELS } from '@/data/content';
import { useCatalog, useProductDetail, useShop } from '@/hooks/resources';
import { errorMessage } from '@/lib/errors';
import { formatCount, formatInrFromPaise, formatKg } from '@/lib/format';
import { uuid } from '@/lib/ids';
import { shownCoins } from '@/lib/local-state';
import { useAuth } from '@/providers/auth-provider';

export default function ProductDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { product, source, loading, error } = useProductDetail(slug ?? '');
  const related = useCatalog(product?.category ?? 'all', '', 'co2_desc');
  const shop = useShop();
  const { user, local, updateLocal } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setQuantity(1);
    setMessage(null);
    setConfirmed(false);
  }, [slug]);

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
  const soldOut = source === 'api' && product.stock <= 0;
  const maxQty = Math.max(1, Math.min(20, product.stock || 1));
  const others = related.products.filter((item) => item.slug !== product.slug).slice(0, 4);

  async function addToCart() {
    if (!product || product.sample) return;
    setPending(true);
    setMessage(null);
    try {
      await shop.add(product.id, quantity);
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
            soldOut
              ? 'Out of stock'
              : source === 'device'
                ? `Redeem for ${formatCount(product.coinPrice)} coins`
                : `Add ${quantity} to cart`
          }
          onPress={() => void (source === 'device' ? redeemSample() : addToCart())}
          loading={pending}
          disabled={soldOut}
        />
      }
    >
      <TopBar title={product.name} back />
      <View className="overflow-hidden rounded-[28px] border-2 border-ink">
        <ProductImage uri={product.imageUrl} height={256} />
      </View>
      <View className="mt-4 flex-row items-center justify-between">
        <T className="text-xs uppercase tracking-wide text-forest">
          {CATEGORY_LABELS[product.category]}
        </T>
        <T
          weight="semibold"
          className={product.stock <= 5 ? 'text-sm text-destructive' : 'text-sm text-forest'}
        >
          {stockLabel(product.stock)}
        </T>
      </View>
      <T weight="extrabold" className="text-3xl text-ink">
        {product.name}
      </T>
      {product.description ? (
        <T className="mt-2 text-base leading-6 text-muted-foreground">{product.description}</T>
      ) : null}
      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-[20px] bg-card p-4">
          <T className="text-xs text-muted-foreground">Price</T>
          <T weight="extrabold" className="text-xl text-ink">
            {formatInrFromPaise(product.pricePaise)}
          </T>
        </View>
        <View className="flex-1 rounded-[20px] bg-accent p-4">
          <T className="text-xs text-forest">{source === 'device' ? 'Coin price' : 'CO₂e saved'}</T>
          <T weight="extrabold" className="text-xl text-ink">
            {source === 'device'
              ? formatCount(product.coinPrice)
              : product.co2SavedKg
                ? `${formatKg(product.co2SavedKg)} kg`
                : '—'}
          </T>
        </View>
      </View>
      {source === 'api' ? (
        <T className="mt-3 text-sm leading-5 text-muted-foreground">
          Coins come off at checkout. Ten coins equal ₹1, and the shop caps the discount at 20% of
          the order.
        </T>
      ) : null}
      {source === 'api' && !soldOut ? (
        <View className="mt-4">
          <Stepper value={quantity} min={1} max={maxQty} onChange={setQuantity} suffix="quantity" />
        </View>
      ) : null}
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
      {others.length > 0 ? (
        <View className="mt-8">
          <T weight="extrabold" className="mb-3 text-xl text-ink">
            More in {CATEGORY_LABELS[product.category]}
          </T>
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {others.map((item) => (
              <ProductTile key={item.slug} product={item} />
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
