import { type Href, router } from 'expo-router';
import { Image, View } from 'react-native';
import { PressableScale } from '@/components/ui/motion';
import { T } from '@/components/ui/text';
import { CATEGORY_LABELS } from '@/data/content';
import { formatInrFromPaise, formatKg } from '@/lib/format';
import { hardShadow } from '@/lib/shadows';
import type { CatalogProduct, Order, Product } from '@/types/domain';

export function stockLabel(stock: number) {
  if (stock <= 0) return 'Out of stock';
  if (stock <= 5) return `Only ${stock} left`;
  return 'In stock';
}

export const ORDER_STATUS: Record<Order['status'], string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  shipped: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function ProductImage({ uri, height }: { uri: string | null; height: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ height, width: '100%' }} resizeMode="cover" />;
  }
  return <View className="bg-accent" style={{ height }} />;
}

export function ProductTile({
  product,
  className = 'w-[48%]',
}: {
  product: CatalogProduct | Product;
  className?: string;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={() => router.push(`/product/${product.slug}` as Href)}
      className={`overflow-hidden rounded-[24px] border-2 border-ink bg-card ${className}`}
      style={hardShadow}
    >
      <ProductImage uri={product.imageUrl} height={112} />
      <View className="p-3">
        <T className="text-[11px] uppercase text-muted-foreground">
          {CATEGORY_LABELS[product.category]}
        </T>
        <T weight="bold" className="mt-0.5 text-sm text-ink" numberOfLines={2}>
          {product.name}
        </T>
        <T weight="extrabold" className="mt-1 text-forest">
          {formatInrFromPaise(product.pricePaise)}
        </T>
        <T className="text-[11px] text-muted-foreground">
          {product.co2SavedKg
            ? `${formatKg(product.co2SavedKg)} kg CO₂e saved`
            : stockLabel(product.stock)}
        </T>
      </View>
    </PressableScale>
  );
}
