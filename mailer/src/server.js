import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { loadConfig, REPO_ROOT } from './config.js';
import { createMailerContext, dispatch } from './http.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

const BLOCKED = ['/mailer/data/', '/.env', '/.git/'];

const config = loadConfig();
const ctx = createMailerContext({ config });
const port = Number(process.env.PORT || 8787);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname.startsWith('/api/')) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      let body = {};
      if (chunks.length) {
        const raw = Buffer.concat(chunks).toString('utf8');
        try { body = JSON.parse(raw); } catch { body = Object.fromEntries(new URLSearchParams(raw)); }
      }
      const result = await dispatch(ctx, {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body,
        ip: req.socket.remoteAddress,
      });
      res.writeHead(result.status, result.headers);
      if (result.body == null) res.end();
      else res.end(typeof result.body === 'string' ? result.body : JSON.stringify(result.body));
      return;
    }

    if (BLOCKED.some((prefix) => url.pathname.startsWith(prefix))) {
      res.writeHead(404); res.end('Not found'); return;
    }

    const file = resolveStatic(url.pathname);
    if (!file) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Not found'); return; }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'server_error' }));
  }
});

function resolveStatic(pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes('\0')) return null;
  let rel = decoded === '/' ? '/index.html' : decoded;
  if (rel.endsWith('/')) rel += 'index.html';
  const abs = path.normalize(path.join(REPO_ROOT, rel));
  if (!abs.startsWith(REPO_ROOT)) return null;
  if (existsSync(abs) && statSync(abs).isFile()) return abs;
  if (existsSync(abs) && statSync(abs).isDirectory()) {
    const index = path.join(abs, 'index.html');
    if (existsSync(index)) return index;
  }
  if (existsSync(`${abs}.html`)) return `${abs}.html`;
  return null;
}

server.listen(port, '127.0.0.1', () => {
  console.log(`FSA mailer + site  http://127.0.0.1:${port}`);
  console.log(`provider=${config.provider}  store=${config.storeDriver}  softHold=${config.softHold}`);
  console.log('No live email. Soft HOLD is on.');
});
