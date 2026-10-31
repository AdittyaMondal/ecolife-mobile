import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/fetcher';
import { qk } from '@/lib/query-keys';
import type { components } from '@/types/generated/api';

/**
 * Home is a single endpoint and a single render (PRD-v2 §6.2). Shapes come from the generated
 * contract, never hand-written (§2.3).
 */
export type Home = components['schemas']['Home'];
export type HomeToday = components['schemas']['HomeToday'];
export type HomeWeek = components['schemas']['HomeWeek'];
export type Breakdown = components['schemas']['Breakdown'];
export type ActiveGoalSummary = components['schemas']['ActiveGoalSummary'];
export type LeaderboardPeek = components['schemas']['LeaderboardPeek'];
export type NextEvent = components['schemas']['NextEvent'];
export type Streak = components['schemas']['Streak'];
export type Wallet = components['schemas']['Wallet'];

export const homeQuery = () =>
  queryOptions({
    queryKey: qk.home(),
    queryFn: () => api.get<Home>('/home'),
  });

export function useHome() {
  return useQuery(homeQuery());
}
