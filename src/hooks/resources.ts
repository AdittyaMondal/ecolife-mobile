import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import {
  CATEGORY_META,
  ORG_QUESTIONS,
  orgRanks,
  SAMPLE_EVENTS,
  SAMPLE_PRODUCTS,
  sampleRanks,
  tipForToday,
} from '@/data/content';
import { estimateDaily, scoreCheckIn } from '@/lib/carbon';
import { errorMessage, isUnavailable } from '@/lib/errors';
import { ApiError, api } from '@/lib/fetcher';
import { coinsForPaise, formatWhen } from '@/lib/format';
import { daysAgoISO, todayISO, uuid } from '@/lib/ids';
import { shownCoins, shownPoints } from '@/lib/local-state';
import { asHistory, asRankRows, normalizeRank, pageInfo, unwrapList } from '@/lib/normalizers';
import { qk } from '@/lib/query-keys';
import { useAuth } from '@/providers/auth-provider';
import type {
  Address,
  AddressInput,
  Breakdown,
  CartQuote,
  CatalogEvent,
  CatalogProduct,
  CheckInReward,
  DailyAnswers,
  EventItem,
  EventPass,
  HistoryPoint,
  Home,
  LocalUserState,
  LogResult,
  MyRank,
  NotificationItem,
  Order,
  OrderLine,
  OwnProfile,
  Product,
  ProductSort,
  RankRow,
  RewardEntry,
  SubmitLogBody,
  TrackToday,
} from '@/types/domain';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asProducts(data: unknown): Product[] {
  return unwrapList(data).filter((item): item is Product => {
    if (!isRecord(item)) return false;
    return (
      typeof item.slug === 'string' &&
      typeof item.name === 'string' &&
      typeof item.pricePaise === 'number'
    );
  });
}

function asEvents(data: unknown): EventItem[] {
  return unwrapList(data).filter((item): item is EventItem => {
    if (!isRecord(item)) return false;
    return (
      typeof item.slug === 'string' &&
      typeof item.title === 'string' &&
      typeof item.startAt === 'string'
    );
  });
}

function asOrderLine(item: unknown): OrderLine | null {
  if (!isRecord(item)) return null;
  const productName =
    typeof item.productName === 'string'
      ? item.productName
      : typeof item.name === 'string'
        ? item.name
        : null;
  if (!productName) return null;
  return {
    productName,
    unitPaise: typeof item.unitPaise === 'number' ? item.unitPaise : 0,
    quantity: typeof item.quantity === 'number' ? item.quantity : 1,
  };
}

function asOrders(data: unknown): Order[] {
  return unwrapList(data).flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== 'number' || typeof item.orderNumber !== 'string') {
      return [];
    }
    const lines = Array.isArray(item.items)
      ? item.items.map(asOrderLine).filter((line): line is OrderLine => line !== null)
      : [];
    return [{ ...(item as Order), items: lines }];
  });
}

function asRewards(data: unknown): RewardEntry[] {
  return unwrapList(data).filter((item): item is RewardEntry => {
    if (!isRecord(item)) return false;
    return typeof item.id === 'number' && typeof item.createdAt === 'string';
  });
}

function asNotifications(data: unknown): NotificationItem[] {
  return unwrapList(data).filter((item): item is NotificationItem => {
    if (!isRecord(item)) return false;
    return typeof item.id === 'number' && typeof item.title === 'string';
  });
}

function asAddresses(data: unknown): Address[] {
  return unwrapList(data).filter(
    (item): item is Address =>
      isRecord(item) && typeof item.id === 'number' && typeof item.line1 === 'string',
  );
}

export function decorateProduct(product: Product, sample = false): CatalogProduct {
  const extra = product as CatalogProduct;
  return {
    ...product,
    sample,
    badge: extra.badge ?? null,
    coinPrice:
      sample && extra.coinPrice
        ? extra.coinPrice
        : Math.max(1, Math.round(coinsForPaise(product.pricePaise) * 0.2)),
  };
}

function shiftDate(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year || 2026, (month || 1) - 1, day || 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function settledLog(
  result: LogResult | null,
  answers: DailyAnswers,
  base: { totalKg: number } | null,
) {
  const estimated = estimateDaily(answers, base as OwnProfile['baseline'] | null);
  const breakdown =
    result?.breakdown && typeof result.breakdown.totalKg === 'number'
      ? result.breakdown
      : estimated;
  const baselineTotalKg =
    typeof result?.baselineTotalKg === 'number'
      ? result.baselineTotalKg
      : (base?.totalKg ?? breakdown.totalKg);
  const deltaKg =
    typeof result?.deltaKg === 'number'
      ? result.deltaKg
      : Math.round((breakdown.totalKg - baselineTotalKg) * 100) / 100;
  const apiPoints = result?.reward?.pointsDelta ?? 0;
  const reward: CheckInReward =
    apiPoints > 0
      ? { points: apiPoints, coins: result?.reward?.coinsDelta ?? 0, source: 'api' }
      : { ...scoreCheckIn(breakdown.totalKg, baselineTotalKg), source: 'device' };
  return { breakdown, baselineTotalKg, deltaKg, reward, points: reward.points };
}

function deviceStreak(logs: Record<string, unknown>, today: string): number {
  let cursor = logs[today] ? today : shiftDate(today, -1);
  let count = 0;
  while (logs[cursor]) {
    count += 1;
    cursor = shiftDate(cursor, -1);
    if (count > 365) break;
  }
  return count;
}

export type HomeModel = {
  source: 'api' | 'device';
  name: string;
  totalKg: number;
  baselineKg: number;
  deltaKg: number;
  percent: number;
  breakdown: Breakdown;
  logged: boolean;
  streak: number;
  weekChange: number | null;
  ranks: RankRow[];
  myRank: number | null;
  next: { slug: string; title: string; when: string; venue: string } | null;
  goal: { label: string; progress: number; daysLeft: number; onTrack: boolean } | null;
  points: number;
  coins: number;
};

const EMPTY_BREAKDOWN: Breakdown = {
  transportKg: 0,
  foodKg: 0,
  homeEnergyKg: 0,
  waterKg: 0,
  wasteKg: 0,
  totalKg: 0,
};

export function useHomeModel() {
  const { user, local } = useAuth();
  const zone = user?.timezone || 'Asia/Kolkata';
  const today = todayISO(zone);
  const query = useQuery({
    queryKey: qk.home(user?.id ?? 0),
    enabled: Boolean(user),
    queryFn: () => api.get<Home>('/home'),
  });

  const baseline = local.baseline?.totalKg ?? 0;
  const log = local.logs[today];
  const deviceBreakdown = log?.breakdown ?? local.baseline ?? EMPTY_BREAKDOWN;
  const deviceTotal = log?.breakdown.totalKg ?? 0;
  const deviceRanks = user
    ? sampleRanks({
        id: user.id,
        name: user.name,
        points: shownPoints(user.wallet.pointsTotal, local),
        city: user.city,
      })
    : [];

  const device: HomeModel = {
    source: 'device',
    name: user?.name ?? 'there',
    totalKg: deviceTotal,
    baselineKg: log?.baselineTotalKg || baseline,
    deltaKg: log?.deltaKg ?? deviceTotal - baseline,
    percent: baseline > 0 && log ? (deviceTotal / baseline) * 100 : 0,
    breakdown: deviceBreakdown,
    logged: Boolean(log),
    streak: deviceStreak(local.logs, today),
    weekChange: null,
    ranks: deviceRanks.slice(0, 3),
    myRank: deviceRanks.find((row) => row.userId === user?.id)?.rank ?? null,
    next: SAMPLE_EVENTS[0]
      ? {
          slug: SAMPLE_EVENTS[0].slug,
          title: SAMPLE_EVENTS[0].title,
          when: formatWhen(SAMPLE_EVENTS[0].startAt, zone),
          venue: SAMPLE_EVENTS[0].venueName,
        }
      : null,
    goal: null,
    points: shownPoints(user?.wallet.pointsTotal ?? 0, local),
    coins: shownCoins(user?.wallet.coinsBalance ?? 0, local, local.spentCoins),
  };

  if (!query.data) {
    return {
      model: paintToday(device, local, today),
      loading: query.isPending || query.isFetching,
      error: query.isError ? errorMessage(query.error) : null,
      tip: tipForToday(today),
    };
  }

  const home = query.data;
  const top = asRankRows(home.leaderboard?.top);
  const me = normalizeRank(home.leaderboard?.me, top.length);
  const model: HomeModel = {
    source: 'api',
    name: home.greetingName || user?.name || 'there',
    totalKg: home.today.breakdown.totalKg,
    baselineKg: home.today.baselineTotalKg,
    deltaKg: home.today.deltaKg,
    percent: home.today.percentOfBaseline,
    breakdown: home.today.logged ? home.today.breakdown : home.breakdown30d,
    logged: home.today.logged,
    streak: home.streak.current,
    weekChange: home.week.changeVsLastWeekPct,
    ranks: top.length ? top : device.ranks,
    myRank: me?.rank ?? null,
    next: home.nextEvent
      ? {
          slug: home.nextEvent.slug,
          title: home.nextEvent.title,
          when: formatWhen(home.nextEvent.startAt, zone),
          venue: home.nextEvent.venueName,
        }
      : device.next,
    goal: home.activeGoal
      ? {
          label: home.activeGoal.label,
          progress: home.activeGoal.progressPct,
          daysLeft: home.activeGoal.daysLeft,
          onTrack: home.activeGoal.onTrack,
        }
      : null,
    points: shownPoints(home.wallet.pointsTotal, local),
    coins: shownCoins(home.wallet.coinsBalance, local),
  };

  const painted = paintToday(model, local, today);
  return {
    model: painted,
    loading: query.isFetching && !painted.logged && painted.points === 0,
    error: null,
    tip: tipForToday(today),
  };
}

function paintToday(model: HomeModel, local: LocalUserState, today: string): HomeModel {
  const log = local.logs[today];
  if (!log || (model.logged && model.totalKg > 0)) return model;
  const baselineKg = log.baselineTotalKg || model.baselineKg;
  const totalKg = log.breakdown.totalKg;
  return {
    ...model,
    logged: true,
    totalKg,
    breakdown: log.breakdown,
    baselineKg,
    deltaKg: log.deltaKg,
    percent: baselineKg > 0 ? (totalKg / baselineKg) * 100 : 0,
  };
}

export function useTrackModel() {
  const { user, local, updateLocal, refreshUser, setUser, isEmployee } = useAuth();
  const client = useQueryClient();
  const zone = user?.timezone || 'Asia/Kolkata';
  const today = todayISO(zone);
  const from = daysAgoISO(13, zone);
  const enabled = Boolean(user);

  const todayQuery = useQuery({
    queryKey: qk.trackToday(user?.id ?? 0),
    enabled,
    queryFn: () => api.get<TrackToday>('/track/today'),
  });
  const historyQuery = useQuery({
    queryKey: qk.trackHistory(user?.id ?? 0, from, today),
    enabled,
    queryFn: () => api.get<unknown>(`/track/history?from=${from}&to=${today}&granularity=day`),
  });
  const profileQuery = useQuery({
    queryKey: qk.profile(user?.id ?? 0),
    enabled,
    queryFn: () => api.get<OwnProfile>('/profile'),
  });

  useEffect(() => {
    if (!user || local.pendingLogs.length === 0) return;
    let cancelled = false;
    (async () => {
      const left: SubmitLogBody[] = [];
      const synced = new Set<string>();
      for (const body of local.pendingLogs) {
        try {
          await api.post('/track/logs', body);
          synced.add(body.logDate);
        } catch (error) {
          if (error instanceof ApiError && (error.httpStatus === 409 || error.httpStatus === 422)) {
            synced.add(body.logDate);
          } else {
            left.push(body);
          }
        }
      }
      if (cancelled || left.length === local.pendingLogs.length) return;
      await updateLocal((state) => ({
        ...state,
        pendingLogs: left,
        logs: Object.fromEntries(
          Object.entries(state.logs).map(([date, log]) => [
            date,
            synced.has(date) ? { ...log, synced: true } : log,
          ]),
        ),
      }));
      await client.invalidateQueries();
      try {
        await refreshUser();
      } catch {
        // Wallet refresh can fail without losing the saved log.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, local.pendingLogs.length, local.pendingLogs, updateLocal, client, refreshUser]);

  const serverLogged = Boolean(todayQuery.data?.existingLog);
  const deviceLog = local.logs[today];
  const baselineKg =
    profileQuery.data?.baseline.totalKg ??
    local.baseline?.totalKg ??
    deviceLog?.baselineTotalKg ??
    0;
  const history = historyQuery.data ? asHistory(historyQuery.data) : [];
  const localHistory: HistoryPoint[] = Array.from({ length: 14 }, (_, index) => {
    const date = shiftDate(today, index - 13);
    const log = local.logs[date];
    return {
      date,
      totalKg: log?.breakdown.totalKg ?? 0,
      baselineTotalKg: log?.baselineTotalKg || baselineKg,
      logged: Boolean(log),
    };
  }).filter((point) => point.logged || history.length === 0);

  async function submit(answers: DailyAnswers, org: Record<string, string>) {
    const body: SubmitLogBody = {
      clientLogId: deviceLog?.body.clientLogId ?? uuid(),
      logDate: today,
      answers,
    };
    const base = profileQuery.data?.baseline ?? local.baseline;
    const existing = todayQuery.data?.existingLog;
    const existingId =
      isRecord(existing) && typeof existing.id === 'number'
        ? existing.id
        : isRecord(existing) && typeof existing.logId === 'number'
          ? existing.logId
          : null;
    try {
      const result = existingId
        ? await api.patch<LogResult>(`/track/logs/${existingId}`, { answers })
        : await api.post<LogResult>('/track/logs', body);
      const saved = settledLog(result, answers, base);
      await updateLocal((state) => ({
        ...state,
        orgAnswers: { ...state.orgAnswers, [today]: org },
        checkInRewards: { ...(state.checkInRewards ?? {}), [today]: saved.reward },
        logs: {
          ...state.logs,
          [today]: {
            body,
            breakdown: saved.breakdown,
            baselineTotalKg: saved.baselineTotalKg,
            deltaKg: saved.deltaKg,
            synced: true,
          },
        },
        pendingLogs: state.pendingLogs.filter((item) => item.logDate !== today),
      }));
      if (user && result.wallet) setUser({ ...user, wallet: result.wallet });
      await client.invalidateQueries();
      try {
        await refreshUser();
      } catch {
        // The log itself succeeded.
      }
      return { source: 'api' as const, ...saved };
    } catch (error) {
      if (!isUnavailable(error)) throw error;
      const saved = settledLog(null, answers, base);
      await updateLocal((state) => ({
        ...state,
        orgAnswers: { ...state.orgAnswers, [today]: org },
        checkInRewards: { ...(state.checkInRewards ?? {}), [today]: saved.reward },
        logs: {
          ...state.logs,
          [today]: {
            body,
            breakdown: saved.breakdown,
            baselineTotalKg: saved.baselineTotalKg,
            deltaKg: saved.deltaKg,
            synced: false,
          },
        },
        pendingLogs: [...state.pendingLogs.filter((item) => item.logDate !== today), body],
      }));
      return { source: 'device' as const, ...saved };
    }
  }

  return {
    today,
    askCooling: todayQuery.data?.askCooling !== false,
    logged: serverLogged || Boolean(deviceLog),
    synced: serverLogged || Boolean(deviceLog?.synced),
    breakdown: deviceLog?.breakdown ?? null,
    baselineKg,
    deltaKg: deviceLog?.deltaKg ?? null,
    history: history.length ? history : localHistory,
    streak: deviceStreak(local.logs, today),
    isEmployee,
    orgQuestions: isEmployee ? ORG_QUESTIONS : [],
    savedOrg: local.orgAnswers[today] ?? {},
    savedAnswers: deviceLog?.body.answers ?? null,
    pointsToday: local.checkInRewards[today]?.points ?? 0,
    categories: CATEGORY_META,
    submit,
    loading: todayQuery.isPending && !deviceLog,
  };
}

function sortSamples(items: CatalogProduct[], sort: ProductSort) {
  const copy = [...items];
  if (sort === 'price_asc') copy.sort((a, b) => a.pricePaise - b.pricePaise);
  if (sort === 'price_desc') copy.sort((a, b) => b.pricePaise - a.pricePaise);
  if (sort === 'co2_desc') copy.sort((a, b) => (b.co2SavedKg ?? 0) - (a.co2SavedKg ?? 0));
  return copy;
}

export function useCatalog(category: string, q: string, sort: ProductSort = 'newest') {
  const { user } = useAuth();
  const query = useInfiniteQuery({
    queryKey: qk.products(category, q.trim(), sort),
    enabled: Boolean(user),
    initialPageParam: '',
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '12', sort });
      if (category && category !== 'all') params.set('category', category);
      if (q.trim()) params.set('q', q.trim());
      if (pageParam) params.set('cursor', pageParam);
      return api.get<unknown>(`/marketplace/products?${params.toString()}`);
    },
    getNextPageParam: (last) => {
      const page = pageInfo(last);
      return page.hasMore && page.nextCursor ? page.nextCursor : undefined;
    },
  });
  const remote = (query.data?.pages ?? []).flatMap((page) =>
    asProducts(page).map((item) => decorateProduct(item, false)),
  );
  const needle = q.trim().toLowerCase();
  const samples = sortSamples(
    SAMPLE_PRODUCTS.filter((item) => {
      const cat = category === 'all' || item.category === category;
      const text = `${item.name} ${item.description ?? ''}`.toLowerCase().includes(needle);
      return cat && text;
    }).map((item) => decorateProduct(item, true)),
    sort,
  );
  const live = remote.length > 0;
  return {
    products: live ? remote : query.isPending ? [] : samples,
    source: live ? ('api' as const) : ('device' as const),
    loading: query.isPending && !live,
    error: query.isError && !live && !isUnavailable(query.error) ? errorMessage(query.error) : null,
    hasMore: live && Boolean(query.hasNextPage),
    loadMore: () => query.fetchNextPage(),
    loadingMore: query.isFetchingNextPage,
  };
}

export function useProductDetail(slug: string) {
  const query = useQuery({
    queryKey: qk.product(slug),
    queryFn: () => api.get<Product>(`/marketplace/products/${slug}`),
  });
  const sample = SAMPLE_PRODUCTS.find((item) => item.slug === slug);
  if (query.data)
    return {
      product: decorateProduct(query.data, false),
      source: 'api' as const,
      loading: false,
      error: null,
    };
  if (query.isPending && !sample)
    return { product: null, source: 'api' as const, loading: true, error: null };
  if (
    sample &&
    (query.isError
      ? isUnavailable(query.error) ||
        (query.error instanceof ApiError && query.error.httpStatus === 404)
      : true)
  ) {
    return { product: sample, source: 'device' as const, loading: false, error: null };
  }
  return {
    product: null,
    source: 'api' as const,
    loading: false,
    error: query.isError ? errorMessage(query.error) : 'That product is not listed.',
  };
}

export function useEventList(type: string) {
  const { user, local, isEmployee } = useAuth();
  const params = new URLSearchParams({ filter: 'upcoming', limit: '30' });
  if (type && type !== 'all') params.set('type', type);
  const query = useQuery({
    queryKey: qk.events(user?.id ?? 0, 'upcoming', type),
    enabled: Boolean(user),
    queryFn: () => api.get<unknown>(`/events?${params.toString()}`),
  });
  const remote = query.data ? asEvents(query.data) : [];
  const samples = SAMPLE_EVENTS.filter((item) => {
    if (!isEmployee && item.audience === 'organization') return false;
    if (type !== 'all' && item.type !== type) return false;
    return true;
  }).map((item) => ({
    ...item,
    viewer: {
      ...item.viewer,
      registered: local.eventRegistrations.includes(item.id),
      passStatus: local.eventRegistrations.includes(item.id) ? ('registered' as const) : null,
    },
  }));
  const orgRemote = remote.some((item) => item.visibility === 'invite_only');
  const extraOrg =
    isEmployee && !orgRemote ? samples.filter((item) => item.audience === 'organization') : [];
  const events: CatalogEvent[] =
    remote.length > 0
      ? [
          ...remote.map((item) => ({
            ...item,
            sample: false,
            audience:
              item.visibility === 'invite_only' ? ('organization' as const) : ('public' as const),
            pointsLabel: null,
          })),
          ...extraOrg,
        ]
      : query.isPending
        ? []
        : samples;
  return {
    events,
    source: remote.length > 0 ? ('api' as const) : ('device' as const),
    loading: query.isPending && events.length === 0,
  };
}

export function useEventDetail(slug: string) {
  const { local } = useAuth();
  const query = useQuery({
    queryKey: qk.event(slug),
    queryFn: () => api.get<EventItem>(`/events/${slug}`),
  });
  const sample = SAMPLE_EVENTS.find((item) => item.slug === slug);
  if (query.data) {
    return {
      event: {
        ...query.data,
        sample: false,
        audience:
          query.data.visibility === 'invite_only' ? ('organization' as const) : ('public' as const),
        pointsLabel: null,
      },
      source: 'api' as const,
      loading: false,
      error: null,
    };
  }
  if (sample) {
    const registered = local.eventRegistrations.includes(sample.id);
    return {
      event: {
        ...sample,
        viewer: {
          ...sample.viewer,
          registered,
          passStatus: registered ? ('registered' as const) : null,
        },
      },
      source: 'device' as const,
      loading: query.isPending,
      error: null,
    };
  }
  return {
    event: null,
    source: 'api' as const,
    loading: query.isPending,
    error: query.isError ? errorMessage(query.error) : 'Event not found.',
  };
}

export function useLeaderboard(period: 'all' | 'month' | 'week') {
  const { user, local, isEmployee } = useAuth();
  const board = useQuery({
    queryKey: qk.leaderboard(period),
    enabled: Boolean(user),
    queryFn: () => api.get<unknown>(`/leaderboard?period=${period}&scope=global&limit=30`),
  });
  const mine = useQuery({
    queryKey: qk.leaderboardMe(user?.id ?? 0),
    enabled: Boolean(user),
    queryFn: () => api.get<MyRank>('/leaderboard/me'),
  });
  const rows = board.data ? asRankRows(board.data) : [];
  const points = user ? shownPoints(user.wallet.pointsTotal, local) : 0;
  const sample = user
    ? sampleRanks({
        id: user.id,
        name: user.name,
        points,
        city: user.city,
      })
    : [];
  const listed = (rows.length ? rows : sample).map((row) =>
    row.userId === user?.id ? { ...row, points: Math.max(row.points, points) } : row,
  );
  return {
    rows: listed,
    source: rows.length ? ('api' as const) : ('device' as const),
    me: mine.data ? { ...mine.data, pointsTotal: Math.max(mine.data.pointsTotal, points) } : null,
    myRow: listed.find((row) => row.userId === user?.id) ?? null,
    orgRows: isEmployee && user ? orgRanks({ id: user.id, name: user.name, points }) : [],
    showOrg: isEmployee,
    loading: board.isPending && rows.length === 0,
    organizationName: user?.organization?.name ?? local.organizationName,
  };
}

export function useRewards() {
  const { user, local } = useAuth();
  const query = useQuery({
    queryKey: qk.rewards(user?.id ?? 0),
    enabled: Boolean(user),
    queryFn: () => api.get<unknown>('/profile/rewards?limit=40'),
  });
  const remote = query.data ? asRewards(query.data) : [];
  const localItems: RewardEntry[] = Object.entries(local.checkInRewards ?? {})
    .filter(([, reward]) => reward.source === 'device' || remote.length === 0)
    .map(([date, reward], index) => ({
      id: -(index + 1),
      pointsDelta: reward.points,
      coinsDelta: reward.coins,
      source: 'daily_log',
      note: reward.source === 'device' ? `${date} · counted on this phone` : date,
      createdAt: `${date}T12:00:00.000Z`,
    }));
  return {
    items: [...localItems, ...remote],
    loading: query.isPending,
    unavailable: query.isError && isUnavailable(query.error),
    error: query.isError && !isUnavailable(query.error) ? errorMessage(query.error) : null,
  };
}

export function useOrders() {
  const { user, local } = useAuth();
  const query = useInfiniteQuery({
    queryKey: qk.orders(user?.id ?? 0),
    enabled: Boolean(user),
    initialPageParam: '',
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '15' });
      if (pageParam) params.set('cursor', pageParam);
      return api.get<unknown>(`/marketplace/orders?${params.toString()}`);
    },
    getNextPageParam: (last) => {
      const page = pageInfo(last);
      return page.hasMore && page.nextCursor ? page.nextCursor : undefined;
    },
  });
  return {
    orders: (query.data?.pages ?? []).flatMap((page) => asOrders(page)),
    deviceOrders: local.redemptions,
    loading: query.isPending,
    hasMore: Boolean(query.hasNextPage),
    loadMore: () => query.fetchNextPage(),
    loadingMore: query.isFetchingNextPage,
  };
}

export function useOrder(id: number) {
  const query = useQuery({
    queryKey: qk.order(id),
    enabled: id > 0,
    queryFn: async () => {
      const raw = await api.get<unknown>(`/marketplace/orders/${id}`);
      const order = asOrders({ items: [raw] })[0];
      if (!order) throw new Error('That order is missing.');
      return order;
    },
  });
  return {
    order: query.data ?? null,
    loading: query.isPending,
    error: query.isError ? errorMessage(query.error) : null,
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: qk.notifications(user?.id ?? 0),
    enabled: Boolean(user),
    queryFn: () => api.get<unknown>('/notifications?limit=30'),
  });
  async function markRead(id: number) {
    await api.patch(`/notifications/${id}/read`);
    await client.invalidateQueries({ queryKey: qk.notifications(user?.id ?? 0) });
  }
  return {
    items: query.data ? asNotifications(query.data) : [],
    loading: query.isPending,
    unavailable: query.isError && isUnavailable(query.error),
    markRead,
  };
}

export function useCart() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: qk.cart(user?.id ?? 0),
    enabled: Boolean(user),
    queryFn: () => api.get<CartQuote>('/marketplace/cart'),
  });
  const count = query.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  return {
    cart: query.data ?? null,
    count,
    loading: query.isPending,
    error: query.isError ? errorMessage(query.error) : null,
    unavailable: query.isError && isUnavailable(query.error),
    refetch: () => query.refetch(),
  };
}

export function useAddresses() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: qk.addresses(user?.id ?? 0),
    enabled: Boolean(user),
    queryFn: () => api.get<unknown>('/addresses'),
  });
  return {
    addresses: query.data ? asAddresses(query.data) : [],
    loading: query.isPending,
    refetch: () => query.refetch(),
  };
}

export function useShop() {
  const { user } = useAuth();
  const client = useQueryClient();
  const cartKey = qk.cart(user?.id ?? 0);
  const addressKey = qk.addresses(user?.id ?? 0);

  const add = useCallback(
    async (productId: number, quantity: number) => {
      const cart = await api.post<CartQuote>('/marketplace/cart/items', { productId, quantity });
      client.setQueryData(cartKey, cart);
    },
    [cartKey, client],
  );
  const setQuantity = useCallback(
    async (productId: number, quantity: number) => {
      const cart = await api.patch<CartQuote>(`/marketplace/cart/items/${productId}`, {
        quantity,
      });
      client.setQueryData(cartKey, cart);
    },
    [cartKey, client],
  );
  const remove = useCallback(
    async (productId: number) => {
      const cart = await api.delete<CartQuote>(`/marketplace/cart/items/${productId}`);
      client.setQueryData(cartKey, cart);
    },
    [cartKey, client],
  );
  const preview = useCallback(
    (offeredCoins: number) => api.post<CartQuote>('/marketplace/cart/preview', { offeredCoins }),
    [],
  );
  const saveAddress = useCallback(
    async (body: AddressInput, id?: number) => {
      if (id) await api.patch(`/addresses/${id}`, body);
      else await api.post('/addresses', body);
      await client.invalidateQueries({ queryKey: addressKey });
    },
    [addressKey, client],
  );
  const removeAddress = useCallback(
    async (id: number) => {
      await api.delete(`/addresses/${id}`);
      await client.invalidateQueries({ queryKey: addressKey });
    },
    [addressKey, client],
  );
  const makeDefault = useCallback(
    async (id: number) => {
      await api.patch(`/addresses/${id}`, { isDefault: true });
      await client.invalidateQueries({ queryKey: addressKey });
    },
    [addressKey, client],
  );

  return { add, setQuantity, remove, preview, saveAddress, removeAddress, makeDefault };
}

export function usePass(eventId: number, enabled: boolean) {
  return useQuery({
    queryKey: qk.pass(eventId),
    enabled,
    queryFn: () => api.get<EventPass>(`/events/${eventId}/pass`),
  });
}
