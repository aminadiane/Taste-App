# pallas

Cultural Capital presents *pallas* — an exploration of what moves you, and why. Previously *taste*.

Implemented from the Pallas design handoff (`design_handoff_pallas/`, kept as reference) as a static site: no build step, no framework.

## Files

- `index.html` — three screens: Home, Film (`#cinema`), Literature (`#literature`), plus the quick-view drawer.
- `styles.css` — page styles; `ds/` holds the Cultural Capital design-system tokens they build on.
- `app.js` — hash routing and the Film screen: the television, like (channel-change swipe) and dislike (static, line, dot), the film quick view.
- `js/book.js` — the Literature screen: the photographic paperback, page turns, dog-ear (like) and tear-out (dislike), the torn stack, keyboard.
- `js/drawer.js` — the quick-view drawer and the shelf.
- `js/store.js` — persistent progress: an append-only event log in `localStorage['pallas.v1']` (likes, dislikes, skips, undo, sessions, each area's position), with `Pallas.votes` as the view the screens use. Earlier `pallas.votes` data is migrated once. Browser storage does not sync between devices and is lost if site data is cleared.
- `tests/store.test.js` — run with `node --test tests/store.test.js`.
- `library/stills.json` — the cinematography library: films keyed by slug, one record per still with source, rights and cinematographic notes. Display copies in `library/stills/<film>/`, downloads in `library/originals/`. `library/PROPOSAL.md` records the research and rights decisions.
- `library/excerpts.json` — literature entries (stand-ins from the handoff; replace with real content, keeping ids stable) and the paperback spine presets.
- `assets/` — the production assets from the handoff (television, book, paper and tear masks).

## Run

Serve the folder and open it in a browser:

```bash
PORT=8799 node .claude/serve.js
```

The television cycles through the library in order; the book cycles through the excerpts. Votes drive the shelf, liked/disliked and dog-eared/torn-out tabs of the quick view.

## Design status (20 October 2026)

Signed off by the director: home, film screen, quick-view drawer, book cover, and the photographic book with its dog-ear and tear interactions, as built from the Pallas handoff. The black band in the like swipe stays. The dislike power-off (one 340 ms collapse to a line and a point, then a fade-on by opacity and brightness) was approved on 20 October 2026; it supersedes the handoff's chained transitions. Still open, by the director's decision: touch behaviour, reduced motion, higher-resolution book photography, and the television photo rights.
