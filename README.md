# taste

Cultural Capital presents *taste* — an exploration of what moves you, and why.

Implemented from the Claude Design file `Taste.dc.html` as a static site: no build step, no framework.

## Files

- `index.html` — both screens: 01 Home and 02 Cinema (`#cinema`).
- `styles.css` — page styles; `ds/` holds the Cultural Capital design-system tokens it builds on.
- `app.js` — hash routing, the like/dislike set behaviour, and the drop-a-still slots.
- `assets/tv.webp` — the Philips set; `assets/tv-cap.png` — the silver button cap.
- `library/stills.json` — the cinematography library: films keyed by slug, one record per still with source, rights and cinematographic notes. Display copies live in `library/stills/<film>/`, untouched downloads in `library/originals/`. `library/PROPOSAL.md` records the research and rights findings.

## Run

Open `index.html` in a browser, or serve the folder:

```bash
node .claude/serve.js 8799
```

The television loads the library at start and cycles through its stills (full frame, letterboxed on the glass). A still dropped onto the screen replaces the library frame for that slot and is kept in the browser's local storage. With no library, six blank drop slots appear as in the prototype.
