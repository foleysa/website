import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadConfig } from './config.js';
import { createStore } from './store.js';

const config = loadConfig();
const store = createStore(config);
const rows = await store.exportRows();
const header = 'email,status,source,createdAt,confirmedAt,unsubscribedAt';
const csv = [header, ...rows.map((row) => [
  row.email,
  row.status,
  row.source,
  row.createdAt,
  row.confirmedAt,
  row.unsubscribedAt,
].map(csvCell).join(','))].join('\n') + '\n';

const dest = path.join(config.root, 'mailer/data/subscribers-export.csv');
await writeFile(dest, csv, 'utf8');
console.log(`Exported ${rows.length} rows to ${dest}`);
console.log('This file is gitignored. Own the list; do not import John_OK / Kit / Beehiiv dumps into send.');

function csvCell(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}
