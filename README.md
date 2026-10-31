# ecolife-mobile

EcoLife's iOS and Android app. Expo SDK 58 · Expo Router · NativeWind · TanStack Query.

Rendering only. All data, rules and auth live in `ecolife-server`; this repo never talks to
Postgres. The wire contract is generated, not agreed — see PRD-v2 §2.3.

## Setup

```bash
pnpm install
cp .env.example .env.local        # then set EXPO_PUBLIC_API_URL
pnpm gen:api                      # no-op until ../ecolife-server/openapi.json exists
pnpm start
```

Press `i` for the iOS simulator, `a` for Android, or scan the QR with Expo Go.

### A physical device cannot reach `localhost`

`localhost` on a phone is the phone. Point `EXPO_PUBLIC_API_URL` at your machine's LAN IP:

```bash
ipconfig getifaddr en0            # macOS, Wi-Fi
# → EXPO_PUBLIC_API_URL=http://192.168.1.12:4010/api/v1
```

Both devices must be on the same network, and the API must bind `0.0.0.0`, not `127.0.0.1`.
Simulators and emulators are fine with `localhost`.

## Where things are

| Path                 | Holds                                                               |
| -------------------- | ------------------------------------------------------------------- |
| `app/`               | Expo Router file-based routes (PRD-v2 §10.2)                        |
| `src/lib/`           | fetcher, response envelope, token store, query keys, theme          |
| `src/providers/`     | TanStack Query client + offline persister                           |
| `src/types/api.ts`   | hand-written types; `src/types/generated/` is produced by `gen:api` |
| `design-tokens.json` | the one copy of every colour — see `DESIGN.md`                      |

## Commands

| Command          | Does                                                             |
| ---------------- | ---------------------------------------------------------------- |
| `pnpm start`     | Metro dev server                                                 |
| `pnpm lint`      | Biome check, no writes                                           |
| `pnpm format`    | Biome check with `--write`                                       |
| `pnpm typecheck` | `tsc --noEmit`                                                   |
| `pnpm gen:api`   | regenerate `src/types/generated/api.d.ts` from the server's spec |
| `pnpm doctor`    | `expo-doctor` dependency and config diagnosis                    |

Before claiming work is done, run all four:

```bash
pnpm lint && pnpm typecheck && pnpm gen:api && npx expo-doctor
```

## Rules

- **Branch on `error.code`, never `error.message`** (PRD-v2 §2.3). Codes are in the server's
  `docs/error-codes.md`; the `ApiError` thrown by `src/lib/fetcher.ts` carries `code`,
  `details` and `httpStatus`.
- **Never redefine a design token here.** Change it in `ecolife-web` first. See `DESIGN.md`.
- **Never commit a real `.env`.** `.env.example` is names and localhost defaults only.
- **`npx expo install <pkg>`**, not `pnpm add`, for anything Expo ships, so versions match the
  SDK.
- Biome is the only linter and formatter. Do not add ESLint or Prettier.
- One hook module per resource in `src/hooks/use-*.ts`; every query key lives in
  `src/lib/query-keys.ts` so invalidation is never a guess (PRD-v2 §9.2).

## Pins that look wrong and are not

| Pin                                                               | Why                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tailwindcss@3.4.17`, not `4.x`                                   | NativeWind 4.2.7 throws `NativeWind only supports Tailwind CSS v3` in its Metro transformer. Upgrade only when NativeWind ships v4 support.                                                                                                                        |
| `nodeLinker: hoisted` in `pnpm-workspace.yaml`                    | Metro and Expo autolinking assume a flat `node_modules`. Without it, `react-native-css-interop/jsx-runtime` (NativeWind's `jsxImportSource`) fails to resolve at bundle time. pnpm 12 reads this from `pnpm-workspace.yaml`, **not** `.npmrc`.                     |
| `expo.install.exclude: ["typescript", "react"]` in `package.json` | `typescript@5.9.3` and `react@19.3.1` are deliberate; SDK 58's table wants `~6.0.3` and `19.3.0`. Both satisfy every real peer range (`react-native@0.88.1` asks for `react@^19.3.0`). The exclude stops `expo-doctor` reporting the intentional pin as a failure. |

## Current state — Sprint 0

Scaffolding only. There are no product features. Every screen but Home is a route stub.
Onboarding, Track, the marketplace, events and the pass scanner are later sprints; the scanner
is Sprint 3 (PRD-v2 §10.4). Home exists to prove the chain from `EXPO_PUBLIC_API_URL` through
the fetcher and the envelope to a rendered card.
