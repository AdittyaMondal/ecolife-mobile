import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from './fetcher';
import { kv } from './kv';

const PUSH_TOKEN_CACHE_KEY = 'ecolife_cached_push_token';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Configure Android notification channels.
 * Required for Android 8.0 (API 26) and above.
 */
export async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'EcoLife Notifications',
      description: 'Daily eco-reminders, goal updates, and event passes',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1B4D3E',
      enableLights: true,
      enableVibrate: true,
    });
  }
}

/**
 * Requests push notification permissions and registers the FCM device token
 * with the EcoLife API.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    await configureAndroidChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Notification permission not granted');
      return null;
    }

    // On native Android/iOS, getDevicePushTokenAsync returns the raw FCM / APNs token
    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    const token = typeof tokenResponse === 'object' && tokenResponse ? tokenResponse.data : null;

    if (!token) {
      console.warn('[Push] Unable to retrieve native device push token');
      return null;
    }

    const cachedToken = await kv.getItem(PUSH_TOKEN_CACHE_KEY);
    if (cachedToken !== token) {
      // Register with EcoLife server
      await api.post('/notifications/push-token', {
        token,
        platform: Platform.OS === 'android' ? 'android' : 'ios',
      });
      await kv.setItem(PUSH_TOKEN_CACHE_KEY, token);
      console.log('[Push] Registered push token with server successfully');
    }

    return token;
  } catch (error) {
    console.warn('[Push] Failed to register push token:', error);
    return null;
  }
}

/**
 * Unregisters the push token when the user signs out.
 */
export async function unregisterPushNotificationAsync(): Promise<void> {
  try {
    const cachedToken = await kv.getItem(PUSH_TOKEN_CACHE_KEY);
    if (cachedToken) {
      await api.delete('/notifications/push-token');
      await kv.removeItem(PUSH_TOKEN_CACHE_KEY);
    }
  } catch (err) {
    console.warn('[Push] Failed to unregister push token:', err);
  }
}

/**
 * Sets up notification response listener for deep linking.
 */
export function setupNotificationResponseListener(
  onNavigate: (linkPath: string) => void,
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data && typeof data.linkPath === 'string' && data.linkPath.trim().length > 0) {
      onNavigate(data.linkPath);
    }
  });

  return () => {
    subscription.remove();
  };
}
