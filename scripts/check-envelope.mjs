/**
 * The one check Sprint 0 leaves behind. `toEnvelope` is the guard that stops a raw body — an
 * HTML gateway page, a truncated response, nothing at all — from reaching a user, so it gets a
 * test. Run with `pnpm test`. Node strips the types off the imported `.ts`; no test runner.
 */
import assert from 'node:assert/strict';
import { toEnvelope } from '../src/lib/response-envelope.ts';

// A real success envelope passes through untouched.
const ok = toEnvelope({ status: true, data: { service: 'ecolife-server' }, error: null }, 200);
assert.equal(ok.status, true);
assert.deepEqual(ok.data, { service: 'ecolife-server' });

// A real failure envelope keeps the server's code and message.
const fail = toEnvelope(
  { status: false, data: null, error: { code: 'AUTH_001', message: 'Invalid.', details: {} } },
  401,
);
assert.equal(fail.status, false);
assert.equal(fail.error.code, 'AUTH_001');
assert.equal(fail.error.message, 'Invalid.');

// An HTML error page never reaches the user.
const html = toEnvelope('<html><body>504 Gateway Time-out</body></html>', 504);
assert.equal(html.status, false);
assert.equal(html.error.code, 'GEN_504');
assert.match(html.error.message, /took too long/);
assert.doesNotMatch(html.error.message, /html|Gateway/i);

// An empty body is a failure, not an undefined success.
const empty = toEnvelope(undefined, 502);
assert.equal(empty.status, false);
assert.equal(empty.error.code, 'GEN_502');

// A 200 that is not an envelope means the contract broke — still a failure, never silent.
const bare = toEnvelope({ service: 'something-else' }, 200);
assert.equal(bare.status, false);
assert.equal(bare.error.code, 'GEN_500');

// A failure whose error lost its code falls back to our prose, never the server's raw text.
const codeless = toEnvelope(
  { status: false, data: null, error: { message: 'raw: at Pool.query' } },
  500,
);
assert.equal(codeless.error.code, 'GEN_500');
assert.doesNotMatch(codeless.error.message, /Pool\.query/);

console.log('response-envelope: 7 checks passed');
