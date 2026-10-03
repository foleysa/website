import { createHmac, timingSafeEqual } from 'node:crypto';

const PURPOSES = new Set(['confirm', 'unsubscribe']);

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function isValidEmail(value) {
  const email = normalizeEmail(value);
  // Practical RFC-ish check. Rejects spaces and missing domain.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function signToken({ email, purpose, secret, expiresAt }) {
  const e = normalizeEmail(email);
  if (!PURPOSES.has(purpose)) throw new Error(`unknown token purpose: ${purpose}`);
  const payload = `${purpose}|${e}|${expiresAt}`;
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return Buffer.from(`${payload}|${sig}`).toString('base64url');
}

export function verifyToken(token, secret, purpose, now = Date.now()) {
  let decoded;
  try {
    decoded = Buffer.from(String(token || ''), 'base64url').toString('utf8');
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  const parts = decoded.split('|');
  if (parts.length !== 4) return { ok: false, reason: 'malformed' };
  const [gotPurpose, email, expiresAt, sig] = parts;
  if (gotPurpose !== purpose || !PURPOSES.has(gotPurpose)) return { ok: false, reason: 'purpose' };
  if (!isValidEmail(email)) return { ok: false, reason: 'email' };
  const expected = createHmac('sha256', secret).update(`${gotPurpose}|${email}|${expiresAt}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: 'signature' };
  const exp = Number(expiresAt);
  if (!Number.isFinite(exp) || exp < now) return { ok: false, reason: 'expired' };
  return { ok: true, email, purpose: gotPurpose, expiresAt: exp };
}

export function confirmToken(email, secret, ttlMs = 1000 * 60 * 60 * 48) {
  return signToken({ email, purpose: 'confirm', secret, expiresAt: Date.now() + ttlMs });
}

export function unsubToken(email, secret, ttlMs = 1000 * 60 * 60 * 24 * 365) {
  return signToken({ email, purpose: 'unsubscribe', secret, expiresAt: Date.now() + ttlMs });
}
