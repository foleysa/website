import { loadConfig, fromHeader } from './config.js';
import { createStore } from './store.js';
import { createProvider } from './providers/index.js';
import { confirmToken, unsubToken, verifyToken, isValidEmail, normalizeEmail } from './tokens.js';
import { doiEmail } from './templates/doi.js';

const hits = new Map();

export function createMailerContext(options = {}) {
  const config = options.config || loadConfig(options.env || process.env);
  const store = options.store || createStore(config);
  const provider = options.provider || createProvider(config);
  return { config, store, provider };
}

export async function handleSubscribe(ctx, req) {
  if (req.method === 'OPTIONS') return json(204, null);
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });

  const body = req.body || {};
  if (body.company) return json(200, { ok: true, status: 'pending' });
  if (!isValidEmail(body.email)) return json(400, { ok: false, error: 'invalid_email' });
  if (rateLimited(req.ip)) return json(429, { ok: false, error: 'rate_limited' });

  const email = normalizeEmail(body.email);
  await ctx.store.upsertPending(email);
  const token = confirmToken(email, ctx.config.secret);
  const confirmUrl = `${ctx.config.publicBase}/api/confirm?token=${encodeURIComponent(token)}`;
  const template = doiEmail({
    confirmUrl,
    brand: ctx.config.brand,
    product: ctx.config.product,
  });

  // DOI is user-initiated and allowed once keys + MAIL_FROM exist.
  // Soft HOLD blocks Issue #1 / list blasts, not the confirm link for a person who just signed up.
  const canSendDoi = ctx.provider.live && Boolean(ctx.config.mailFrom);
  const message = {
    from: fromHeader(ctx.config),
    to: email,
    subject: template.subject,
    html: template.html,
    replyTo: ctx.config.replyTo,
    kind: 'doi',
    skipped: !canSendDoi,
  };
  const delivery = canSendDoi || !ctx.provider.live
    ? await ctx.provider.send(message)
    : { provider: ctx.provider.name, skipped: true };

  const payload = {
    ok: true,
    status: 'pending',
    message: 'Check your inbox to confirm. We will not add you until you confirm.',
  };
  if (ctx.config.revealConfirm) payload.confirmUrl = confirmUrl;
  payload.provider = delivery.provider || ctx.provider.name;
  return json(200, payload);
}

export async function handleConfirm(ctx, req) {
  const token = queryToken(req);
  const verified = verifyToken(token, ctx.config.secret, 'confirm');
  if (!verified.ok) return redirect(`${ctx.config.publicBase}/newsletter/confirm.html?status=invalid`);
  await ctx.store.upsertPending(verified.email);
  await ctx.store.confirm(verified.email);
  return redirect(`${ctx.config.publicBase}/newsletter/confirm.html?status=ok`);
}

export async function handleUnsubscribe(ctx, req) {
  const token = queryToken(req) || req.body?.token;
  const verified = verifyToken(token, ctx.config.secret, 'unsubscribe');
  if (!verified.ok) return redirect(`${ctx.config.publicBase}/newsletter/unsubscribed.html?status=invalid`);
  await ctx.store.unsubscribe(verified.email);
  return redirect(`${ctx.config.publicBase}/newsletter/unsubscribed.html?status=ok`);
}

export function handleHealth(ctx) {
  return json(200, {
    ok: true,
    brand: ctx.config.brand,
    product: ctx.config.product,
    provider: ctx.config.provider,
    store: ctx.config.storeDriver,
    softHold: ctx.config.softHold,
    liveSendArmed: false,
  });
}

export async function dispatch(ctx, req) {
  const url = new URL(req.url, ctx.config.publicBase);
  const route = url.pathname.replace(/\/$/, '') || '/';
  req.query = Object.fromEntries(url.searchParams.entries());
  if (route === '/api/subscribe') return handleSubscribe(ctx, req);
  if (route === '/api/confirm') return handleConfirm(ctx, req);
  if (route === '/api/unsubscribe') return handleUnsubscribe(ctx, req);
  if (route === '/api/health') return handleHealth(ctx);
  return json(404, { ok: false, error: 'not_found' });
}

export function vercelHandler(routeHandler) {
  return async function handler(req, res) {
    const ctx = createMailerContext();
    const chunks = [];
    if (req.body && typeof req.body === 'object') {
      // already parsed
    } else if (typeof req.body === 'string') {
      try { req.body = JSON.parse(req.body); } catch { req.body = {}; }
    } else if (req.method === 'POST' && !req.body) {
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf8');
      try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
    }
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const incoming = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body || {},
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
    };
    if (!process.env.MAILER_PUBLIC_BASE) {
      ctx.config.publicBase = `${proto}://${host}`;
    }
    const result = await routeHandler(ctx, incoming);
    res.statusCode = result.status;
    for (const [key, value] of Object.entries(result.headers || {})) res.setHeader(key, value);
    if (result.body == null) res.end();
    else res.end(typeof result.body === 'string' ? result.body : JSON.stringify(result.body));
  };
}

function queryToken(req) {
  return req.query?.token || new URL(req.url, 'http://local.test').searchParams.get('token');
}

function json(status, body) {
  return {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
    body,
  };
}

function redirect(location) {
  return { status: 302, headers: { location }, body: null };
}

function rateLimited(ip, windowMs = 60_000, max = 8) {
  const key = String(ip || 'unknown');
  const now = Date.now();
  const row = hits.get(key) || [];
  const fresh = row.filter((ts) => now - ts < windowMs);
  fresh.push(now);
  hits.set(key, fresh);
  return fresh.length > max;
}
