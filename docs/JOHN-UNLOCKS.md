# John unlocks — whole fleet to Origin, Soft HOLD

**Everything** to Cursor Origin as git SoT: website, Procuro, terminal, and any foleysa repo found later. Public FSA site leaves GitHub Pages. Terminal leaves `github.io`. Do not keep GitHub as SoT.

Soft HOLD stays on. No live Issue #1. No John_OK / Kit / Beehiiv blast from any repo.

Inventory and per-repo deploy notes: `docs/ORIGIN-CUTOVER.md`.

## Block live send (already true on website)

- `mailer/src/config.js` → `softHold: true`
- `ALLOW_LIVE_SEND` unset
- CLI defaults to dry-run
- `--list` and `--to` refused
- Imported filenames matching `john_ok`, `kit`, `beehiiv`, `convertkit` refused

## Unlock A — Origin SoT for the whole fleet (required)

One codebase name, then **every** repo.

Visible remotes (2026-09-18): `foleysa/website`, `foleysa/Procuro`, `foleysa/terminal`. If John has private repos this token could not list, run the same steps.

1. Open [cursor.com/codebase](https://cursor.com/codebase) and claim the codebase name. Beta: **cannot change `{owner}` later**.
2. Confirm Origin access (Pro / Teams / Enterprise) ([Origin](https://cursor.com/docs/origin)).
3. Connect the Cursor GitHub app (for Sync).
4. For **each** repo:
   - Sync from GitHub **or** New Origin repo + `git push` to `https://origin.cursor.com/{owner}/{repo}.git`.
   - If synced: **Detach from GitHub immediately**.
   - Confirm the icon is Origin-hosted.
5. Repoint remotes on laptops, this Cloud Agent environment, Replit (Procuro), and Vercel projects. Stop using `github.com/foleysa/*` as upstream.
6. After detach, open PRs on **Origin**. Agents on a leftover mirror still open GitHub PRs — that is the failure mode to avoid.

Do not dual-push. Do not leave website done and Procuro/terminal on GitHub.

Suggested order: **website** (live custom domain) → **terminal** (github.io) → **Procuro** (largest, Replit + monorepo). Same rules either order.

## Unlock B — website leaves Pages (Origin → Vercel)

1. Origin-hosted `website` → Apps → **Vercel**. Production tracks Origin. Retarget https://website-smoky-psi-51.vercel.app (today it follows GitHub `main`).
2. Add `foleystrategicadvisory.com` + `www`.
3. Lower TTL; point DNS at **what Vercel shows**.
4. Prove `server: Vercel` and `GET /api/health` → `softHold: true`.
5. **Turn off GitHub Pages** for this domain. No fallback.
6. Merge this mailer PR on **Origin** (or keep Subscribe on the Vercel URL until `/api` is public). Do not merge Beehiiv removal onto Pages as the live path.

## Unlock C — terminal leaves github.io (Origin → Vercel)

1. Origin-hosted `terminal` → Vercel (own project or a path John chooses).
2. Prove a Vercel URL serves the same static terminal.
3. Turn off Pages on `foleysa/terminal` (`https://foleysa.github.io/terminal/` today).
4. Optional: custom domain later. None exists now.

## Unlock D — Procuro git + runtime retarget

Procuro is the product app. Brand stays off the FSA marketing site.

1. Origin-hosted `procuro` (or the name John picked) after Unlock A.
2. Point Replit git at Origin (current notes assume Replit workflows; no production URL on the GitHub homepage).
3. If John wants Vercel previews for `command-center`, attach Vercel on the **Origin-hosted** repo — not the GitHub leftover.
4. API/Postgres stay on a real host (Replit or other). Origin does not run Express. Secrets stay out of git.
5. Replace GitHub Actions assumptions after detach (Origin Apps: Vercel; Depot/Buildkite if needed).

## Unlock E — mail DNS + keys (website only; Soft HOLD)

Keys may be stored. Do not send Issue #1.

| Domain | Current use (observed) |
|---|---|
| `foleystrategicadvisory.com` | Public site (Pages today → Vercel after Unlock B) |
| `foleysa.com` | Mailbox `john@foleysa.com` on the site |

Send from a **subdomain** of the site ([Resend domains](https://resend.com/docs/dashboard/domains/introduction)). Keep `john@foleysa.com` as `MAIL_REPLY_TO` unless John says otherwise.

1. Resend (preferred) or Postmark.
2. Paste **their** SPF, DKIM, optional DMARC. One SPF TXT per host. DMARC start `p=none`.
3. `MAIL_FROM` on the verified domain.
4. API key + `MAILER_SECRET` on the **Vercel project attached to Origin `website`**.
5. `MAILER_PUBLIC_BASE=https://foleystrategicadvisory.com`.
6. `MAILER_DEV_REVEAL_CONFIRM` off in production.

## Unlock F — durable list store (website)

`mailer/data/subscribers.json` is local/owned. Vercel disk is ephemeral. Before public signup: Turso/Neon (or similar), then `npm run mailer:export` as the portable copy.

## Unlock G — Issue #1 HTML (still Soft HOLD)

1. Drop HTML in `website` `newsletter/issues/0001/body.html`.
2. Set `subject` / `preheader` / `"status": "ready"`.
3. Dry-run: `npm run mailer:send -- --issue 0001`.
4. No live send.

## Unlock H — lift Soft HOLD (later Origin PR)

Only after A–G, a confirmed first-party list, and John says the hold is off — on **Origin `website`**, not GitHub.

## Not unlocks / do not do

- Do not keep any foleysa repo on GitHub as SoT.
- Do not keep Pages or `github.io` as the live host after the Vercel (or chosen Origin path) URL is green.
- Do not paste Kit, Beehiiv, or John_OK CSVs into `mailer/data`.
- Do not send FSA mail from a Procuro brand or domain.
- Do not invent metrics or Procuro production URLs.
- Do not turn off website Pages **before** Vercel HTTPS is confirmed — then turn Pages off.
