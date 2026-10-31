import * as SecureStore from 'expo-secure-store';

/**
 * Access token lives in memory only — it is short-lived (15 min, PRD-v2 §8) and writing it to
 * disk buys nothing. The refresh token is long-lived, so it goes to the Keychain / Keystore.
 *
 * Login, refresh and logout are Sprint 1. This module only stores what they will produce.
 */
const REFRESH_KEY = 'ecolife.refreshToken';

let accessToken: string | null = null;

/**
 * The Prism mock (`pnpm mock` in ecolife-server) enforces the contract's bearer auth and 401s
 * without a token, while accepting any value. Login is Sprint 1, so until it lands this stands
 * in — and it is fenced so it can only ever be sent to a loopback dev server on a 40xx port.
 * A hardcoded token reaching a real backend is a far worse bug than an unviewable dev screen,
 * so the fence is a whitelist of exact hosts, not a check for the absence of a real one.
 */
const LOOPBACK_MOCK_URL = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::40\d{2})(?:[/?#]|$)/;

function mockBearer(): string | null {
  if (!__DEV__) return null;
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl || !LOOPBACK_MOCK_URL.test(baseUrl)) return null;
  return 'prism-mock-token';
}

export function getAccessToken(): string | null {
  return accessToken ?? mockBearer();
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
