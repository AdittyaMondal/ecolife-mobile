import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { type ErrorBoundaryProps, type Href, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MenuProvider } from '@/components/menu-sheet';
import { colors } from '@/lib/theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import '@/components/ui/motion';
import '../global.css';

function Gate() {
  const auth = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === 'loading') return;
    const root = segments[0];
    const inAuth = root === '(auth)';
    const inOnboarding = root === 'onboarding';
    if (auth.status === 'signedOut') {
      if (!inAuth) router.replace('/login' as Href);
      return;
    }
    if (!auth.onboardingDone && !inOnboarding) {
      router.replace('/onboarding' as Href);
      return;
    }
    if (auth.onboardingDone && (inAuth || inOnboarding)) {
      router.replace('/' as Href);
    }
  }, [auth.onboardingDone, auth.status, router, segments]);

  return null;
}

function BootCover({ hide }: { hide: boolean }) {
  const opacity = useSharedValue(hide ? 0 : 1);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!hide || gone) return;
    opacity.value = withTiming(0, { duration: 280 }, (finished) => {
      if (finished) runOnJS(setGone)(true);
    });
  }, [gone, hide, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  if (gone) return null;
  return (
    <Animated.View
      pointerEvents={hide ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }, style]}
    />
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 24,
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.ink }}>
        Something went wrong
      </Text>
      <Text style={{ marginTop: 8, fontSize: 15, color: colors.ink }}>{error.message}</Text>
      <Pressable
        onPress={retry}
        style={{
          marginTop: 20,
          alignSelf: 'flex-start',
          backgroundColor: colors.primary,
          borderRadius: 999,
          paddingHorizontal: 18,
          paddingVertical: 12,
        }}
      >
        <Text style={{ fontWeight: '700', color: colors.ink }}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    InstrumentSerif_400Regular,
  });
  const ready = loaded || Boolean(fontError);

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider>
          <MenuProvider>
            <StatusBar style="dark" />
            <View className="flex-1 items-center bg-muted">
              <View className="h-full w-full max-w-[440px] flex-1 bg-background">
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    animation: 'slide_from_right',
                    animationDuration: 320,
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="onboarding/index" />
                  <Stack.Screen name="onboarding/[step]" />
                </Stack>
                {ready ? <Gate /> : null}
                <BootCover hide={ready} />
              </View>
            </View>
          </MenuProvider>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
