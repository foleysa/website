# Origin is the source of truth — leave GitHub Pages

**John HARD CORRECT (2026-09-17):** Cursor Origin is git source of truth. The public site leaves GitHub Pages. Do not keep GitHub as SoT. Soft HOLD: no live email.

Official Origin docs: [Origin](https://cursor.com/docs/origin).

> Origin is Cursor's git forge for storing and sharing code.

> For Origin-hosted repos, Origin is the source of truth. For synced repos, GitHub stays the source of truth and Origin is the mirror.

A GitHub **mirror is a transfer step only**. The end state is an **Origin-hosted** repo (created on Origin, or mirrored then **Detach from GitHub**). Lingering as a GitHub mirror is the opposite of this decision ([Mirror](https://cursor.com/docs/origin/mirror-github), [Detach](https://cursor.com/docs/origin/settings)).

## Destination: Origin → Vercel (not Origin-native hosting)

There is **no** documented Origin Pages, custom-domain web host, or request runtime. Guess discarded: “point `foleystrategicadvisory.com` at Origin and it serves the site.”

The documented public-URL path is the **Vercel** Origin App on an Origin-hosted repo ([Repository settings → Apps](https://cursor.com/docs/origin/settings), [Publish to a live URL](https://cursor.com/docs/cloud-agent/setup)):

```
John / Claude  →  Origin git (SoT)  →  Vercel (Origin App)  →  foleystrategicadvisory.com
                                      static HTML + /api mailer
GitHub / Pages = leftover archive only. Not SoT. Not the live host.
```

Depot and Buildkite also attach only to **Origin-hosted** repos, not GitHub mirrors ([Settings](https://cursor.com/docs/origin/settings)). Another reason not to stay mirrored.

If Cursor later ships Origin-native static hosting, revisit. Until the docs say so, Vercel is the destination.

## What is true today (checked 2026-09-17)

| Layer | Reality | Proof |
|---|---|---|
| Public domain | `https://foleystrategicadvisory.com/` still on Pages | `curl -sI` → `server: GitHub.com` |
| GitHub Pages | `main` / root, HTTPS on apex + www | `gh api repos/foleysa/website/pages` |
| Git remote on this checkout | `github.com/foleysa/website` | not Origin yet |
| Parallel Vercel | `https://website-smoky-psi-51.vercel.app` | `server: Vercel` — today it tracks GitHub `main`, not Origin |
| Origin git | Not SoT yet | John has not claimed a codebase namespace / detached |

## How to make Origin SoT (pick one)

**Preferred — import then detach (keeps history)**

1. Claim the Origin codebase name (`{owner}` in `https://cursor.com/codebase/{owner}/{repo}`). Beta: **cannot rename** ([Origin](https://cursor.com/docs/origin)).
2. Connect the Cursor GitHub app. **Sync from GitHub** `foleysa/website` ([Mirror](https://cursor.com/docs/origin/mirror-github)).
3. **Immediately Detach from GitHub** (Settings → General → Danger Zone). Origin becomes SoT. Pushes to `https://origin.cursor.com/{owner}/{repo}.git` stay on Origin. The GitHub repo is unchanged leftover ([Settings](https://cursor.com/docs/origin/settings)).
4. Point local/agent remotes at that Origin URL. Stop treating `github.com/foleysa/website` as upstream.

While still mirrored, `git push` to the Origin clone URL **goes to GitHub** ([Clone, Push & Pull](https://cursor.com/docs/origin/git)). That window should be minutes, not the operating model.

**Alternative — create on Origin and push (SoT from the first push)**

1. Claim the codebase name.
2. **New** repo on Origin (Internal or Private) ([Create a repository](https://cursor.com/docs/origin/create-repository)).
3. `git remote add origin https://origin.cursor.com/{owner}/{repo}.git` and `git push -u origin main`.
4. Do not add a GitHub push URL. Dual-push is documented only for people *evaluating* both remotes — not this cutover.

Do **not** use “keep GitHub as SoT and Origin as a browse mirror.”

## Site leaves GitHub Pages

Zero-downtime overlap is fine. Staying on Pages is not.

1. **John:** On the **Origin-hosted** repo, Settings → Apps → **Vercel**. Link the account so pushes deploy and PRs get previews. Reuse or replace `website-smoky-psi-51` so production tracks **Origin**, not GitHub.
2. **John:** Add `foleystrategicadvisory.com` and `www` in Vercel. Lower DNS TTL (e.g. 300s).
3. **John:** When Vercel shows the domain verified, replace GitHub Pages A/CNAME records with **the records Vercel displays that day**. Do not invent IPs.
4. Probe `https://foleystrategicadvisory.com/` until `server` is `Vercel` and `/api/health` returns `softHold: true`.
5. **John:** Disable the GitHub Pages custom domain. Delete or ignore the repo `CNAME` file. Do not leave Pages as a fallback host.
6. GitHub `foleysa/website` may remain as a frozen archive. It is not SoT and must not serve the domain.

Email SPF/DKIM is a separate DNS change (`docs/JOHN-UNLOCKS.md`). Soft HOLD: no live send.

## Mailer

`/api/*` runs on Vercel Node attached to Origin. Not on GitHub Pages. Not on Origin itself. File store is local/owned; Vercel disk is ephemeral — durable store is a John unlock. Do not commit emails.

Merge this mailer onto the **Origin** default branch after Vercel is the public host (or ship Subscribe only on the Vercel URL until then). Do not merge Beehiiv removal onto GitHub Pages as the live path.

## What this PR does vs does not

**Does:** lock the decision (Origin SoT, Pages off, Origin→Vercel destination); keep Soft HOLD; first-party mailer scaffolding.

**Does not:** claim the Origin namespace, detach GitHub, flip DNS, or send mail. Those are John unlocks.
