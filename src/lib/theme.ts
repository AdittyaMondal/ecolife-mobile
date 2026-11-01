import tokens from '../../design-tokens.json';

/**
 * Hex values for navigator options, StatusBar and SVG. Same file as the Tailwind theme.
 * Palette follows Colorpallete.md: primary #A8DB36, secondary #244D36, tertiary #83C43C,
 * neutral #202820, on a light cream ground.
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
  ink: tokens.ink.DEFAULT,
  forest: tokens.forest.DEFAULT,
  lime: tokens.lime.DEFAULT,
  leaf: tokens.leaf.DEFAULT,
  cream: tokens.cream.DEFAULT,
  clay: tokens.clay.DEFAULT,
} as const;

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
  ink: tokens.ink.dark,
  forest: tokens.forest.dark,
  lime: tokens.lime.dark,
  leaf: tokens.leaf.dark,
  cream: tokens.cream.dark,
  clay: tokens.clay.dark,
} as const;
