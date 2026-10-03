import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizeEmail } from './tokens.js';

const SOURCE = 'fsa-first-party';

function nowIso() {
  return new Date().toISOString();
}

function emptyDb() {
  return { version: 1, source: SOURCE, subscribers: [] };
}

export function createMemoryStore(seed = []) {
  const db = emptyDb();
  db.subscribers = seed.map((row) => ({ ...row, email: normalizeEmail(row.email) }));
  return wrapStore(async () => db, async () => {});
}

export function createFileStore(filePath) {
  let cache;
  async function load() {
    if (cache) return cache;
    try {
      const raw = await readFile(filePath, 'utf8');
      cache = JSON.parse(raw);
      if (!Array.isArray(cache.subscribers)) cache = emptyDb();
    } catch (err) {
      if (err && err.code === 'ENOENT') cache = emptyDb();
      else throw err;
    }
    cache.source = SOURCE;
    return cache;
  }
  async function persist(db) {
    await mkdir(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp`;
    await writeFile(tmp, JSON.stringify(db, null, 2) + '\n', 'utf8');
    await writeFile(filePath, JSON.stringify(db, null, 2) + '\n', 'utf8');
    cache = db;
  }
  return wrapStore(load, persist);
}

export function createStore(config) {
  if (config.storeDriver === 'memory') return createMemoryStore();
  return createFileStore(config.storePath);
}

function wrapStore(load, persist) {
  return {
    source: SOURCE,
    async list() {
      const db = await load();
      return db.subscribers.slice();
    },
    async get(email) {
      const db = await load();
      const key = normalizeEmail(email);
      return db.subscribers.find((row) => row.email === key) || null;
    },
    async upsertPending(email, extra = {}) {
      const db = await load();
      const key = normalizeEmail(email);
      const existing = db.subscribers.find((row) => row.email === key);
      const row = existing || {
        email: key,
        status: 'pending',
        source: SOURCE,
        createdAt: nowIso(),
      };
      row.status = 'pending';
      row.source = SOURCE;
      row.pendingAt = nowIso();
      row.unsubscribedAt = existing?.unsubscribedAt || null;
      Object.assign(row, extra);
      if (!existing) db.subscribers.push(row);
      await persist(db);
      return row;
    },
    async confirm(email) {
      const db = await load();
      const key = normalizeEmail(email);
      const row = db.subscribers.find((item) => item.email === key);
      if (!row) return null;
      row.status = 'confirmed';
      row.confirmedAt = nowIso();
      row.source = SOURCE;
      await persist(db);
      return row;
    },
    async unsubscribe(email) {
      const db = await load();
      const key = normalizeEmail(email);
      let row = db.subscribers.find((item) => item.email === key);
      if (!row) {
        row = {
          email: key,
          status: 'unsubscribed',
          source: SOURCE,
          createdAt: nowIso(),
        };
        db.subscribers.push(row);
      }
      row.status = 'unsubscribed';
      row.unsubscribedAt = nowIso();
      await persist(db);
      return row;
    },
    async confirmedRecipients() {
      const db = await load();
      return db.subscribers.filter((row) => row.status === 'confirmed' && row.source === SOURCE);
    },
    async exportRows() {
      const db = await load();
      return db.subscribers.map((row) => ({
        email: row.email,
        status: row.status,
        source: row.source,
        createdAt: row.createdAt || '',
        confirmedAt: row.confirmedAt || '',
        unsubscribedAt: row.unsubscribedAt || '',
      }));
    },
  };
}
