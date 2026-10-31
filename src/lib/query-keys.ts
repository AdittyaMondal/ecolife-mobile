/**
 * Every query key in the app. Centralised so invalidation is never a guess (PRD-v2 §9.2).
 * Keys are added as their sprint lands.
 */
export const qk = {
  health: () => ['health'] as const,
  /** The whole Home screen is one request (PRD-v2 §6.2), so it is one key. */
  home: () => ['home'] as const,
  /** Today's log + question set + "same as usual" defaults (PRD-v2 §6.3). */
  trackToday: () => ['track', 'today'] as const,
} as const;
