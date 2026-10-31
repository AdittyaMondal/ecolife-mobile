import tokens from '../../design-tokens.json';

/**
 * Hex values for the places a NativeWind `className` cannot reach — navigator options,
 * `StatusBar`, SVG props. Same source as the Tailwind theme, so they cannot drift.
 *
 * Values are mirrored from ecolife-web/src/app/globals.css. Never edit them here or in
 * design-tokens.json — change them in the web repo first, then copy. Two of them look
 * wrong and are not:
 *   - primary-foreground is eco-950, not white. White on eco-600 is 3.30:1 and fails AA
 *     for button text; eco-950 on eco-600 is 4.52:1.
 *   - input is DARKER than border. border is decorative (dividers, card edges); input is a
 *     control boundary and has to clear WCAG 2.2's 3:1. Do not swap them.
 */
export const colors = {
  eco: tokens.eco,
  background: tokens.background.DEFAULT,
  foreground: tokens.foreground.DEFAULT,
  card: tokens.card.DEFAULT,
  cardForeground: tokens['card-foreground'].DEFAULT,
  primary: tokens.primary.DEFAULT,
  primaryForeground: tokens['primary-foreground'].DEFAULT,
  secondary: tokens.secondary.DEFAULT,
  muted: tokens.muted.DEFAULT,
  mutedForeground: tokens['muted-foreground'].DEFAULT,
  accent: tokens.accent.DEFAULT,
  border: tokens.border.DEFAULT,
  input: tokens.input.DEFAULT,
  ring: tokens.ring.DEFAULT,
  destructive: tokens.destructive.DEFAULT,
} as const;

/** The same set for dark mode, for the same non-className surfaces. */
export const darkColors = {
  eco: tokens.eco,
  background: tokens.background.dark,
  foreground: tokens.foreground.dark,
  card: tokens.card.dark,
  cardForeground: tokens['card-foreground'].dark,
  primary: tokens.primary.dark,
  primaryForeground: tokens['primary-foreground'].dark,
  secondary: tokens.secondary.dark,
  muted: tokens.muted.dark,
  mutedForeground: tokens['muted-foreground'].dark,
  accent: tokens.accent.dark,
  border: tokens.border.dark,
  input: tokens.input.dark,
  ring: tokens.ring.dark,
  destructive: tokens.destructive.dark,
} as const;
