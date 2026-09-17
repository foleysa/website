# Origin as source of truth — keep the domain live

Cursor Origin is a **git forge**, not a website host. Official docs: [Origin](https://cursor.com/docs/origin).

> Origin is Cursor's git forge for storing and sharing code. Use it to host repositories, sync projects from GitHub, and browse your team's Origin repos in the browser.

For Origin-hosted repos, Origin is the git source of truth. For GitHub mirrors, GitHub stays the source of truth ([Origin](https://cursor.com/docs/origin), [Mirror a GitHub repository](https://cursor.com/docs/origin/mirror-github)).

There is **no** documented Origin Pages, custom-domain site hosting, or serverless runtime. The documented “publish a live URL” path is **Vercel** attached to the repo ([Repository settings → Apps](https://cursor.com/docs/origin/settings), [Cloud Environment Setup — Publish to a live URL](https://cursor.com/docs/cloud-agent/setup)).

## What is true today (checked 2026-09-17)

| Layer | Reality | Proof |
|---|---|---|
| Public domain | `https://foleystrategicadvisory.com/` | `curl -sI` → `server: GitHub.com`, Pages HTTPS cert for apex + www, `cname: foleystrategicadvisory.com` |
| GitHub Pages | `main` / root, HTTPS enforced | `gh api repos/foleysa/website/pages` |
| Git remote | `github.com/foleysa/website` | this checkout |
| Parallel deploy | `https://website-smoky-psi-51.vercel.app` | GitHub repo `homepageUrl`; `curl -sI` → `server: Vercel`. Same Beehiiv form as Pages at check time. |
| Origin git | Not the remote on this repo | John has not claimed a codebase namespace / mirrored yet |

Guess discarded: “point the domain at Origin and it will serve the site.” That is not a documented product.

## Target architecture

```
John / Claude  →  Origin git (SoT, after detach)
                      │
                      ├─ Vercel (documented Origin app)  →  foleystrategicadvisory.com
                      │       static HTML + /api mailer
                      │
                      └─ GitHub (optional mirror or leftover Pages, then retire)
```

Keep GitHub Pages serving the live domain until Vercel’s custom domain is green. Email DNS (SPF/DKIM) is independent of the site CNAME.

## Cutover sequence (John-gated steps marked)

1. **John:** Claim the Origin codebase name at [cursor.com/codebase](https://cursor.com/codebase). Beta: the `{owner}` namespace cannot be changed later ([Origin](https://cursor.com/docs/origin)).
2. **John:** Connect the Cursor GitHub app; **Sync from GitHub** `foleysa/website`. GitHub remains SoT; Origin is the mirror ([Mirror](https://cursor.com/docs/origin/mirror-github)).
3. Keep Pages + current DNS. Do not delete the `CNAME` file or the Pages custom domain in this step.
4. Confirm the existing Vercel project (`website-smoky-psi-51`) deploys this branch / `main`. Or **John:** link Vercel under Origin repo Settings → Apps ([Settings](https://cursor.com/docs/origin/settings)).
5. **John:** In Vercel, add `foleystrategicadvisory.com` and `www`. Lower DNS TTL first (e.g. 300s) at the current DNS host.
6. **John:** When Vercel shows the domain verified on a preview/alias, flip the public records:
   - Today Pages uses GitHub’s apex/www records (A / CNAME per GitHub’s current Pages docs).
   - Replace them with Vercel’s records from the Vercel domain UI. Do not invent IPs here; copy what Vercel displays that day.
7. Probe `https://foleystrategicadvisory.com/` until `server` is `Vercel` and `/api/health` returns `softHold: true`.
8. Only then turn off GitHub Pages custom domain (or leave Pages on a `*.github.io` fallback). Remove or stop treating `CNAME` as the live host.
9. **John (later):** Settings → General → Detach from GitHub if Origin should become git SoT. GitHub repo is not deleted ([Settings](https://cursor.com/docs/origin/settings)). After detach, Depot/Buildkite CI apply to Origin-hosted repos only; Vercel still deploys.

## Mailer implication

`/api/subscribe`, `/api/confirm`, `/api/unsubscribe`, `/api/health` run on Vercel Node, not on GitHub Pages and not on Origin. The file subscriber store is for local ownership and export. Vercel’s filesystem is ephemeral — John unlock for production persistence is in `docs/JOHN-UNLOCKS.md` (Turso/Neon or similar). Do not put emails in git.

## What this PR does vs does not

**Does:** document the real Origin role; keep the domain on Pages until John flips DNS; scaffold a Vercel-ready first-party mailer so the deploy path can carry Issue #1 later.

**Does not:** claim an Origin namespace, change live DNS, detach GitHub, or send mail.
