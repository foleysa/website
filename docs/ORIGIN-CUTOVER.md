# Fleet Origin SoT — every foleysa repo

**John (2026-09-17 / 2026-09-18):** Cursor Origin is git source of truth for **everything**, not only the website. The public site leaves GitHub Pages. Do not keep GitHub as SoT. Soft HOLD: no live email.

Official Origin docs: [Origin](https://cursor.com/docs/origin).

> For Origin-hosted repos, Origin is the source of truth. For synced repos, GitHub stays the source of truth and Origin is the mirror.

A GitHub **mirror is a transfer step only**. End state for **each** repo: Origin-hosted (created on Origin, or Sync then **Detach from GitHub**). Lingering as a GitHub mirror is the opposite of this decision ([Mirror](https://cursor.com/docs/origin/mirror-github), [Detach](https://cursor.com/docs/origin/settings)).

This document lives in `website` because that is the repo this PR touches. It is the cutover home for the **whole foleysa fleet**. Copy or link it from the other Origin repos after Unlock A.

## Destination: Origin → Vercel (or the Origin App path)

There is **no** documented Origin-native public site host, custom-domain web server, or request runtime. Guess discarded: “point a domain at Origin and it serves the app.”

Documented publish path: **Vercel** Origin App on an **Origin-hosted** repo ([Settings → Apps](https://cursor.com/docs/origin/settings), [Publish to a live URL](https://cursor.com/docs/cloud-agent/setup)). Depot and Buildkite attach only after detach.

```
John / agents  →  Origin git (SoT)  →  Vercel (or other runtime John already uses)
GitHub / Pages / github.io = leftover archive. Not SoT. Not the live host.
```

If a product already runs on Replit (Procuro), **git still moves to Origin**. Runtime can stay Replit until John points that host at the Origin remote — or move that surface to Vercel. GitHub is not SoT either way.

If Cursor later ships Origin-native hosting, revisit. Until the docs say so, Vercel is the Origin path for public URLs.

## Discovery — is Origin already claimed? (2026-09-18, Soft HOLD)

**No detach. No login prompt.** This Cloud Agent used the Origin CLI on the box (`/exec-daemon/tools/origin`) plus unauthenticated HTTP.

| Probe | Result |
|---|---|
| `origin auth status` / `origin repo list` / `origin api` | **Not authenticated.** CLI: stored logins are disabled on hosted agent VMs; the host is supposed to inject `CURSOR_AUTH_TOKEN` (or `CURSOR_API_KEY`). Both were **unset** in this environment. |
| `https://origin.cursor.com/{guess}/{repo}.git/info/refs` | **401** `www-authenticate: Basic realm="git-keeper"` for every guess (`foleysa`, `foley`, `john`, `johnfoley`, `johnefoley`, `fsa`, `foleystrategicadvisory`, `john-foley`, `FoleySA` × website/procuro/terminal). 401 here does **not** prove the namespace exists or does not — git-keeper does not distinguish. |
| `https://cursor.com/codebase` and `/codebase/foleysa` | Cloudflare bot wall (`authenticator.cursor.sh`). No namespace page body. |
| Cloud Agent env / run | Repos: `github.com/foleysa/website` only. Run owner: John Foley `john@foleysa.com` (Cursor user `375001778`). That is the **Cursor account**, not an Origin `{owner}` slug. |
| Run events | No Origin namespace or MCP Origin auth event. |

**Namespace URL:** not observed.  
**Origin repos:** none listed (auth never succeeded).  
**Exact blocker:** this VM has no Origin session (`CURSOR_AUTH_TOKEN` / `CURSOR_API_KEY` missing; `origin auth login` disabled for stored logins). A later agent **with** an injected token can run `origin repo list --json org,name,mirrorStatus` and `origin namespace access list <slug>` — still Soft HOLD, no detach.

John may already have claimed a codebase in the browser. This agent cannot see it.

## Fleet inventory (checked 2026-09-18)

Visible to this agent on `github.com/foleysa` — **three public repos**, none archived. `gh repo list foleysa` returned only these. Private repos, if any, were not visible; use the same recipe.

| Repo | What it is | Git today | Live host today | Origin SoT? |
|---|---|---|---|---|
| [foleysa/website](https://github.com/foleysa/website) | FSA marketing site + Brief mailer scaffold | `github.com/foleysa/website` | Pages: `foleystrategicadvisory.com` (`server: GitHub.com`). Twin: `https://website-smoky-psi-51.vercel.app` (tracks GitHub `main`) | Not yet |
| [foleysa/Procuro](https://github.com/foleysa/Procuro) | Product app — pnpm monorepo (`artifacts/api-server`, `command-center`, `mockup-sandbox`; Replit-oriented) | GitHub `main` | No GitHub Pages. No `vercel.json` on main. Runtime notes in `replit.md` (Replit workflows). CI mentions GitHub Actions in docs | Not yet |
| [foleysa/terminal](https://github.com/foleysa/terminal) | FSA Procurement Intelligence Terminal (static HTML) | GitHub `main` | Pages project site: `https://foleysa.github.io/terminal/` (`server: GitHub.com`, no custom CNAME) | Not yet |

**Brand:** the website stays FSA only (≠ Procuro chrome). Procuro is a separate product repo. Both still move to Origin as git.

**Max / Marco:** old website paths were deleted on GitHub; they are not separate remotes.

## Common SoT recipe (every repo)

Do this **once** for the codebase, then **once per repo**.

1. Claim the Origin codebase name (`{owner}` in `https://cursor.com/codebase/{owner}/{repo}`). Beta: **cannot rename** ([Origin](https://cursor.com/docs/origin)).
2. Connect the Cursor GitHub app (needed only for Sync).
3. Per repo, pick one:
   - **Import then detach (preferred, keeps history):** Sync from GitHub → **immediately Detach** (Settings → General → Danger Zone). Origin is SoT. Pushes to `https://origin.cursor.com/{owner}/{repo}.git` stay on Origin. GitHub copy is leftover ([Settings](https://cursor.com/docs/origin/settings)).
   - **Create on Origin and push:** New Internal/Private repo, then `git push -u origin main` ([Create](https://cursor.com/docs/origin/create-repository)). No GitHub push URL.
4. Point laptops, Replit, Vercel, and cloud agents at that Origin URL. Stop using `github.com/foleysa/<repo>` as upstream.
5. Confirm the Origin UI icon is **Origin-hosted**, not “synced from GitHub.”

While still mirrored, `git push` to the Origin clone URL **goes to GitHub** ([Clone, Push & Pull](https://cursor.com/docs/origin/git)). That window is minutes, not the operating model. Cloud agents on a mirror open **GitHub** PRs; after detach they open **Origin** PRs.

Do **not** dual-push. Do **not** leave any foleysa repo as a GitHub-SoT mirror.

Suggested Origin names (John chooses; cannot rename the **codebase** `{owner}`):

| GitHub | Suggested Origin repo name |
|---|---|
| `foleysa/website` | `website` |
| `foleysa/Procuro` | `procuro` (Origin names are case-insensitive on some filesystems — pick one casing and keep it) |
| `foleysa/terminal` | `terminal` |

## Per-repo deploy after Origin is SoT

### website — leave GitHub Pages

Zero-downtime overlap is fine. Staying on Pages is not.

1. Origin-hosted `website` → Apps → **Vercel**. Production must track Origin, not GitHub. Retarget or replace `website-smoky-psi-51`.
2. Add `foleystrategicadvisory.com` + `www`. Lower TTL. Flip DNS to **the records Vercel shows that day**.
3. Prove `curl -sI https://foleystrategicadvisory.com/` → `server: Vercel` and `/api/health` → `softHold: true`.
4. Disable the Pages custom domain. Ignore or delete `CNAME`. No Pages fallback.
5. Merge the first-party mailer on **Origin** after Vercel is the public host (or keep Subscribe on the Vercel URL until then). Do not merge Beehiiv removal onto Pages as the live path.

`/api/*` runs on Vercel Node attached to Origin. Not on Pages. Not on Origin itself.

### terminal — leave github.io

Same Origin→Vercel path (static HTML, no API).

1. Origin-hosted `terminal` → Vercel (own project, or a path on the website project — John chooses).
2. Ship a Vercel URL, then optionally a custom host. Today there is no CNAME; live is `https://foleysa.github.io/terminal/`.
3. Turn off GitHub Pages on `foleysa/terminal`.
4. If the FSA site should link the terminal, update `website` **after** both remotes are Origin.

### Procuro — product app (git on Origin; runtime retarget)

Procuro is the product monorepo, not the FSA marketing site.

1. Sync + Detach (or create + push) so **Origin is SoT**.
2. Retarget anything that clones GitHub: Replit Git integration, local remotes, future Vercel projects for `command-center` / preview apps, any CI that still assumes GitHub.
3. After detach, GitHub Actions on the leftover GitHub repo will not see Origin pushes. Use Origin Apps (Vercel previews; Depot/Buildkite if John wants Origin CI) or keep running checks in the agent environment.
4. API (`artifacts/api-server`) needs a Node/Postgres host. That is **not** Origin. Options John already has or can attach: stay on Replit but pull from Origin; or add a host and keep secrets out of git. Do not invent a production URL — none was on the GitHub repo homepage.
5. Do not put Procuro brand on `foleystrategicadvisory.com`.

## Soft HOLD (fleet)

No live Weekly Supply Chain Brief (or any FSA list blast) from **any** repo. Mailer locks live in `website` (`softHold: true`). Procuro and terminal have no Brief send path in this PR. Do not add one. Do not import John_OK / Kit / Beehiiv lists.

## What this PR does vs does not

**Does:** lock fleet Origin SoT; document all three visible remotes; keep website mailer scaffolding on Soft HOLD.

**Does not:** claim the Origin namespace, detach GitHub on any repo, flip DNS, move Procuro runtime, or send mail. Those are John unlocks (`docs/JOHN-UNLOCKS.md`).
