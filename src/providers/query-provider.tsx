import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import Storage from 'expo-sqlite/kv-store';
import type { ReactNode } from 'react';
import { ApiError } from '@/lib/fetcher';

/** PRD-v2 §9.2. Same defaults as the web app so the two caches behave identically. */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 86_400_000,
      retry: (failureCount, error) => {
        // Retrying a 4xx just burns battery — the answer will not change.
        if (error instanceof ApiError && error.httpStatus >= 400 && error.httpStatus < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

/**
 * `expo-sqlite/kv-store` is a drop-in AsyncStorage, so the cache survives a cold start without
 * pulling in `@react-native-async-storage/async-storage`. This is the offline cache the pass
 * display and the daily log rely on (PRD-v2 §10.3).
 */
const persister = createAsyncStoragePersister({
  storage: Storage,
  key: 'ecolife.query-cache',
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 86_400_000 }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
