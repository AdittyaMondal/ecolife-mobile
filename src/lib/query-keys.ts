/** Every query key in the app. Centralised so invalidation is never a guess. */
export const qk = {
  health: () => ['health'] as const,
  home: (userId: number) => ['home', userId] as const,
  profile: (userId: number) => ['profile', userId] as const,
  onboarding: (userId: number) => ['onboarding', userId] as const,
  trackToday: (userId: number) => ['track', 'today', userId] as const,
  trackHistory: (userId: number, from: string, to: string) =>
    ['track', 'history', userId, from, to] as const,
  products: (category: string, q: string) => ['products', category, q] as const,
  product: (slug: string) => ['product', slug] as const,
  cart: (userId: number) => ['cart', userId] as const,
  orders: (userId: number) => ['orders', userId] as const,
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
