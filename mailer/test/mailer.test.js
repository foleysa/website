import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { confirmToken, unsubToken, verifyToken, isValidEmail, normalizeEmail } from '../src/tokens.js';
import { createMemoryStore, createFileStore } from '../src/store.js';
import { looksLikeImportedList, evaluateSendHold, assertNotImportedList, HoldError } from '../src/hold.js';
import { createProvider } from '../src/providers/index.js';
import { createMockProvider } from '../src/providers/mock.js';
import { handleSubscribe, handleConfirm, handleUnsubscribe, handleHealth, createMailerContext } from '../src/http.js';
import { parseArgs, runSendIssue } from '../src/send-issue.js';
import { bodyLooksLikePlaceholder } from '../src/templates/issue-wrapper.js';
import { loadConfig } from '../src/config.js';

test('email normalize + validate', () => {
  assert.equal(normalizeEmail('  John@FoleySA.com '), 'john@foleysa.com');
  assert.equal(isValidEmail('john@foleysa.com'), true);
  assert.equal(isValidEmail('not-an-email'), false);
});

test('DOI and unsub tokens round-trip', () => {
  const secret = 'test-secret';
  const confirm = confirmToken('jane@example.com', secret, 60_000);
  const unsub = unsubToken('jane@example.com', secret, 60_000);
  const ok = verifyToken(confirm, secret, 'confirm');
  assert.equal(ok.ok, true);
  assert.equal(ok.email, 'jane@example.com');
  assert.equal(verifyToken(unsub, secret, 'unsubscribe').ok, true);
  assert.equal(verifyToken(confirm, secret, 'unsubscribe').ok, false);
  assert.equal(verifyToken(confirm, 'other', 'confirm').ok, false);
  const expired = confirmToken('jane@example.com', secret, -10);
  assert.equal(verifyToken(expired, secret, 'confirm').reason, 'expired');
});

test('file store pending → confirm → unsub owns the list', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'fsa-mailer-'));
  const file = path.join(dir, 'subscribers.json');
  const store = createFileStore(file);
  await store.upsertPending('a@example.com');
  assert.equal((await store.get('a@example.com')).status, 'pending');
  await store.confirm('a@example.com');
  assert.equal((await store.confirmedRecipients()).length, 1);
  await store.unsubscribe('a@example.com');
  assert.equal((await store.get('a@example.com')).status, 'unsubscribed');
  assert.equal((await store.confirmedRecipients()).length, 0);
  await rm(dir, { recursive: true, force: true });
});

test('imported list names are blocked', () => {
  assert.equal(looksLikeImportedList('John_OK.csv'), true);
  assert.equal(looksLikeImportedList('/tmp/kit-export.csv'), true);
  assert.equal(looksLikeImportedList('beehiiv-audience.csv'), true);
  assert.equal(looksLikeImportedList('mailer/data/subscribers.json'), false);
  assert.throws(() => assertNotImportedList('contacts-john_ok.csv'), HoldError);
});

test('Soft HOLD refuses live blast even with flags', () => {
  const config = loadConfig({
    MAILER_PROVIDER: 'resend',
    RESEND_API_KEY: 're_test',
    MAIL_FROM: 'brief@foleystrategicadvisory.com',
    ALLOW_LIVE_SEND: 'true',
    MAILER_SECRET: 'x',
  });
  const decision = evaluateSendHold({
    config,
    args: { live: true, acknowledgeHold: true },
    recipientCount: 12,
    recipientSource: 'fsa-first-party',
  });
  assert.equal(decision.allowed, false);
  assert.equal(decision.dryRun, true);
  assert.equal(decision.phase1Lock, true);
});

test('provider factory defaults to mock', () => {
  assert.equal(createProvider({ provider: 'mock' }).name, 'mock');
  assert.equal(createProvider(loadConfig({ MAILER_PROVIDER: 'resend', RESEND_API_KEY: 're_x' })).name, 'resend');
  assert.equal(createProvider(loadConfig({ MAILER_PROVIDER: 'postmark', POSTMARK_SERVER_TOKEN: 'pm_x' })).name, 'postmark');
  assert.equal(loadConfig({}).revealConfirm, true);
  assert.equal(loadConfig({ MAILER_PROVIDER: 'resend', MAILER_DEV_REVEAL_CONFIRM: 'false' }).revealConfirm, false);
});

test('subscribe + confirm + unsub HTTP path (mock, no live send)', async () => {
  const provider = createMockProvider();
  const store = createMemoryStore();
  const ctx = createMailerContext({
    store,
    provider,
    config: loadConfig({
      MAILER_PROVIDER: 'mock',
      MAILER_SECRET: 'unit-secret',
      MAILER_DEV_REVEAL_CONFIRM: 'true',
      MAILER_PUBLIC_BASE: 'http://127.0.0.1:8787',
    }),
  });

  const honeypot = await handleSubscribe(ctx, { method: 'POST', body: { email: 'bot@x.com', company: 'Acme' }, ip: '1.1.1.1' });
  assert.equal(honeypot.status, 200);
  assert.equal(await store.get('bot@x.com'), null);

  const bad = await handleSubscribe(ctx, { method: 'POST', body: { email: 'nope' }, ip: '1.1.1.2' });
  assert.equal(bad.status, 400);

  const pending = await handleSubscribe(ctx, { method: 'POST', body: { email: 'Pat@Example.com' }, ip: '1.1.1.3' });
  assert.equal(pending.status, 200);
  assert.equal(pending.body.status, 'pending');
  assert.match(pending.body.confirmUrl, /\/api\/confirm\?token=/);
  assert.equal((await store.get('pat@example.com')).status, 'pending');
  assert.equal(provider.sent.length, 1);
  assert.equal(provider.sent[0].kind, 'doi');

  const confirmed = await handleConfirm(ctx, { method: 'GET', url: pending.body.confirmUrl });
  assert.equal(confirmed.status, 302);
  assert.match(confirmed.headers.location, /status=ok/);
  assert.equal((await store.get('pat@example.com')).status, 'confirmed');

  const token = unsubToken('pat@example.com', ctx.config.secret);
  const left = await handleUnsubscribe(ctx, { method: 'GET', url: `/api/unsubscribe?token=${token}` });
  assert.equal(left.status, 302);
  assert.equal((await store.get('pat@example.com')).status, 'unsubscribed');

  const health = handleHealth(ctx);
  assert.equal(health.body.softHold, true);
  assert.equal(health.body.liveSendArmed, false);
});

test('send-issue dry-runs staged Issue #1 and never calls a live provider', async () => {
  const args = parseArgs(['--issue', '0001', '--allow-placeholder']);
  assert.equal(args.issue, '0001');
  const store = createMemoryStore([
    { email: 'reader@example.com', status: 'confirmed', source: 'fsa-first-party' },
  ]);
  const provider = createMockProvider();
  const report = await runSendIssue({
    argv: ['--issue', '0001', '--allow-placeholder'],
    env: {
      MAILER_PROVIDER: 'mock',
      MAILER_SECRET: 'unit-secret',
      MAILER_PUBLIC_BASE: 'http://127.0.0.1:8787',
    },
    store,
    provider,
  });
  assert.equal(report.dryRun, true);
  assert.equal(report.allowed, false);
  assert.equal(report.recipientCount, 1);
  assert.equal(report.recipientSource, 'fsa-first-party');
  assert.equal(provider.sent.length, 0);
});

test('send-issue refuses John_OK list and ad-hoc --to', async () => {
  await assert.rejects(
    () => runSendIssue({ argv: ['--issue', '0001', '--allow-placeholder', '--list', 'John_OK.csv'] }),
    /John_OK|imported|Refusing/i,
  );
  await assert.rejects(
    () => runSendIssue({ argv: ['--issue', '0001', '--allow-placeholder', '--to', 'john@foleysa.com'] }),
    /--to is disabled/i,
  );
});

test('send-issue refuses live flags under Phase 1 hold', async () => {
  const store = createMemoryStore([
    { email: 'reader@example.com', status: 'confirmed', source: 'fsa-first-party' },
  ]);
  const calls = [];
  const provider = {
    name: 'resend',
    live: true,
    async send(message) { calls.push(message); return { id: 'should-not-send' }; },
  };
  const report = await runSendIssue({
    argv: ['--issue', '0001', '--allow-placeholder', '--live', '--i-understand-soft-hold'],
    env: {
      MAILER_PROVIDER: 'resend',
      RESEND_API_KEY: 're_test',
      MAIL_FROM: 'brief@foleystrategicadvisory.com',
      ALLOW_LIVE_SEND: 'true',
      MAILER_SECRET: 'unit-secret',
    },
    store,
    provider,
  });
  assert.equal(report.allowed, false);
  assert.equal(calls.length, 0);
});

test('placeholder detector marks Issue #1 drop zone', async () => {
  const { readFile } = await import('node:fs/promises');
  const body = await readFile(new URL('../../newsletter/issues/0001/body.html', import.meta.url), 'utf8');
  assert.equal(bodyLooksLikePlaceholder(body), true);
});
