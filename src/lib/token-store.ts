import * as SecureStore from 'expo-secure-store';

/**
 * Access token lives in memory only — it is short-lived (15 min, PRD-v2 §8) and writing it to
 * disk buys nothing. The refresh token is long-lived, so it goes to the Keychain / Keystore.
 *
 * Login, refresh and logout are Sprint 1. This module only stores what they will produce.
 */
const REFRESH_KEY = 'ecolife.refreshToken';

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    // A corrupt or inaccessible keychain entry is indistinguishable from "not logged in".
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_KEY, token);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
