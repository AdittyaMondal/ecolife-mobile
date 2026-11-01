import type { HistoryPoint, RankRow } from '@/types/domain';

export function pageInfo(data: unknown): { nextCursor: string | null; hasMore: boolean } {
  if (!data || typeof data !== 'object') return { nextCursor: null, hasMore: false };
  const info = (data as { pageInfo?: { nextCursor?: string | null; hasMore?: boolean } }).pageInfo;
  const nextCursor = typeof info?.nextCursor === 'string' ? info.nextCursor : null;
  return { nextCursor, hasMore: Boolean(info?.hasMore && nextCursor) };
}

export function unwrapList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  for (const key of [
    'items',
    'points',
    'series',
    'days',
    'rows',
    'results',
    'top',
    'products',
    'events',
  ]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export function asRankRows(data: unknown): RankRow[] {
  return unwrapList(data)
    .map((row, index) => normalizeRank(row, index))
    .filter((row): row is RankRow => row !== null);
}

export function normalizeRank(row: unknown, index: number): RankRow | null {
  if (!row || typeof row !== 'object') return null;
  const record = row as Record<string, unknown>;
  const user =
    record.user && typeof record.user === 'object'
      ? (record.user as Record<string, unknown>)
      : record;
  const name = str(user.name) ?? str(record.name);
  if (!name) return null;
  return {
    rank: num(record.rank) ?? index + 1,
    name,
    points: num(record.points) ?? num(record.pointsTotal) ?? num(user.pointsTotal) ?? 0,
    userId: num(user.id) ?? num(record.userId),
    avatarUrl: str(user.avatarUrl) ?? str(record.avatarUrl),
    subtitle: str(user.city) ?? str(record.city) ?? str(record.subtitle),
  };
}

export function asHistory(data: unknown): HistoryPoint[] {
  return unwrapList(data)
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const record = row as Record<string, unknown>;
      const date = str(record.date);
      const total = num(record.totalKg);
      if (!date || total === null) return null;
      return {
        date,
        totalKg: total,
        baselineTotalKg: num(record.baselineTotalKg) ?? total,
        logged: record.logged !== false,
      };
    })
    .filter((row): row is HistoryPoint => row !== null);
}

export function orderItemName(item: object): string {
  const record = item as Record<string, unknown>;
  return str(record.name) ?? str(record.productName) ?? 'Item';
}
