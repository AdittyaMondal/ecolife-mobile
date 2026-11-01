import { Image, View } from 'react-native';

export function avatarUrlFor(name: string, explicit?: string | null): string {
  if (explicit) return explicit;
  const seed = encodeURIComponent(name.trim() || 'ecolife');
  return `https://api.dicebear.com/9.x/notionists/png?seed=${seed}&backgroundColor=a8db36,e7f6c8&radius=50`;
}

export function Avatar({
  name,
  uri,
  size = 40,
}: {
  name: string;
  uri?: string | null;
  size?: number;
}) {
  return (
    <View
      className="overflow-hidden rounded-full border-2 border-ink bg-primary"
      style={{ width: size, height: size }}
    >
      <Image
        source={{ uri: avatarUrlFor(name, uri) }}
        style={{ width: size, height: size }}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
