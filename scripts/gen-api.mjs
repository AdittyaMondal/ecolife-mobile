#!/usr/bin/env node
/**
 * Generate src/types/generated/api.d.ts from the server's committed openapi.json (PRD-v2 §2.3).
 *
 * The server repo is written in parallel, so a missing openapi.json is an expected state, not a
 * failure — this exits 0 with a skip message so CI and `pnpm lint && pnpm typecheck && pnpm
 * gen:api` stay green.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Overridable so CI can point at a published spec, and so the skip path is testable.
const spec = resolve(root, process.env.ECOLIFE_OPENAPI ?? '../ecolife-server/openapi.json');
const out = resolve(root, 'src/types/generated/api.d.ts');

if (!existsSync(spec)) {
  console.log(`gen:api — skipped: no spec at ${spec}`);
  console.log('gen:api — the server repo has not published openapi.json yet. Nothing to do.');
  process.exit(0);
}

mkdirSync(dirname(out), { recursive: true });

const result = spawnSync('openapi-typescript', [spec, '-o', out], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(`gen:api — failed to run openapi-typescript: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
