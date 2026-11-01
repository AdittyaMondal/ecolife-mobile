import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, TextInput, View } from 'react-native';
import { Screen, TopBar } from '@/components/ui/header';
import { PressableScale, Rise } from '@/components/ui/motion';
import { Note, Pill } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { CATEGORY_LABELS } from '@/data/content';
import { useCatalog } from '@/hooks/resources';
import { formatCount, formatInrFromPaise } from '@/lib/format';
import { shownCoins } from '@/lib/local-state';
import { hardShadow } from '@/lib/shadows';
import { colors } from '@/lib/theme';
import { useAuth } from '@/providers/auth-provider';
import type { ProductCategory } from '@/types/domain';

const FILTERS = ['all', 'household', 'kitchen', 'personal_care', 'plants', 'stationery'] as const;

export default function Marketplace() {
  const { user, local } = useAuth();
  const [category, setCategory] = useState<(typeof FILTERS)[number]>('all');
  const [query, setQuery] = useState('');
  const { products, source, loading, error } = useCatalog(category, query);
  const featured = products[0];
  const coins = shownCoins(
    user?.wallet.coinsBalance ?? 0,
    local,
    source === 'device' ? local.spentCoins : 0,
  );

  return (
    <Screen dock>
      <TopBar eyebrow="EcoLife" title="Marketplace" avatar />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search sustainable products"
        placeholderTextColor={colors.mutedForeground}
        className="mb-4 min-h-[48px] rounded-full border-2 border-ink bg-card px-4 text-base text-ink"
        style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row gap-2">
          {FILTERS.map((item) => (
            <Pill
              key={item}
              label={item === 'all' ? 'All' : (CATEGORY_LABELS[item] ?? item)}
              active={category === item}
              onPress={() => setCategory(item)}
            />
          ))}
        </View>
      </ScrollView>
      <View className="mb-4 rounded-[28px] bg-secondary p-5" style={hardShadow}>
        <T className="text-xs uppercase tracking-widest text-eco-100">Available coins</T>
        <T weight="extrabold" className="mt-1 text-4xl text-cream">
          {formatCount(coins)}
        </T>
        <T className="mt-1 text-sm text-eco-100">10 coins = ₹1 off, up to 20% of an order</T>
        {local.spentCoins > 0 ? (
          <T className="mt-2 text-xs text-eco-100">
            {formatCount(local.spentCoins)} coins are reserved by redemptions saved only on this
            phone.
          </T>
        ) : null}
      </View>
      {source === 'device' ? (
        <View className="mb-4">
          <Note>
            Sample catalogue. Redemptions here stay on this phone and do not charge your EcoLife
            coins.
          </Note>
        </View>
      ) : null}
      {error ? (
        <T weight="semibold" className="mb-3 text-sm text-destructive">
          {error}
        </T>
      ) : null}
      {loading ? <T className="text-muted-foreground">Loading the shop…</T> : null}
      {featured ? (
        <Rise>
          <PressableScale
            onPress={() => router.push(`/product/${featured.slug}` as Href)}
            className="mb-4 overflow-hidden rounded-[28px] border-2 border-ink bg-card"
            style={hardShadow}
          >
            {featured.imageUrl ? (
              <Image source={{ uri: featured.imageUrl }} className="h-48 w-full" />
            ) : (
              <View className="h-48 bg-accent" />
            )}
            <View className="p-4">
              <T className="text-xs uppercase tracking-wide text-forest">Featured</T>
              <T weight="extrabold" className="text-2xl text-ink">
                {featured.name}
              </T>
              <T weight="bold" className="mt-1 text-forest">
                {formatInrFromPaise(featured.pricePaise)} · {formatCount(featured.coinPrice)} coins
              </T>
            </View>
          </PressableScale>
        </Rise>
      ) : null}
      <View className="flex-row flex-wrap justify-between gap-y-4">
        {products.slice(featured ? 1 : 0).map((product, index) => (
          <Rise key={product.slug} index={index} className="w-[48%]">
            <PressableScale
              onPress={() => router.push(`/product/${product.slug}` as Href)}
              className="rounded-[24px] border-2 border-ink bg-card p-2"
              style={hardShadow}
            >
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} className="h-28 w-full rounded-[16px]" />
              ) : (
                <View className="h-28 rounded-[16px] bg-accent" />
              )}
              <T className="mt-2 px-1 text-[11px] uppercase text-muted-foreground">
                {CATEGORY_LABELS[product.category as ProductCategory]}
              </T>
              <T weight="bold" className="px-1 text-sm text-ink" numberOfLines={2}>
                {product.name}
              </T>
              <T weight="extrabold" className="px-1 pb-1 text-forest">
                {formatInrFromPaise(product.pricePaise)}
              </T>
            </PressableScale>
          </Rise>
        ))}
      </View>
      <PressableScale onPress={() => router.push('/orders' as Href)} className="mt-5">
        <T weight="bold" className="text-center text-forest">
          Redemption history
        </T>
      </PressableScale>
    </Screen>
  );
}
