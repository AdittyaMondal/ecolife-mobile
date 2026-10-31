import tokens from '../../design-tokens.json';

/**
 * Hex values for the places a NativeWind `className` cannot reach — navigator options,
 * `StatusBar`, SVG props. Same source as the Tailwind theme, so they cannot drift.
 */
export const colors = {
  eco: tokens.eco,
  background: tokens.background.DEFAULT,
  foreground: tokens.foreground.DEFAULT,
  card: tokens.card.DEFAULT,
  primary: tokens.primary.DEFAULT,
  muted: tokens.muted.DEFAULT,
  border: tokens.border.DEFAULT,
  destructive: tokens.destructive.DEFAULT,
} as const;
