# John unlocks — Phase 1 is scaffolding only

Soft HOLD stays on until these are done. No live Issue #1. No John_OK / Kit / Beehiiv blast.

## Block live send (already true)

- `mailer/src/config.js` → `softHold: true`
- `ALLOW_LIVE_SEND` unset
- CLI defaults to dry-run
- `--list` and `--to` refused
- Imported filenames matching `john_ok`, `kit`, `beehiiv`, `convertkit` refused

## Unlock A — DNS for the site (Origin / Vercel cutover)

Needed so the first-party form can live on the public domain.

1. Claim Origin codebase name (irreversible in beta): https://cursor.com/codebase
2. Sync `foleysa/website` from GitHub.
3. Confirm Vercel project (existing: https://website-smoky-psi-51.vercel.app) deploys `main` or this branch.
4. Add `foleystrategicadvisory.com` + `www` in Vercel.
5. Lower TTL, then point DNS at the records Vercel shows.
6. Confirm `curl -sI https://foleystrategicadvisory.com` → `server: Vercel` and `/api/health` works.
7. Merge this PR only after that, **or** keep Subscribe on a preview URL until then. Merging the Beehiiv removal onto Pages `main` before the API is on the public host will fail closed (no third-party fallback).

## Unlock B — DNS for email (SPF / DKIM / DMARC)

Two domains already exist. Do not guess records; copy them from the ESP dashboard after John picks a FROM.

| Domain | Current use (observed) |
|---|---|
| `foleystrategicadvisory.com` | Public site (GitHub Pages today) |
| `foleysa.com` | Public mailbox `john@foleysa.com` on the site |

**Recommendation:** send the brief from a **subdomain** of the site, e.g. `updates.foleystrategicadvisory.com` or `brief.foleystrategicadvisory.com`, so newsletter reputation is isolated ([Resend: verified domains / subdomains](https://resend.com/docs/dashboard/domains/introduction)). Keep `john@foleysa.com` as `MAIL_REPLY_TO` unless John says otherwise.

John:

1. Create a Resend account (preferred) or Postmark server.
2. Add and verify the sending domain. Paste **their** SPF, DKIM, and (optional) DMARC values at the DNS host. Typical shapes, for orientation only — **use the dashboard values**:
   - SPF: TXT on the sending host, includes the ESP (`include:amazonses.com` style for Resend, or Postmark’s include). Merge with any existing SPF; one SPF TXT per host.
   - DKIM: CNAME or TXT records the ESP names (`resend._domainkey…` / Postmark DKIM).
   - DMARC: TXT on `_dmarc`, start at `p=none` until mail is trusted.
3. Set `MAIL_FROM` to an address on that verified domain (example shape only: `brief@updates.foleystrategicadvisory.com`).
4. Set `RESEND_API_KEY` or `POSTMARK_SERVER_TOKEN` on the Vercel project (and locally in `.env`, never in git).
5. Set `MAILER_SECRET` to a long random string.
6. Set `MAILER_PUBLIC_BASE=https://foleystrategicadvisory.com`.
7. Leave `MAILER_DEV_REVEAL_CONFIRM` unset/false on production.

SPF/DKIM for mail does **not** require moving the website DNS in the same change window, but both are John-owned at the DNS host.

## Unlock C — durable list store

Local/Phase 1 store: `mailer/data/subscribers.json` (gitignored). That is the owned list.

On Vercel the disk is not durable. Before public signup:

1. Pick a tiny database John controls (Turso, Neon, or similar).
2. Point `SUBSCRIBER_STORE` at it (adapter TBD in Phase 2).
3. Keep CSV export (`npm run mailer:export`) as the portable copy of record.

Until then, treat preview deploys as disposable for stored emails.

## Unlock D — Issue #1 content

1. Drop real HTML in `newsletter/issues/0001/body.html`.
2. Set `subject` / `preheader` / `"status": "ready"` in `meta.json`.
3. Dry-run: `npm run mailer:send -- --issue 0001`.
4. Send to **John only** after Soft HOLD is lifted in a later PR — still not a list blast.

## Unlock E — lift Soft HOLD (later PR, not this one)

Only after A–D, a confirmed first-party list exists, and John says the hold is off:

1. Flip `softHold` in `mailer/src/config.js` in a dedicated PR.
2. Set `ALLOW_LIVE_SEND=true` on the host for that send window.
3. Run with `--live --i-understand-soft-hold`.
4. Still refuse John_OK / Kit / Beehiiv files.

## Not unlocks / do not do

- Do not paste Kit, Beehiiv, or John_OK CSVs into `mailer/data`.
- Do not send from a Procuro brand or domain.
- Do not invent open rates, subscriber counts, or savings metrics on the site or in Issue #1.
- Do not turn off GitHub Pages until Vercel HTTPS for the custom domain is confirmed.
