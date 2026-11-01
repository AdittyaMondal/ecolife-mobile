import type { ExpoConfig } from 'expo/config';

/**
 * `scheme: 'ecolife'` is load-bearing: event passes deep-link as `ecolife://pass/{code}`
 * (PRD-v2 §6.6.2), and the server's MOBILE_SCHEME env var must match it.
 */
const config: ExpoConfig = {
  name: 'EcoLife',
  slug: 'ecolife',
  scheme: 'ecolife',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  backgroundColor: '#F4F6EE',
  ios: {
    bundleIdentifier: 'app.ecolife.mobile',
    supportsTablet: false,
  },
  android: {
    package: 'app.ecolife.mobile',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#F4F6EE',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    'expo-sqlite',
    [
      'expo-camera',
      {
        // Sprint 3 (event scanner, §10.4). Declared now so the permission copy is reviewed once.
        cameraPermission: 'EcoLife uses the camera to scan event passes at check-in.',
        recordAudioAndroid: false,
      },
    ],
    [
      'expo-calendar',
      {
        calendarPermission: 'EcoLife adds events you join to your calendar.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'EcoLife reads this phone’s location to measure today’s commute.',
        locationAlwaysAndWhenInUsePermission:
          'EcoLife reads this phone’s location to measure today’s commute.',
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
