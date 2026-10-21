# Pallas — instructions for Claude Code

Read this file and `ROADMAP.md` at the start of every session. Update `ROADMAP.md` when work is completed, started, or newly discovered.

## What Pallas is

Pallas is an interactive cultural experience presented by **Cultural Capital**, a multidisciplinary studio (handbags and leather goods first, plus digital experiences, websites and events). It was called *Taste* during development; the repository is still `Taste-App`.

Pallas helps people **discover, understand, articulate and develop their aesthetic taste** in film and literature. Users respond to film stills on a hyperrealistic silver CRT television and to literary passages in a hyperrealistic vintage paperback. Over time Pallas will analyse those responses and help users describe their own preferences in their own vocabulary.

## Product principles — never violate these

1. **Pallas never tries to convince anyone to like something.** No copy, ordering, scoring or nudging may imply that a user should change a judgment.
2. **A dislike is a valid, informative judgment.** It never signals a lack of sophistication or understanding, and Pallas never encourages users to reverse it.
3. **Techniques are explained neutrally.** Describe what a work does and how; do not rank approaches as better or worse.
4. **Popularity, obscurity and critical acclaim are not measures of good taste.** The IMDb Top 250 and the NYT list are sources of works, not standards of value.
5. **Evidence, not invention.** Taste findings come from the user's own responses, account for how often each characteristic was encountered, and separate tentative observations from well-supported ones. No personality types, no arbitrary scores, no population comparisons without real comparative data.
6. **Observation is kept separate from interpretation** in all content metadata.
7. **Exposure is the goal.** Introduce unfamiliar approaches; never gatekeep.
8. **Collect as little personal information as possible.** Users own their data and must be able to view, export, reset and delete it.

## Design philosophy (approved)

- Hyperrealistic vintage objects (the CRT television, the 1950s–60s paperback) in stark white, minimal environments. Contemporary environment, nostalgic objects, tactile interactions.
- The Cultural Capital design system: near-monochrome interface, colour only from the works and the objects, Archivo with its width axis (wdth 100 / 112 / 125), plus Ultra, Gloock and Newsreader for the book. Lowercase sentence-fragment UI text; no uppercase, widely letter-spaced, monospaced headings (except where the approved design already uses small caps, e.g. Previous / Next / Close).
- No generic dashboard layouts, cards, charts-as-decoration, badges or gamification.
- **Any major new visual interface (Taste Profile, Journal, onboarding, skip/undo controls) is designed in Claude Design and approved before it is implemented.** Do not invent UI in code.

### Approved and signed off — do not change without explicit approval

| Area | Status |
|---|---|
| Home (`pallas`, "develop your taste in film / literature") | Approved |
| Film screen: TV photograph with % / `cqw` overlay system, cap buttons, cobalt nameplate, green "liked" / red "disliked" OSD | Approved |
| Like = channel-change swipe with the black band | Approved (band kept by decision) |
| Dislike = static → bright line → dot → black → next still fades on (one 340 ms WAAPI collapse) | Approved 2026-10-20 |
| Quick-view drawer (not "on the TV"), shelf of responded items A–Z, liked/disliked tabs | Approved |
| Book cover (cv.a only), photographic book, page turns, dog-ear (like), tear-out (dislike), torn stack | Signed off 2026-10-20 |

Design source of truth: `design_handoff_pallas/README.md` and `design_handoff_pallas/prototype/`. Where a later approval supersedes the handoff (the dislike sequence), the approval wins and is recorded in `README.md`.

## Architecture

- **Static site, no build step, no framework, no package.json.** Plain HTML, CSS and JavaScript (IIFE modules on a `window.Pallas` namespace).
- `index.html` — three screens (`#home`, `#cinema`, `#literature`) plus the drawer. Hash routing: `''` home, `#cinema` film, `#literature` literature. The visible label is "film" while the route stays `#cinema`.
- `styles.css` — all page styles. `ds/` — Cultural Capital design tokens (do not edit values).
- `app.js` — router and the Film screen (TV, like/dislike sequences, film quick view).
- `js/book.js` — the Literature screen (660×520 book space, one scale transform, CSS 3D, WAAPI page turns, dog-ear, tear).
- `js/drawer.js` — the Drawer and shared shelf helpers. `js/votes.js` — current persistence.
- `library/stills.json` — cinema library (films keyed by slug, one record per still). Display images in `library/stills/<slug>/NN.jpg`, untouched downloads in `library/originals/`.
- `library/excerpts.json` — literature entries (currently five stand-ins) and paperback spine presets.
- `library/PROPOSAL.md` — research and sourcing notes for the cinema library. `library/review.html` — internal review tool.
- `assets/` — production photographs, textures and masks from the handoff.
- **Hosting:** GitHub `aminadiane/Taste-App`, deployed by Vercel from the repository root as static files. `main` is live.

### Persistence

`js/store.js` (`Pallas.store`) keeps an append-only event log in `localStorage['pallas.v1']`: likes, dislikes, skips and undo as events with timestamps and session ids, each area's cursor and last activity, plus reserved slots for profiles, encountered techniques and reflections. An item's judgment is its latest event that has not been undone. `Pallas.votes` is the read/write view the screens and drawer use. Never delete or rewrite events except through the explicit reset / delete functions. Browser storage does not sync between devices and is lost if site data is cleared; `owner.accountId` is reserved for future accounts. Tests: `node --test tests/store.test.js`.

### Local preview

The app's preview runner cannot bind a port in this folder. Run from Bash:

```bash
PORT=8799 node .claude/serve.js
```

then open `http://127.0.0.1:8799/` (the built-in browser pane works). The pane throttles `requestAnimationFrame` and can freeze the document timeline, so verify animations with `document.getAnimations()` and paused `currentTime`, not with stopwatch screenshots.

## Fixed technical rules

- Keep the TV as a percentage / `cqw` overlay on its photograph and the book as one 660×520 space scaled by a single transform. Never re-derive positions.
- Ancestors of 3D layers must not get `overflow:hidden`, `filter` or `opacity < 1`.
- Use `-webkit-mask-*` and `-webkit-mask-composite: source-in` alongside standard masks.
- Lock TV and book input while a sequence runs; clean up timers, animations and noise when leaving a screen.
- Votes and all saved data are keyed by **stable** still, film and passage ids. Never key by array index. Never rename an id once published.

## Content rules

- Cinema: IMDb Top 250 titles only (check the live chart). Every still record carries `source.url`, `rights.status` and attribution, as the existing records do.
- **FilmGrab is reference only. Never download from it.** No TMDB content in the AI features without authorisation.
- Literature: target is the NYT 100 Best Books of the 21st Century; each passage records its source URL and attribution. Prefer official publisher or authorised excerpts.
- Each still and passage is analysed individually; never copy a general description of the film or book.
- No paid API usage (vision models, LLMs) without the owner's approval.

## Working rules

- **Do not redesign.** Preserve the Cultural Capital branding, typography, the television, the paperback, approved interactions and animations, film assets and metadata, and the GitHub/Vercel setup.
- **The site is live from `main`.** Do significant work on a branch (Vercel builds preview deployments for branches). Do not push unfinished work to `main`, and do not redeploy or reconfigure Vercel unless asked.
- Commit the working version before substantial changes. End commit messages with the attribution line requested in the session.
- Inspect before assuming something is missing; do not rebuild working functionality.
- When a decision belongs to the owner (design, paid services), ask; record the outcome in `ROADMAP.md` or `README.md`.
