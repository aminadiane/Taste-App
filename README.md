# pallas

Cultural Capital presents *pallas* — an exploration of what moves you, and why. Previously *taste*.

Implemented from the Pallas design handoffs (`Claude Design Handoffs/`, kept as reference; update 2 of 27 October 2026 supersedes the first wherever they differ) as a static site: no build step, no framework.

## Files

The repository root is the Cultural Capital site (culturalcapital.world), implemented from its Claude Design export (`Claude Design Handoffs/design_handoff_cultural_capital_about/`, kept as reference):

- `index.html` — Home (`/`): the statement typed by scroll, then the works section (`#works`, N 001, Pallas). An inline script at the top forwards old Pallas links (`/#cinema`, `/#literature`, `/#taste…`) to `/works/pallas/`.
- `about/index.html` — About (`/about/`). `contact/index.html` — forwards to culturalcapital.studio (`/contact/`).
- `site/` — the site's styles and scripts (`site.css`, `site.js`, `home.js`, `about.js`) and `assets/pallas-tv.png`.
- `ds/` — the Cultural Capital design-system tokens, shared by the site and Pallas (`/ds/styles.css`).
- `vercel.json` — trailing slashes, and the redirects `/contact/` → culturalcapital.studio and `/works/` → `/#works` (there is no works page).

Pallas lives in `works/pallas/`, served at `/works/pallas/`. Paths below are inside `works/pallas/` unless they start at the root (`tests/`, `tools/`, `docs/`, `.claude/`).

- `index.html` — four screens: Home, Film (`#cinema`), Literature (`#literature`), Taste Profile (`#taste?m=film|lit`), plus the quick-view drawer and the shelf rail.
- `styles.css` — page styles; the root `ds/` holds the Cultural Capital design-system tokens they build on.
- `app.js` — hash routing and the Film screen: the television, like (channel-change swipe) and dislike (static, line, dot), the film quick view.
- `js/book.js` — the Literature screen: the photographic paperback, page turns, dog-ear (like) and tear-out (dislike), keyboard, and the one-page-at-a-time view on phones.
- `js/shelf.js` — the shelf: desktop rail, mobile mini shelf, and the fly-in of each response's spine.
- `js/taste-screen.js` — the Taste Profile ("the sorting table"), drawn entirely from the taste engine's findings.
- `js/drawer.js` — the quick-view drawer and its shelf helpers.
- `js/store.js` — persistent progress: an append-only event log in `localStorage['pallas.v1']` (likes, dislikes, skips, undo, sessions, each area's position), with `Pallas.votes` as the view the screens use. Earlier `pallas.votes` data is migrated once. Browser storage does not sync between devices and is lost if site data is cleared.
- `tests/` (at the root) — run with `node --test tests/*.test.js`; `node tools/check-site.js --tests` is the pre-deploy check.
- `library/stills.json` — the cinematography library: films keyed by slug, one record per still with source, rights and cinematographic notes. Display copies in `library/stills/<film>/`, downloads in `library/originals/`. `library/PROPOSAL.md` records the research and rights decisions.
- `library/excerpts.json` — literature entries (stand-ins from the handoff; replace with real content, keeping ids stable) and the paperback spine presets.
- `assets/` — the production assets from the handoff (television, book, paper and tear masks).

## Run

Serve the repository and open `http://127.0.0.1:8799/` for the site, or `http://127.0.0.1:8799/works/pallas/` for Pallas (the trailing slash matters: the app's paths are relative to it; `/works/pallas` redirects, locally and on Vercel through `vercel.json`):

```bash
PORT=8799 node .claude/serve.js
```

The television cycles through the library in order; the book cycles through the excerpts. Votes drive the shelf, liked/disliked and dog-eared/torn-out tabs of the quick view.

## Design status (27 October 2026)

Handoff update 2, approved by the creative director on 27 October 2026 and built on `feature/handoff-update-2`: the home with the `cultural capital` link, the your-taste bar (from the first response, by the owner's decision) and the TV and book as object links; the shelf (desktop rail, mobile mini shelf, fly-in on each response); the film screen on phones with the remote and tilt to vote; the literature screen on phones as a single-page view with a scrub bar, swipe-left tear and swipe-right dog-ear (the earlier downward pull and edge tap kept as second ways); and the Taste Profile sorting table with its empty state. The corner counters and the torn stack were removed. The homepage object photographs and the remote images need licensing or replacement before launch.

## Design status (20 October 2026)

Signed off by the director: home, film screen, quick-view drawer, book cover, and the photographic book with its dog-ear and tear interactions, as built from the Pallas handoff. The black band in the like swipe stays. The dislike power-off (one 340 ms collapse to a line and a point, then a fade-on by opacity and brightness) was approved on 20 October 2026; it supersedes the handoff's chained transitions. Still open, by the director's decision: touch behaviour, reduced motion, higher-resolution book photography, and the television photo rights.
