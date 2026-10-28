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
| Book cover (cv.a only), photographic book, page turns, dog-ear (like), tear-out (dislike) | Signed off 2026-10-20; the torn stack and both corner counters were removed by update 2 |
| Update 2 (2026-10-27): home with the `cultural capital` link, the your-taste bar and the TV and book object links; the shelf (desktop rail, mobile mini shelf, fly-in); film on phones with the remote and tilt to vote; literature on phones as a single-page view; the Taste Profile "sorting table" (1b) and its empty state | Approved 2026-10-27; built on `feature/handoff-update-2` |

Design source of truth: `Claude Design Handoffs/design_handoff_pallas 2/UPDATE_2.md` and its `prototype/` (`Taste v2.dc.html`, `Taste Profile.dc.html`, `BookPage.dc.html`); `UPDATE_2.md` supersedes the first handoff's `README.md` wherever they differ, and that README still covers everything it does not mention. Where a later approval supersedes a handoff (the dislike sequence; the mobile book gestures below), the approval wins and is recorded in `ROADMAP.md`. Owner's decisions of 2026-10-27: the your-taste bar shows from the first response (the handoff said five); on phones the sideways swipes vote, and the earlier approved downward pull and edge tap stay as second ways to tear and to move between pages.

## Architecture

- **Static site, no build step, no framework, no package.json.** Plain HTML, CSS and JavaScript (IIFE modules on a `window.Pallas` namespace).
- `index.html` — four screens (`#home`, `#cinema`, `#literature`, `#taste`) plus the drawer and the shelf rail. Hash routing: `''` home, `#cinema` film, `#literature` literature, `#taste?m=film|lit` the Taste Profile. The visible label is "film" while the route stays `#cinema`.
- `styles.css` — all page styles. `ds/` — Cultural Capital design tokens (do not edit values).
- `app.js` — router, the Home screen's your-taste bar, and the Film screen (TV, like/dislike sequences, film quick view, the phone remote with tilt to vote).
- `js/book.js` — the Literature screen (660×520 book space, one scale transform, CSS 3D, WAAPI page turns, dog-ear, tear; the phone single-page view). `Pallas.book` exposes the entries and the flat page renderer to the profile screen.
- `js/shelf.js` — the shelf (`Pallas.shelf`): the desktop rail at 900 px and up with its closed tab, the mobile mini shelf below, and the fly-in after each response. Each screen registers a provider listing the works it has responses for; the rail's open state is memory only and re-opens on every entry to a screen.
- `js/taste-screen.js` — the Taste Profile screen (`#taste`), fed only by `Pallas.taste.profile()`: findings drawn to / away from with the engine's strength labels and counts, glossary terms, the works re-sorting into supports / contradicts bands, the examine overlay, the empty state. With responses but no finding yet it shows the engine's own summary sentence.
- `js/drawer.js` — the Drawer and shared shelf helpers. `js/store.js` — persistence (see below).
- `js/taste/` — the taste-analysis engine: `stats.js`, `features.js`, `analyse.js`, `profile.js`, and `index.js` (the browser facade, `Pallas.taste`). Pure and deterministic; see `docs/taste-engine.md`. No visible interface.
- `js/taste/interpret.js` — the interpretation layer: readable, grounded prose from findings, separate from the statistics, using craft knowledge in `library/vocab/qualities.json`. Every claim carries a check (`tests/fixtures/verify-interpretation.js`). See `docs/interpretation-layer.md`.
- `js/journal.js` — assembles Taste Journal data from the store (`Pallas.journal`). No visible interface. See `docs/journal-data.md`.
- Skip and undo handlers without controls: `Pallas.cinema` and `Pallas.literature` (`skip`, `undo`, `canUndo`, `busy`).
- `library/stills.json` — cinema library (films keyed by slug, one record per still). Display images in `library/stills/<slug>/NN.jpg`, untouched downloads in `library/originals/`.
- `docs/cinema-metadata-audit.md` — what the metadata audit found and corrected; retired terms are listed in the vocabulary's `retired` block.
- `library/cinema-metadata.json` — per-still metadata in three blocks: `measured` (from pixels, `node tools/measure-stills.js`), `observed` (from viewing, applied from `library/import/cinema-observed.txt` by `tools/apply-observations.js`) and `interpretation` (subjective). Validate with `node tools/validate-cinema.js`.
- `library/vocab/cinema.json`, `library/vocab/literature.json` — controlled vocabularies: every term, its definition, its basis (measured / observed / interpretation) and measurement thresholds. Never rename a published term.
- `library/literature.json` — books and passages, with sources, locators, notes, metadata, and vocabulary `features`. Validate with `node tools/validate-literature.js` (`--verbose` lists what each pending passage needs).
  - Research batches: `node tools/import-research.js <csv> [features.json]` adds pending records and never imports placeholders. Batches are kept in `library/import/research/`.
  - Passage text: `node tools/make-import-template.js`, paste, then `node tools/import-passages.js`. A passage goes live only when its info page is complete.
- `library/excerpts.json` — the handoff stand-ins, used only if no passage is ready, plus the paperback spine presets.
- `library/PROPOSAL.md` — research and sourcing notes for the cinema library. `library/review.html` — internal review tool.
- `assets/` — production photographs, textures and masks from the handoff.
- **Hosting:** GitHub `aminadiane/Taste-App`, deployed by Vercel from the repository root as static files. `main` is live.

### Persistence

`js/store.js` (`Pallas.store`) keeps an append-only event log in `localStorage['pallas.v1']`: likes, dislikes, skips and undo as events with timestamps and session ids, each area's cursor and last activity, plus reserved slots for profiles, encountered techniques and reflections, and a small `prefs` slot for interface preferences (which one-time hints have been seen). An item's judgment is its latest event that has not been undone. `Pallas.votes` is the read/write view the screens and drawer use. Never delete or rewrite events except through the explicit reset / delete functions. Browser storage does not sync between devices and is lost if site data is cleared; `owner.accountId` is reserved for future accounts. Profiles (snapshots, never overwritten) and reflections live in the same document.

### Checks

- `node --test tests/*.test.js`: the store, cinema metadata, the taste engine with simulated users, the journal, the interpretation layer, and the guard that mobile CSS never reaches desktop.
- `node tools/check-site.js --tests`: the pre-deploy check (there is no build step). It confirms every referenced file exists, every script parses, the data parses, the validators pass, and the tests pass.
- `node tools/stress-engine.js --seeds 100`: the engine stress test (`docs/engine-stress-report.md`). Re-run it after any change to `js/taste/analyse.js`, and change thresholds only when its results support it.
- `node tools/example-profiles.js` and `node tools/example-interpretations.js`: regenerate the examples in `docs/examples/`. The simulated people are in `tests/fixtures/personas.js`.

### Local preview

The app's preview runner cannot bind a port in this folder. Run from Bash:

```bash
PORT=8799 node .claude/serve.js
```

then open `http://127.0.0.1:8799/` (the built-in browser pane works). If that port is already held by a stale server from another folder (it answers "not found"), use another port. The pane throttles `requestAnimationFrame` and can freeze the document timeline, so verify animations with `document.getAnimations()` and paused `currentTime`, not with stopwatch screenshots.

### Mobile

Mobile styles live at the end of `styles.css`, each inside an `@media` or `@supports` block that desktop does not match. Breakpoints (update 2): `phone` is a viewport narrower than 640 px; the desktop shelf rail needs 900 px or more, and between the two the mini shelf is used with the desktop TV and book. Touch behaviour in `js/book.js` depends on the pointer type on tablets and desktops: a mouse click on a page dog-ears or tears it, as approved, while a finger needs a second tap (dog-ear) or a deliberate drag (tear). Keep both rules when changing either screen. On phones (`phone()` in `js/book.js`) the open book shows one page at a time, clipped and slid by a camera transform on the stage. Swiping left tears the passage out and swiping right dog-ears the notes page; the downward pull on the passage page also tears it; the scrub bar under the book, a tap on the page's outer edge, and the buttons move between pages; taps on the pages never vote. On phones the film screen shows the remote under the set: its buttons vote, and dragging it sideways past ±9° votes. Both one-time hints are remembered in the store's `prefs`. The earlier proposal is in `docs/proposals/mobile-book.md`; update 2 supersedes its framing.

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
- Taste findings come only from the engine's statistics. Any later AI-written interpretation goes in a profile's `interpretations` slot, cites the findings, and never replaces them.

## Working rules

- **Do not redesign.** Preserve the Cultural Capital branding, typography, the television, the paperback, approved interactions and animations, film assets and metadata, and the GitHub/Vercel setup.
- **The site is live from `main`.** Do significant work on a branch (Vercel builds preview deployments for branches). Do not push unfinished work to `main`, and do not redeploy or reconfigure Vercel unless asked.
- Commit the working version before substantial changes. End commit messages with the attribution line requested in the session.
- Inspect before assuming something is missing; do not rebuild working functionality.
- When a decision belongs to the owner (design, paid services), ask; record the outcome in `ROADMAP.md` or `README.md`.
