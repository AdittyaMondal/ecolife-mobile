import { type Href, router } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { ProductImage, ProductTile, stockLabel } from '@/components/market';
import { Screen, TopBar } from '@/components/ui/header';
import { PressableScale, Rise } from '@/components/ui/motion';
import { Button, EmptyBlock, Note, Pill } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { CATEGORY_LABELS } from '@/data/content';
import { useCart, useCatalog } from '@/hooks/resources';
import { formatCount, formatInrFromPaise, formatKg } from '@/lib/format';
import { shownCoins } from '@/lib/local-state';
import { hardShadow } from '@/lib/shadows';
import { colors } from '@/lib/theme';
import { useAuth } from '@/providers/auth-provider';
import type { ProductCategory, ProductSort } from '@/types/domain';

const FILTERS = ['all', 'household', 'kitchen', 'personal_care', 'plants', 'stationery'] as const;

const SORTS: { id: ProductSort; label: string }[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'price_asc', label: 'Price ↑' },
  { id: 'price_desc', label: 'Price ↓' },
  { id: 'co2_desc', label: 'Most CO₂ saved' },
];

export default function Marketplace() {
  const { user, local } = useAuth();
  const [category, setCategory] = useState<(typeof FILTERS)[number]>('all');
  const [sort, setSort] = useState<ProductSort>('newest');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const { products, source, loading, error, hasMore, loadMore, loadingMore } = useCatalog(
    category,
    search,
    sort,
  );
  const { count } = useCart();
  const featured = products[0];
  const rest = products.slice(featured ? 1 : 0);
  const coins = shownCoins(
    user?.wallet.coinsBalance ?? 0,
    local,
    source === 'device' ? local.spentCoins : 0,
  );

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 280);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Screen dock>
      <TopBar eyebrow="EcoLife" title="Marketplace" avatar />
      <View className="mb-4 flex-row gap-3">
        <View
          className="flex-1 justify-center rounded-[24px] bg-secondary px-4 py-3"
          style={hardShadow}
        >
          <T className="text-[11px] uppercase tracking-widest text-eco-100">Coins</T>
          <T weight="extrabold" className="text-3xl text-cream">
            {formatCount(coins)}
          </T>
          <T className="text-xs text-eco-100">10 coins = ₹1, up to 20% off</T>
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={count ? `Cart, ${count} items` : 'Cart'}
          onPress={() => router.push('/cart' as Href)}
          className="items-center justify-center rounded-[24px] border-2 border-ink bg-card px-5"
          style={hardShadow}
        >
          <ShoppingBag color={colors.ink} size={22} />
          <T weight="extrabold" className="mt-1 text-sm text-ink">
            {count > 0 ? formatCount(count) : 'Cart'}
          </T>
        </PressableScale>
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search plants, bottles, refills"
        placeholderTextColor={colors.mutedForeground}
        className="mb-3 min-h-[48px] rounded-full border-2 border-ink bg-card px-4 text-base text-ink"
        style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {SORTS.map((item) => (
            <Pill
              key={item.id}
              label={item.label}
              active={sort === item.id}
              onPress={() => setSort(item.id)}
            />
          ))}
        </View>
      </ScrollView>
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
      {source === 'device' && !loading ? (
        <View className="mb-4">
          <Note>
            Sample catalogue. These redemptions stay on this phone and do not charge your EcoLife
            coins.
          </Note>
        </View>
      ) : null}
      {local.spentCoins > 0 ? (
        <T className="mb-3 text-xs text-muted-foreground">
          {formatCount(local.spentCoins)} coins are reserved by phone-only redemptions.
        </T>
      ) : null}
      {error ? (
        <T weight="semibold" className="mb-3 text-sm text-destructive">
          {error}
        </T>
      ) : null}
      {loading ? <T className="text-muted-foreground">Loading the shop…</T> : null}
      {!loading && products.length === 0 ? (
        <EmptyBlock
          title="Nothing matches"
          body="Try another word, or clear the category. The shop only lists plants, home, personal care, drinkware, and stationery."
        />
      ) : null}
      {featured ? (
        <Rise>
          <PressableScale
            accessibilityRole="button"
            onPress={() => router.push(`/product/${featured.slug}` as Href)}
            className="mb-4 overflow-hidden rounded-[28px] border-2 border-ink bg-card"
            style={hardShadow}
          >
            <ProductImage uri={featured.imageUrl} height={188} />
            <View className="p-4">
              <T className="text-xs uppercase tracking-wide text-forest">
                {CATEGORY_LABELS[featured.category as ProductCategory]}
              </T>
              <T weight="extrabold" className="text-2xl text-ink">
                {featured.name}
              </T>
              <T className="mt-1 text-sm leading-5 text-muted-foreground" numberOfLines={2}>
                {featured.description}
              </T>
              <View className="mt-3 flex-row items-end justify-between">
                <T weight="extrabold" className="text-xl text-forest">
                  {formatInrFromPaise(featured.pricePaise)}
                </T>
                <T weight="semibold" className="text-sm text-ink">
                  {featured.co2SavedKg
                    ? `${formatKg(featured.co2SavedKg)} kg CO₂e`
                    : stockLabel(featured.stock)}
                </T>
              </View>
            </View>
          </PressableScale>
        </Rise>
      ) : null}
      <View className="flex-row flex-wrap justify-between gap-y-4">
        {rest.map((product, index) => (
          <Rise key={product.slug} index={index} className="w-[48%]">
            <ProductTile product={product} className="w-full" />
          </Rise>
        ))}
      </View>
      {hasMore ? (
        <View className="mt-5">
          <Button
            label={loadingMore ? 'Loading…' : 'Show more'}
            variant="outline"
            onPress={() => void loadMore()}
            loading={loadingMore}
          />
        </View>
      ) : null}
      <PressableScale
        accessibilityRole="button"
        onPress={() => router.push('/orders' as Href)}
        className="mt-5"
      >
        <T weight="bold" className="text-center text-forest">
          Orders and redemptions
        </T>
      </PressableScale>
    </Screen>
  );
}
