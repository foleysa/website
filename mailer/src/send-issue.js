import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig, fromHeader, REPO_ROOT } from './config.js';
import { createStore } from './store.js';
import { createProvider } from './providers/index.js';
import { unsubToken } from './tokens.js';
import { assertNotImportedList, evaluateSendHold, assertCanLiveSend } from './hold.js';
import { bodyLooksLikePlaceholder, wrapIssue } from './templates/issue-wrapper.js';

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    issue: '0001',
    live: false,
    acknowledgeHold: false,
    allowPlaceholder: false,
    listPath: '',
    to: [],
  };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--issue') args.issue = String(argv[++i] || '0001').padStart(4, '0');
    else if (item === '--live') args.live = true;
    else if (item === '--i-understand-soft-hold') args.acknowledgeHold = true;
    else if (item === '--allow-placeholder') args.allowPlaceholder = true;
    else if (item === '--list') args.listPath = argv[++i] || '';
    else if (item === '--to') args.to.push(argv[++i] || '');
    else if (item === '--help' || item === '-h') args.help = true;
  }
  return args;
}

export async function loadIssue(issueId, root = REPO_ROOT) {
  const dir = path.join(root, 'newsletter/issues', issueId);
  const meta = JSON.parse(await readFile(path.join(dir, 'meta.json'), 'utf8'));
  const body = await readFile(path.join(dir, 'body.html'), 'utf8');
  return { dir, meta, body };
}

export async function runSendIssue({ argv, env, store, provider, now = new Date() } = {}) {
  const args = parseArgs(argv || process.argv.slice(2));
  if (args.help) {
    return { ok: true, help: true, text: 'Usage: npm run mailer:send -- --issue 0001   (dry-run default)' };
  }
  const config = loadConfig(env || process.env);
  if (args.listPath) assertNotImportedList(args.listPath);

  const issue = await loadIssue(args.issue, config.root);
  if (!args.allowPlaceholder && bodyLooksLikePlaceholder(issue.body)) {
    throw new Error(`Issue ${args.issue} still has the Claude drop zone. Drop real HTML before sending, or pass --allow-placeholder for a dry-run preview.`);
  }
  if (issue.meta.status !== 'ready' && !args.allowPlaceholder) {
    throw new Error(`Issue ${args.issue} status is "${issue.meta.status}", not "ready".`);
  }
  const subject = issue.meta.subject
    || (args.allowPlaceholder ? `${issue.meta.title || 'Weekly Supply Chain Brief'} [STAGED]` : '');
  if (!subject) {
    throw new Error(`Issue ${args.issue} has no subject in meta.json.`);
  }

  const listStore = store || createStore(config);
  let recipients = await listStore.confirmedRecipients();
  let recipientSource = listStore.source;

  if (args.to.length) {
    throw new Error('Ad-hoc --to is disabled in Phase 1 Soft HOLD. Confirmed first-party list only, after unlock.');
  }
  if (args.listPath) {
    assertNotImportedList(args.listPath);
    throw new Error('External --list imports are disabled. Own the list via site DOI only.');
  }

  const decision = evaluateSendHold({
    config,
    args,
    recipientCount: recipients.length,
    recipientSource,
    listPath: args.listPath,
  });

  const outboxDir = path.join(config.root, 'mailer/outbox');
  await mkdir(outboxDir, { recursive: true });
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  const outboxPath = path.join(outboxDir, `${args.issue}-${stamp}.json`);

  const planned = recipients.map((row) => {
    const token = unsubToken(row.email, config.secret);
    const unsubUrl = `${config.publicBase}/api/unsubscribe?token=${encodeURIComponent(token)}`;
    const html = wrapIssue({
      title: subject,
      issueId: args.issue,
      html: issue.body,
      unsubUrl,
      publicBase: config.publicBase,
      preheader: issue.meta.preheader || '',
    });
    return {
      to: row.email,
      subject,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    };
  });

  const report = {
    issue: args.issue,
    subject,
    dryRun: decision.dryRun,
    liveRequested: decision.liveRequested,
    allowed: decision.allowed,
    provider: config.provider,
    recipientCount: planned.length,
    recipientSource,
    reasons: decision.reasons,
    outbox: outboxPath,
    sent: [],
  };

  await writeFile(outboxPath, JSON.stringify({ ...report, planned: planned.map((item) => ({ to: item.to, subject: item.subject })) }, null, 2) + '\n');

  if (!decision.allowed) {
    return report;
  }

  assertCanLiveSend(decision);
  const pipe = provider || createProvider(config);
  for (const message of planned) {
    const result = await pipe.send({
      from: fromHeader(config),
      to: message.to,
      subject: message.subject,
      html: message.html,
      replyTo: config.replyTo,
      headers: message.headers,
    });
    report.sent.push({ to: message.to, id: result.id });
  }
  report.dryRun = false;
  await writeFile(outboxPath, JSON.stringify(report, null, 2) + '\n');
  return report;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  runSendIssue()
    .then((report) => {
      if (report.help) {
        console.log(report.text);
        return;
      }
      console.log(JSON.stringify(report, null, 2));
      if (report.dryRun) {
        console.log('\nDry-run only. Soft HOLD is on. No live email was sent.');
      }
    })
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 1;
    });
}
