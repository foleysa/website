import path from 'node:path';

const BLOCKED_LIST_NAMES = [
  'john_ok',
  'john-ok',
  'johnok',
  'kit-export',
  'kit_export',
  'beehiiv',
  'convertkit',
];

export class HoldError extends Error {
  constructor(message, code = 'HOLD') {
    super(message);
    this.name = 'HoldError';
    this.code = code;
  }
}

export function looksLikeImportedList(filePath = '') {
  const base = path.basename(String(filePath)).toLowerCase();
  return BLOCKED_LIST_NAMES.some((name) => base.includes(name));
}

export function assertNotImportedList(filePath) {
  if (filePath && looksLikeImportedList(filePath)) {
    throw new HoldError(
      `Refusing imported/third-party list "${path.basename(filePath)}". First-party confirmed subscribers only. John_OK / Kit / Beehiiv exports are blocked.`,
      'IMPORTED_LIST',
    );
  }
}

/**
 * Soft HOLD for Weekly Supply Chain Brief Issue sends.
 * Live delivery requires all of: ALLOW_LIVE_SEND=true, --live, --i-understand-soft-hold,
 * a real provider, MAIL_FROM, and confirmed first-party recipients only.
 */
export function evaluateSendHold({ config, args = {}, recipientCount = 0, recipientSource = '', listPath = '' }) {
  const reasons = [];
  if (config.softHold) reasons.push('product Soft HOLD is on (no live send to real recipients)');
  if (!args.live) reasons.push('CLI default is dry-run (pass --live to request a live send)');
  if (!args.acknowledgeHold) reasons.push('missing --i-understand-soft-hold');
  if (!config.allowLiveSend) reasons.push('ALLOW_LIVE_SEND is not true');
  if (config.provider === 'mock') reasons.push('MAILER_PROVIDER=mock (no network send)');
  if (!config.mailFrom) reasons.push('MAIL_FROM is empty');
  if (recipientSource && recipientSource !== 'fsa-first-party') {
    reasons.push(`recipient source must be fsa-first-party, got ${recipientSource}`);
  }
  if (listPath && looksLikeImportedList(listPath)) {
    reasons.push(`blocked list file ${path.basename(listPath)}`);
  }
  const liveRequested = Boolean(args.live && args.acknowledgeHold && config.allowLiveSend);
  // Phase 1 Soft HOLD is a product lock: scaffolding only. Flip config.softHold in a
  // later phase after John unlocks DNS, keys, and a real confirmed first-party list.
  const phase1Lock = Boolean(config.softHold);
  const allowed = liveRequested
    && !phase1Lock
    && config.provider !== 'mock'
    && Boolean(config.mailFrom)
    && recipientSource === 'fsa-first-party'
    && !looksLikeImportedList(listPath)
    && recipientCount > 0;

  return {
    dryRun: !allowed,
    liveRequested,
    allowed,
    phase1Lock,
    recipientCount,
    reasons: phase1Lock
      ? ['Phase 1 Soft HOLD: scaffolding only. No live email to real recipients.', ...reasons]
      : reasons,
  };
}

export function assertCanLiveSend(decision) {
  if (decision.allowed) return;
  throw new HoldError(
    `Send blocked. ${decision.reasons.join(' ')}`,
    'SOFT_HOLD',
  );
}
