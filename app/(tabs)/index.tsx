import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHealth } from '@/hooks/use-health';
import { ApiError } from '@/lib/fetcher';

/**
 * Sprint 0 Home. It exists to prove the whole chain works end to end: env var → fetcher →
 * envelope → TanStack Query → tokens on screen. The real Home is one `GET /home` call (§6.2).
 */
export default function Home() {
  const insets = useSafeAreaInsets();
  const health = useHealth();

  return (
    <View className="flex-1 bg-background px-5" style={{ paddingTop: insets.top + 16 }}>
      <Text className="text-2xl font-bold text-eco-900">EcoLife</Text>
      <Text className="mt-1 text-sm text-eco-700">Sprint 0 — scaffolding only</Text>

      <View className="mt-6 rounded-2xl border border-border bg-card p-5">
        <Text className="text-xs font-semibold uppercase tracking-wide text-eco-600">
          API connection
        </Text>

        {health.isPending ? (
          <View className="mt-3 flex-row items-center gap-3">
            <ActivityIndicator />
            <Text className="text-base text-eco-800">Checking…</Text>
          </View>
        ) : health.isError ? (
          <>
            <Text className="mt-3 text-base font-semibold text-destructive">Not reachable</Text>
            <Text className="mt-1 text-sm text-eco-700">
              {health.error instanceof ApiError ? health.error.message : 'Something went wrong.'}
            </Text>
            <Text className="mt-2 text-xs text-eco-600">
              {health.error instanceof ApiError ? health.error.code : 'GEN_500'}
            </Text>
          </>
        ) : (
          <>
            <Text className="mt-3 text-base font-semibold text-eco-800">
              {health.data.service} is {health.data.status}
            </Text>
            <Text className="mt-1 text-sm text-eco-700">
              {process.env.EXPO_PUBLIC_API_URL ?? 'EXPO_PUBLIC_API_URL is not set'}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
