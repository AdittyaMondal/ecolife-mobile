import { View } from 'react-native';

/**
 * A placeholder block. Shaped like the content it stands in for, so the layout does not jump
 * when the real card arrives — a spinner cannot do that.
 *
 * Not announced: the screen that owns it carries the one "Loading" announcement.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`rounded-lg bg-muted ${className ?? ''}`}
    />
  );
}
