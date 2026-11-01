/** Every query key in the app. Centralised so invalidation is never a guess. */
export const qk = {
  health: () => ['health'] as const,
  // `= 0` not `: number` — see 89a1428. These keys are built during the
  // pre-auth render, before a user id exists; requiring the argument makes
  // qk.home() in use-home.ts a type error. The v2 merge reverted this once
  // already, and origin/main did not typecheck as a result.
  home: (userId = 0) => ['home', userId] as const,
  profile: (userId: number) => ['profile', userId] as const,
  onboarding: (userId: number) => ['onboarding', userId] as const,
  trackToday: (userId = 0) => ['track', 'today', userId] as const,
  trackHistory: (userId: number, from: string, to: string) =>
    ['track', 'history', userId, from, to] as const,
  products: (category: string, q: string, sort: string) => ['products', category, q, sort] as const,
  product: (slug: string) => ['product', slug] as const,
  cart: (userId: number) => ['cart', userId] as const,
  orders: (userId: number) => ['orders', userId] as const,
  order: (id: number) => ['order', id] as const,
  addresses: (userId: number) => ['addresses', userId] as const,
  events: (userId: number, filter: string, type: string) =>
    ['events', userId, filter, type] as const,
  event: (slug: string) => ['event', slug] as const,
  pass: (eventId: number) => ['pass', eventId] as const,
  leaderboard: (period: string) => ['leaderboard', period] as const,
  leaderboardMe: (userId: number) => ['leaderboard', 'me', userId] as const,
  rewards: (userId: number) => ['rewards', userId] as const,
  notifications: (userId: number) => ['notifications', userId] as const,
  cities: (q: string) => ['cities', q] as const,
} as const;
