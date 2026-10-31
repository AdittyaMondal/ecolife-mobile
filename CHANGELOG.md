# Changelog

All notable changes to `ecolife-mobile`. Newest first.

## [Unreleased]

### Added — Sprint 0 scaffolding

- Expo SDK 58 app with Expo Router, typed routes and `scheme: ecolife` for pass deep links.
- Route tree per PRD-v2 §10.2: `(auth)`, `onboarding/[step]`, `(tabs)` with a four-tab bottom
  bar (Home · Track · Marketplace · Events), `profile`. Every screen but Home is a stub.
- NativeWind with the `eco` palette mirrored from `ecolife-web` (`design-tokens.json`,
  `DESIGN.md`).
- API client: `fetcher.ts` with `ApiError`, `response-envelope.ts` that tolerates non-envelope
  responses, `token-store.ts` (access token in memory, refresh token in SecureStore),
  `query-keys.ts`.
- TanStack Query provider with the web app's defaults and an offline cache persisted to
  `expo-sqlite/kv-store`.
- `pnpm gen:api`, which skips cleanly until `../ecolife-server/openapi.json` exists.
- Biome, `tsconfig` with `@/*` → `./src/*`, `eas.json` with development/preview/production
  profiles (internal distribution).

### Notes

- `tailwindcss` is pinned to `3.4.17`, not `4.x`: NativeWind 4.2.7 throws
  `NativeWind only supports Tailwind CSS v3` at bundle time.
- `pnpm-workspace.yaml` sets `nodeLinker: hoisted`. Metro cannot resolve
  `react-native-css-interop/jsx-runtime` through pnpm's isolated store.
- `expo.install.exclude` holds `typescript` and `react` so `expo-doctor` does not flag the
  deliberate pins. See README, "Pins that look wrong and are not".
