import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/fetcher';
import { qk } from '@/lib/query-keys';
import type { Liveness } from '@/types/api';

/**
 * One hook module per resource (PRD-v2 §9.2). `health` is the only one Sprint 0 needs — it is
 * what proves the env var → fetcher → envelope → cache chain is wired.
 */
export const healthQuery = () =>
  queryOptions({
    queryKey: qk.health(),
    queryFn: () => api.get<Liveness>('/health'),
  });

export function useHealth() {
  return useQuery(healthQuery());
}
