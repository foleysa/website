import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function loadConfig(env = process.env) {
  const provider = String(env.MAILER_PROVIDER || 'mock').toLowerCase();
  const publicBase = String(env.MAILER_PUBLIC_BASE || env.PUBLIC_BASE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
  return {
    root: REPO_ROOT,
    provider,
    mailFrom: String(env.MAIL_FROM || '').trim(),
    mailFromName: String(env.MAIL_FROM_NAME || 'Foley Strategic Advisory').trim(),
    replyTo: String(env.MAIL_REPLY_TO || 'john@foleysa.com').trim(),
    resendApiKey: String(env.RESEND_API_KEY || '').trim(),
    postmarkToken: String(env.POSTMARK_SERVER_TOKEN || '').trim(),
    postmarkStream: String(env.POSTMARK_MESSAGE_STREAM || 'broadcast').trim(),
    secret: String(env.MAILER_SECRET || 'dev-only-change-me'),
    storeDriver: String(env.SUBSCRIBER_STORE || 'file').toLowerCase(),
    storePath: env.SUBSCRIBER_STORE_PATH
      ? path.resolve(env.SUBSCRIBER_STORE_PATH)
      : path.join(REPO_ROOT, 'mailer/data/subscribers.json'),
    publicBase,
    allowLiveSend: env.ALLOW_LIVE_SEND === 'true',
    revealConfirm: env.MAILER_DEV_REVEAL_CONFIRM === 'true',
    // Product policy: Weekly Supply Chain Brief stays on Soft HOLD.
    softHold: true,
    brand: 'Foley Strategic Advisory',
    product: 'Weekly Supply Chain Brief',
  };
}

export function fromHeader(config) {
  if (!config.mailFrom) return `${config.mailFromName} <mailer@localhost>`;
  return `${config.mailFromName} <${config.mailFrom}>`;
}
