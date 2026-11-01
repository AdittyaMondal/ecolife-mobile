import type { ExpoConfig } from 'expo/config';

/**
 * `scheme: 'ecolife'` is load-bearing: event passes deep-link as `ecolife://pass/{code}`
 * (PRD-v2 §6.6.2), and the server's MOBILE_SCHEME env var must match it.
 */

/** Android OAuth client id from `.env.local`. The iOS URL scheme is that id, reversed. */
function googleIosUrlScheme(): string {
  const clientId = process.env.GOOGLE_ANDROID_CLIENT_ID?.trim() ?? '';
  const prefix = clientId.replace(/\.apps\.googleusercontent\.com$/, '');
  if (!prefix || prefix === clientId) {
    throw new Error(
      'Set GOOGLE_ANDROID_CLIENT_ID in .env.local to the Android OAuth client id (….apps.googleusercontent.com).',
    );
  }
  return `com.googleusercontent.apps.${prefix}`;
}

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
      '@react-native-google-signin/google-signin',
      {
        // Android matches the OAuth client by package name and signing certificate.
        // This scheme is only the iOS URL type the plugin requires.
        iosUrlScheme: googleIosUrlScheme(),
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
