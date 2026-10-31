/**
 * Number formatting rules, in one place so a card cannot invent its own.
 * Kilograms get one decimal; points and coins get thousands separators.
 */

/** One decimal, always — "6.0 kg", never "6 kg". */
export function kg(value: number): string {
  return value.toFixed(1);
}

/**
 * Thousands separators. Hermes ships different Intl backends on iOS and Android, so this does
 * not go through `toLocaleString` — the grouping has to look the same on both.
 */
export function points(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Whole percent. Progress bars and breakdown shares are never shown to a decimal. */
export function percent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * A signed change, as a glyph AND a word. Colour and the arrow are never the only signal
 * (DESIGN.md), so every caller gets prose it can read out.
 */
export function trend(
  delta: number,
  words: { down: string; up: string; flat: string },
): { arrow: string; word: string; magnitude: number; tone: 'good' | 'bad' | 'flat' } {
  if (Math.abs(delta) < 0.05) {
    return { arrow: '=', word: words.flat, magnitude: 0, tone: 'flat' };
  }
  // Less CO2e is the good direction, so a negative delta is an improvement.
  return delta < 0
    ? { arrow: '▼', word: words.down, magnitude: Math.abs(delta), tone: 'good' }
    : { arrow: '▲', word: words.up, magnitude: Math.abs(delta), tone: 'bad' };
}
