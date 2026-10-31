import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/fetcher';
import { qk } from '@/lib/query-keys';
import type { components } from '@/types/generated/api';

/** Shapes come from the generated contract, never hand-written (PRD-v2 §2.3). */
export type TrackToday = components['schemas']['TrackToday'];
export type DailyAnswers = components['schemas']['DailyAnswers'];
export type Trip = components['schemas']['Trip'];
export type LogResult = components['schemas']['LogResult'];
export type SubmitLogBody = components['schemas']['SubmitLogBody'];
export type TripMode = Trip['mode'];
export type AcHoursBucket = NonNullable<DailyAnswers['acHoursBucket']>;
export type BathChoice = NonNullable<DailyAnswers['bathChoice']>;
export type WasteAction = NonNullable<DailyAnswers['wasteActions']>[number];

export const trackTodayQuery = () =>
  queryOptions({
    queryKey: qk.trackToday(),
    // Yesterday's defaults are not today's. Never serve this from a stale cache.
    staleTime: 0,
    queryFn: () => api.get<TrackToday>('/track/today'),
  });

export function useTrackToday() {
  return useQuery(trackTodayQuery());
}

/**
 * UUIDv7 — 48-bit big-endian millisecond timestamp, then version/variant bits, then random
 * (PRD-v2 §6.3). The server's unique index on `(user_id, client_log_id)` is what makes a retry
 * safe, so this value only has to be unique, not unpredictable.
 *
 * ponytail: Math.random, not a CSPRNG — React Native has no `crypto` global and `expo-crypto`
 * is not a dependency. Swap in `expo-crypto`'s `getRandomBytes` if this value ever becomes
 * security-relevant.
 */
export function uuidv7(): string {
  const ms = Date.now();
  const hex =
    ms.toString(16).padStart(12, '0') +
    Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const chars = hex.split('');
  chars[12] = '7'; // version
  chars[16] = ((Number.parseInt(chars[16], 16) & 0x3) | 0x8).toString(16); // variant
  const s = chars.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

export type SubmitLogVars = {
  logDate: string;
  answers: DailyAnswers;
  /** Set when `trackToday.existingLog` is present — edits go to PATCH, not POST. */
  existingLogId?: number;
};

/**
 * POST /track/logs, or PATCH /track/logs/:id when today is already logged. Either way the
 * response carries the whole result sheet — the new number, the delta, the reward and the
 * streak — so nothing refetches to render it (PRD-v2 §6.3).
 *
 * The offline queue is MOB-10/MOB-11 and deliberately not here.
 */
export function useSubmitLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ logDate, answers, existingLogId }: SubmitLogVars) =>
      existingLogId === undefined
        ? api.post<LogResult>('/track/logs', {
            clientLogId: uuidv7(),
            logDate,
            answers,
          } satisfies SubmitLogBody)
        : api.patch<LogResult>(`/track/logs/${existingLogId}`, { answers }),
    onSuccess: () => {
      // Home's number and today's log are both stale now. The result sheet does not wait on
      // these — it renders from the mutation response.
      queryClient.invalidateQueries({ queryKey: qk.home() });
      queryClient.invalidateQueries({ queryKey: qk.trackToday() });
    },
  });
}
