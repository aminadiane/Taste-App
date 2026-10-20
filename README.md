# pallas

Cultural Capital presents *pallas* — an exploration of what moves you, and why. Previously *taste*.

Implemented from the Pallas design handoff (`design_handoff_pallas/`, kept as reference) as a static site: no build step, no framework.

## Files

- `index.html` — three screens: Home, Film (`#cinema`), Literature (`#literature`), plus the quick-view drawer.
- `styles.css` — page styles; `ds/` holds the Cultural Capital design-system tokens they build on.
- `app.js` — hash routing and the Film screen: the television, like (channel-change swipe) and dislike (static, line, dot), the film quick view.
- `js/book.js` — the Literature screen: the photographic paperback, page turns, dog-ear (like) and tear-out (dislike), the torn stack, keyboard.
- `js/drawer.js` — the quick-view drawer and the shelf; `js/votes.js` — votes keyed by still and excerpt id in `localStorage['pallas.votes']`.
- `library/stills.json` — the cinematography library: films keyed by slug, one record per still with source, rights and cinematographic notes. Display copies in `library/stills/<film>/`, downloads in `library/originals/`. `library/PROPOSAL.md` records the research and rights decisions.
- `library/excerpts.json` — literature entries (stand-ins from the handoff; replace with real content, keeping ids stable) and the paperback spine presets.
- `assets/` — the production assets from the handoff (television, book, paper and tear masks).

## Run

Serve the folder and open it in a browser:

```bash
PORT=8799 node .claude/serve.js
```

The television cycles through the library in order; the book cycles through the excerpts. Votes drive the shelf, liked/disliked and dog-eared/torn-out tabs of the quick view.
