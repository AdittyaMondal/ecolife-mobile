/**
 * Every query key in the app. Centralised so invalidation is never a guess (PRD-v2 §9.2).
 * Keys are added as their sprint lands; health is all Sprint 0 needs.
 */
export const qk = {
  health: () => ['health'] as const,
} as const;
