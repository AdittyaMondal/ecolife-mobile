import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

/** Access token for the signed-in Google account. The EcoLife API checks it with Google. */
export async function googleAccessToken(): Promise<string> {
  if (Platform.OS === 'web' || isRunningInExpoGo()) {
    throw new Error('Google sign-in needs the installed EcoLife app. Expo Go cannot use it.');
  }
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = await import(
    '@react-native-google-signin/google-signin'
  );
  GoogleSignin.configure({
    scopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    if (GoogleSignin.hasPreviousSignIn()) {
      const silent = await GoogleSignin.signInSilently();
      if (silent.type !== 'success') {
        const response = await GoogleSignin.signIn();
        if (!isSuccessResponse(response)) throw new Error('Google sign-in was cancelled.');
      }
    } else {
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) throw new Error('Google sign-in was cancelled.');
    }
    const { accessToken } = await GoogleSignin.getTokens();
    if (!accessToken) throw new Error('Google did not return a sign-in token.');
    return accessToken;
  } catch (error) {
    if (error instanceof Error && !isErrorWithCode(error)) throw error;
    if (!isErrorWithCode(error)) throw new Error('Google sign-in failed.');
    if (error.code === statusCodes.SIGN_IN_CANCELLED)
      throw new Error('Google sign-in was cancelled.');
    if (error.code === statusCodes.IN_PROGRESS) throw new Error('Google sign-in is already open.');
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play services are missing or out of date on this phone.');
    }
    if (error.code === '10') {
      throw new Error(
        'Google rejected sign-in. This build’s certificate does not match the Google client.',
      );
    }
    throw new Error(error.message || 'Google sign-in failed.');
  }
}
