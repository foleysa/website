# John unlocks — Origin SoT, Pages off, Soft HOLD

John HARD CORRECT: **Cursor Origin** is git source of truth. The public site **leaves GitHub Pages**. Do not stay on GitHub as SoT.

Soft HOLD stays on. No live Issue #1. No John_OK / Kit / Beehiiv blast.

## Block live send (already true)

- `mailer/src/config.js` → `softHold: true`
- `ALLOW_LIVE_SEND` unset
- CLI defaults to dry-run
- `--list` and `--to` refused
- Imported filenames matching `john_ok`, `kit`, `beehiiv`, `convertkit` refused

## Unlock A — Origin is git SoT (required, not optional)

Do this first. A GitHub mirror is only the import. Detach is the decision.

1. Open [cursor.com/codebase](https://cursor.com/codebase) and claim the codebase name. Beta: **cannot change `{owner}` later**.
2. Confirm Origin access (Pro / Teams / Enterprise; not free) ([Origin](https://cursor.com/docs/origin)).
3. Import history: **Sync from GitHub** `foleysa/website` (needs Cursor GitHub app + GitHub admin) **or** create a New Origin repo and `git push` this tree to `https://origin.cursor.com/{owner}/{repo}.git`.
4. If you synced: **Detach from GitHub** immediately (Settings → General → Danger Zone). Origin is now SoT. Pushes no longer flow to GitHub ([Settings](https://cursor.com/docs/origin/settings)).
5. Set the git remote on laptops and agents to the Origin clone URL. Stop using `github.com/foleysa/website` as upstream.
6. Confirm in the Origin UI: repo icon is **Origin-hosted**, not “synced from GitHub.”

Do not leave the repo as a GitHub mirror. Do not dual-push to GitHub. Cloud agents on a mirror still open **GitHub** PRs; after detach they open **Origin** PRs ([Create a repository](https://cursor.com/docs/origin/create-repository)).

## Unlock B — Public site: Origin → Vercel (leave Pages)

No documented Origin-native site host. Destination is the Vercel Origin App.

1. On the **Origin-hosted** repo: Settings → Apps → **Vercel**. Production must track Origin, not GitHub. Existing preview: https://website-smoky-psi-51.vercel.app (today it follows GitHub `main` — retarget after detach).
2. Add `foleystrategicadvisory.com` + `www` in Vercel.
3. Lower DNS TTL, then point records at **what Vercel shows**.
4. Confirm `curl -sI https://foleystrategicadvisory.com` → `server: Vercel` and `GET /api/health` → `softHold: true`.
5. **Turn off GitHub Pages** for this domain. Do not keep Pages as fallback.
6. Merge this PR on **Origin** (or keep Subscribe on the Vercel URL until `/api` is on the public host). Do not merge Beehiiv removal onto Pages as the live path.

Overlap Pages + Vercel for a short DNS TTL window is fine. Staying on Pages is not.

## Unlock C — DNS for email (SPF / DKIM / DMARC)

Two domains already exist. Copy records from the ESP dashboard after John picks a FROM. Soft HOLD: keys may be stored; do not send Issue #1.

| Domain | Current use (observed) |
|---|---|
| `foleystrategicadvisory.com` | Public site (Pages today → Vercel after Unlock B) |
| `foleysa.com` | Public mailbox `john@foleysa.com` on the site |

**Recommendation:** send the brief from a **subdomain** of the site, e.g. `updates.foleystrategicadvisory.com` or `brief.foleystrategicadvisory.com` ([Resend: verified domains](https://resend.com/docs/dashboard/domains/introduction)). Keep `john@foleysa.com` as `MAIL_REPLY_TO` unless John says otherwise.

1. Create a Resend account (preferred) or Postmark server.
2. Verify the sending domain. Paste **their** SPF, DKIM, and (optional) DMARC at the DNS host. One SPF TXT per host. Start DMARC at `p=none`.
3. Set `MAIL_FROM` on the verified domain (shape only: `brief@updates.foleystrategicadvisory.com`).
4. Set `RESEND_API_KEY` or `POSTMARK_SERVER_TOKEN` on the **Vercel project attached to Origin** (and local `.env`, never git).
5. Set `MAILER_SECRET` to a long random string.
6. Set `MAILER_PUBLIC_BASE=https://foleystrategicadvisory.com`.
7. Leave `MAILER_DEV_REVEAL_CONFIRM` unset/false on production.

## Unlock D — durable list store

Local/Phase 1 store: `mailer/data/subscribers.json` (gitignored).

Vercel disk is not durable. Before public signup:

1. Pick a database John controls (Turso, Neon, or similar).
2. Point `SUBSCRIBER_STORE` at it (adapter TBD in Phase 2).
3. Keep `npm run mailer:export` as the portable copy of record.

## Unlock E — Issue #1 content (still Soft HOLD)

1. Drop real HTML in `newsletter/issues/0001/body.html`.
2. Set `subject` / `preheader` / `"status": "ready"` in `meta.json`.
3. Dry-run: `npm run mailer:send -- --issue 0001`.
4. No live send in this phase.

## Unlock F — lift Soft HOLD (later PR, not this one)

Only after A–E, a confirmed first-party list exists, and John says the hold is off:

1. Flip `softHold` in `mailer/src/config.js` in a dedicated PR **on Origin**.
2. Set `ALLOW_LIVE_SEND=true` on the Vercel host for that send window.
3. Run with `--live --i-understand-soft-hold`.
4. Still refuse John_OK / Kit / Beehiiv files.

## Not unlocks / do not do

- Do not keep GitHub as source of truth or as the live host.
- Do not paste Kit, Beehiiv, or John_OK CSVs into `mailer/data`.
- Do not send from a Procuro brand or domain.
- Do not invent open rates, subscriber counts, or savings metrics.
- Do not turn off Pages **before** Vercel HTTPS for the custom domain is confirmed — then turn Pages off.
