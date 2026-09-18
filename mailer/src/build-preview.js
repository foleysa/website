import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { REPO_ROOT } from './config.js';
import { wrapIssue } from './templates/issue-wrapper.js';

const issueId = String(process.argv[2] || '0001').padStart(4, '0');
const dir = path.join(REPO_ROOT, 'newsletter/issues', issueId);
const meta = JSON.parse(await readFile(path.join(dir, 'meta.json'), 'utf8'));
const body = await readFile(path.join(dir, 'body.html'), 'utf8');
const html = wrapIssue({
  title: meta.subject || meta.title,
  issueId,
  html: body,
  unsubUrl: '#unsubscribe',
  publicBase: 'https://foleystrategicadvisory.com',
  preheader: meta.preheader || 'Staged — not sent.',
});
const dest = path.join(dir, 'preview.html');
await writeFile(dest, html, 'utf8');
console.log(`Wrote ${dest}`);
