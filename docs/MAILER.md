# First-party Weekly Supply Chain Brief mailer

Foley Strategic Advisory owns the list. Kit, Beehiiv, ConvertKit, and formsubmit are not on this path.

**Phase 1 = Soft HOLD.** Signup, confirm, unsubscribe, and Issue #1 HTML can be staged and dry-run. No live send to real recipients. Do not import John_OK or any ESP export.

## Why Resend (default), with Postmark ready

| | Resend | Postmark |
|---|---|---|
| Fit for this repo | HTML-first. Claude drops `newsletter/issues/0001/body.html`; Resend accepts that HTML over a small REST call. | Excellent transactional ESP. Broadcast needs a Message Stream (`broadcast` in `.env.example`). |
| Domain auth | Dashboard shows SPF + DKIM records after you add a domain. Prefer a sending subdomain. See [Verified domains](https://resend.com/docs/dashboard/domains/introduction). | Same idea: verify a domain, copy DNS from the Postmark UI. |
| List ownership | We do **not** use Resend Audiences as the system of record. Subscribers live in `mailer/data/subscribers.json` (exportable CSV). Resend/Postmark are the send pipe only. | Same: transport only. |

Resend is the default when John adds keys because the brief is an HTML artifact, not a drag-and-drop campaign builder. Switch with `MAILER_PROVIDER=postmark` if John already prefers Postmark’s reputation or has a server token. Do not run both against the same live blast.

## What is in this repo

- Homepage form posts JSON to `/api/subscribe` (no Beehiiv).
- Double opt-in: pending → confirm link → confirmed.
- Unsubscribe token on every issue; landing page at `/newsletter/unsubscribed.html`.
- Issue #1 drop zone: `newsletter/issues/0001/`.
- CLI dry-run: `npm run mailer:send -- --issue 0001 --allow-placeholder`.
- Local site + API: `npm run mailer` → http://127.0.0.1:8787
- Vercel functions in `/api` share the same handlers. Destination is **Origin (git SoT) → Vercel** (Origin App). There is no documented Origin-native site host.

## Soft HOLD locks

Live Issue send is refused unless a later phase turns `softHold` off **and** all of these are true:

1. `ALLOW_LIVE_SEND=true`
2. CLI `--live` and `--i-understand-soft-hold`
3. `MAILER_PROVIDER` is `resend` or `postmark` (not `mock`)
4. `MAIL_FROM` is set
5. Recipients are `status=confirmed` and `source=fsa-first-party`
6. No `--list` / John_OK / Kit / Beehiiv file
7. Issue `meta.json` `status` is `ready` and the body is not the drop zone

Phase 1 keeps `softHold: true` in `mailer/src/config.js`. Even with keys and flags, `npm run mailer:send` writes an outbox report and sends nothing.

DOI (confirm-your-email) is user-initiated. It will use the live provider only after `MAIL_FROM` + API key exist. Until then the mock provider records the message and, locally, the API may return `confirmUrl` when `MAILER_DEV_REVEAL_CONFIRM=true`. Leave that flag off on the public host.

## Commands

```bash
cp .env.example .env          # no keys required for Phase 1
npm test
npm run mailer                # site + API on :8787
npm run mailer:preview -- 0001
npm run mailer:send -- --issue 0001 --allow-placeholder
npm run mailer:export         # CSV of the first-party store (gitignored)
```

## Pages is leaving — merge on Origin

`foleystrategicadvisory.com` is still GitHub Pages today (`server: GitHub.com`). Pages cannot run `/api/*`. John decision: Origin is git SoT; the public site leaves Pages for Origin→Vercel.

Merge this form onto the **Origin-hosted** default branch after Vercel serves the domain (or keep Subscribe on the Vercel URL until then). Do not merge Beehiiv removal onto GitHub Pages as the live path — Subscribe fails closed on purpose (no third-party fallback).

See `docs/ORIGIN-CUTOVER.md` and `docs/JOHN-UNLOCKS.md`.
