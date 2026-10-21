# Pallas roadmap

Living document. Update it at the end of every session: move items between sections, tick acceptance criteria, add bugs and decisions. Dates are absolute. Audit baseline: **2026-10-20, commit `027e2ca` on `main`** (the live site).

## Priorities (owner's order, 2026-10-20)

1. Persistent progress and resume
2. Literature library
3. Cinema metadata
4. Skip and undo (after the interactions are designed)
5. Taste-analysis engine
6. Personalized Taste Profiles
7. Taste development and Journal
8. Future expansion: complete the IMDb Top 250 and NYT Top 100, the Taste Spectrum, optional accounts

---

## Audit — what exists today (2026-10-20)

| Area | State |
|---|---|
| Home | Built and approved. |
| Film screen | Built and approved: TV with registered overlays, like swipe, dislike power-off, counter, corner bar links. |
| Literature screen | Built and signed off: cover, opening, page turns, dog-ear, tear-out with drag, torn stack, keyboard. |
| Quick-view drawer | Both screens: shelves of responded films / books, liked-disliked and dog-eared-torn-out tabs. |
| Votes | Like / dislike per still and per passage in `localStorage['pallas.votes']`, by stable id. |
| Cinema library | 89 stills across 35 films, each with source, attribution, palette, palette notes, lighting, composition, framing, camera and tags (free text). |
| Literature content | 5 stand-in passages from the handoff (Gatsby, Mrs Dalloway, The Dead, The Awakening, The Sun Also Rises); none from the NYT list; one passage per book. |
| Not built | Resume position, skip, undo, timestamps, sessions, analysis engine, Taste Profiles, Journal, educational content, export / reset / delete, accounts, reduced motion, designed touch behaviour, automated tests. |

## Completed

- [x] Site implemented from the Claude Design prototype, renamed Pallas and rebuilt to the approved handoff (2026-10-17 → 2026-10-20).
- [x] Film screen to the approved revision; dislike power-off rebuilt and approved (2026-10-20).
- [x] Literature book, dog-ear and tear signed off (2026-10-20).
- [x] Quick-view drawer and shelves on both screens.
- [x] Per-still and per-passage votes in localStorage.
- [x] Cinema library to 89 stills / 35 films.
- [x] GitHub and Vercel deployment.
- [x] `CLAUDE.md` and `ROADMAP.md`.
- [x] Five NYT passages live in the book (2026-10-21).
- [x] Cinema metadata for all 89 stills; taste engine; simulated-user tests; skip and undo data handling; Taste Profile and Journal data foundations (2026-10-21, `feature/pallas-overnight`, not merged).

## In progress

### 1. Persistent progress and resume — built 2026-10-20 on branch `feature/persistence`, awaiting merge to `main`

**Approach:** one versioned, append-only event log in `localStorage['pallas.v1']`, behind a single module `js/store.js` (`Pallas.store`). No dependencies; synchronous; survives refresh and restart; holds tens of thousands of events. IndexedDB only if reflections or saved profiles outgrow it. The existing `Pallas.votes` interface stays as a thin view over the store, so the approved screens and drawer keep working unchanged.

```js
{
  schema: 1,
  owner: { anonId: '<uuid>', createdAt, accountId: null },   // accountId reserved for future accounts
  events: [ { id, t, area: 'cinema'|'literature', item, work, kind: 'like'|'dislike'|'skip'|'undo', undoes?, session, migrated? } ],
  sessions: [ { id, area, startedAt, endedAt? } ],
  cursors:  { cinema: '<itemId>', literature: '<itemId>' },
  lastActive: { cinema, literature },
  profiles: [],       // Taste Profile snapshots, never overwritten (priority 6)
  encountered: {},    // techniqueId -> { first, count } (priority 7)
  reflections: []     // personal reflections (priority 7)
}
```

The current judgment of an item is its latest event that has not been undone. `pallas.votes` is migrated once into events marked `migrated: true` and left in place, read-only.

Browser storage does not synchronise between devices and is lost if site data is cleared; accounts (priority 8) address that.

*Acceptance criteria:*
- [x] Every like and dislike is saved immediately; no Save button.
- [x] **Refresh:** counts, shelves and drawer contents survive a refresh, and each screen resumes where it left off (tested in the pane on both screens).
- [x] **Restart:** the same holds after quitting and reopening the browser on the same device (localStorage persists across restarts; covered by the reload test; worth one manual check in your own browser).
- [x] **Independence:** cinema actions never change literature state or position, and vice versa.
- [x] **No repeats:** after a vote, the next work shown is one not yet evaluated; evaluated works return only when everything has been evaluated or the user explicitly revisits (Previous / Next in the book).
- [x] **History is preserved:** a new discovery session does not delete earlier events; re-votes are new events.
- [x] Migration from `pallas.votes` preserves every existing vote.
- [x] Storage failures (private mode, quota) fall back to memory without errors.
- [x] Store API supports skip, undo, new session, export, reset one area and delete everything, with tests (UI for these waits on designs).
- [x] Automated tests pass: `node --test tests/store.test.js` (13 tests).

*Waiting on design (Claude Design):* the returning-user prompt (continue / start a new session), and the state shown when every work has been evaluated. Until then the screens resume silently, and when everything is evaluated they continue in library order.

## Next

### 2. Literature library — started 2026-10-21 on branch `feature/literature`

Built: `library/literature.json` (version 2) with books keyed by slug, any number of passages per book, source and attribution fields, and literary metadata split into `observed` (narrative voice, person, tense, prose style, rhythm, pacing, imagery, techniques) and `interpretation` (tone). `js/book.js` loads every passage marked `ready`; until at least one is ready, the handoff stand-ins in `library/excerpts.json` keep the book working. Tested in the pane for both paths, including dog-ear votes saved by passage id and resume.

First batch: excerpts verified 2026-10-21 at their official or authorised sources (correcting the earlier note that none were found). Each record has the source URL, verified date, ISBN and edition, attribution, a locator (first and last words, chapter or page), info-page notes, and observed / interpretation metadata written from a reading of the passage.

| Book | NYT rank | Source | Status |
|---|---|---|---|
| My Brilliant Friend — Elena Ferrante, tr. Ann Goldstein | 1 | Diane Rehm Show, Scribd excerpt used with Europa's permission, p. 27 | ready |
| Wolf Hall — Hilary Mantel | 3 | Macmillan, Read Excerpt | ready |
| Austerlitz — W. G. Sebald, tr. Anthea Bell | 8 | Penguin Random House Canada excerpt | ready |
| Never Let Me Go — Kazuo Ishiguro | 9 | KCRW, excerpt supplied by Dial-A-Book | ready |
| Gilead — Marilynne Robinson | 10 | Macmillan, Read Excerpt | ready |

**Imported 2026-10-21:** the owner supplied the five texts; each was imported at its locator range (the pasted excerpts ran longer), with line-break artefacts in the My Brilliant Friend paste restored ("togo" to "to go" and similar). The validator reports 5 ready. Tested in the book: every excerpt and info page ends clear of its folio, Next cycles all five, a dog-ear vote saves by passage id, and the book resumes at the saved passage. The import file is reset to its blank template after each import.

**Shortened 2026-10-21 to keep the designed 14.5 px type** (owner's decision): each passage is a contiguous run of whole sentences that fits one page. My Brilliant Friend now starts at "I remember the violet light" (99 words). Wolf Hall ends at "is unraveling." (92). Austerlitz is the novel's first two sentences, ending "only by name." (80). Never Let Me Go ends at "a complete waste of space." (111). Gilead is unchanged (120). Locators and the technique notes that quoted removed lines were updated to match. The page holds about 115 words in one paragraph, less with paragraph breaks; measure before choosing a range. `fitExcerpts()` in `js/book.js` stays as a safety net and is a no-op for all five; it still scales the facing info notes slightly (0.88–0.96) where they run long.

**Batch import workflow** (built and tested 2026-10-21 with throwaway text, then reverted):
- `library/import/passages.txt` has one `=== <passage id> | <title> — <author> ===` block per passage, with the expected first and last words and the source as `#` comments.
- `node tools/import-passages.js [file]` matches each block by passage id or book title, checks that the text starts and ends at the locator (straight or curly quotes and dashes both accepted), and imports nothing if any block fails, printing the exact error. On success it writes the text, sets `status: ready`, keeps a `.bak`, and runs the validator.
- Empty blocks are skipped, so batches can be partial.

Scaling to 100 books: (1) add each book to `books` and its passages to `passages` with source, attribution, locator and metadata (status `needs-text`); (2) regenerate the template so it lists every `needs-text` passage; (3) paste texts in batches of any size and run the importer; (4) the validator enforces the schema and the book shows every ready passage. Several passages per book use ids `<book>-01`, `<book>-02`…; titles then no longer identify a single passage, so blocks must use the id.

**Second batch, 2026-10-21 (research by ChatGPT Work, 2026-10-20):** 20 more books integrated with `node tools/import-research.js library/import/research/pallas-literature-research.csv library/import/research/features-2026-10-20.json`. They are ranks 2, 4, 7, 13, 14, 15, 17, 18, 22, 23, 27, 28, 34, 37, 39, 49, 72, 78, 82 and 93; five are in translation. Each record has bibliography (original and first-English year, language, translator, genre), the verified excerpt URL and date, an attribution, anchors, section and retrieval boundaries, and Work's craft analysis (voice, prose style, rhythm, pacing, imagery, techniques, tone, craft explanation). Claude added vocabulary features mapped only from Work's descriptions, marked *provisional*. The research CSV and report are kept in `library/import/research/`.
- **All 20 are pending.** Work's import file contains placeholders only, with no passage text and no reuse permission established, and nothing from it was imported as literature. The book still shows the five ready passages, and no votes or progress changed.
- **To make one live:** paste its text into `library/import/passages.txt` (regenerate the template with `node tools/make-import-template.js`) and run `node tools/import-passages.js`. The importer refuses placeholder text. It saves real text but keeps the passage pending until it also has info-page notes (author, work), a note for each technique, the publisher, and a feature check against the text. The validator lists what each pending passage needs (`node tools/validate-literature.js --verbose`).
- Research anchors can sit slightly inside the passage (`startWithin` / `endWithin`), unlike the owner's exact locators.
- Duplicates are blocked by research id, book slug, and title with author; re-running the batch adds nothing. The validator also blocks duplicate NYT ranks.
- Vocabulary grew with a `form` dimension (novel, short story, literary nonfiction, testimony, poetry), a `testimony` narration, and 11 devices (prolepsis, analepsis, anaphora, simile, personification, irony, understatement, pastiche, montage, ekphrasis, delayed disclosure).
- Tests: `tests/literature-tools.test.js` runs on a temporary copy of the library.

*Accept when:* ~~the 5 passages above are `ready` and load in the book~~ (done 2026-10-21); then 20 passages; the stand-ins retired once list passages are live; ranks beyond the top ten checked against the NYT list.

### 3. Cinema metadata — built 2026-10-21 on `feature/pallas-overnight`

- **Vocabulary:** `library/vocab/cinema.json` defines every term with a definition (it doubles as the glossary). Each dimension has a basis: `measured` (computed from pixels), `observed` (seen in the image) or `interpretation` (subjective). Thresholds for measured terms live in the same file.
- **Measured** (`node tools/measure-stills.js`, free and deterministic with macOS `sips`): tonal key, contrast, saturation, toned print, colour temperature, dominant hues, tonal symmetry, surface detail, plus raw metrics and a five-colour palette. Letterbox bars are trimmed first. Re-run any time; it never touches observations.
- **Observed:** all 89 stills viewed one by one and recorded in `library/import/cinema-observed.txt` (light quality, key-light direction, apparent source, shot scale, angle, composition devices, depth of field, spatial layers, figures, setting). Applied with `node tools/apply-observations.js`, which rejects any term not in the vocabulary. "-" means the image does not show enough.
- **Interpretation:** atmosphere terms, marked `subjective: true`, stored apart from observation.
- Output: `library/cinema-metadata.json`, keyed by still id; the free-text notes in `stills.json` are unchanged.
- *Accept when:* ~~all 89 stills validate, observed fields use only vocabulary terms, no interpretive term in observed, validator reports zero errors~~ done: `node tools/validate-cinema.js` reports 89 observed, 0 errors; `tests/cinema-metadata.test.js`.
- **Audit 2026-10-21** (`docs/cinema-metadata-audit.md`): 16 stills re-examined at full resolution, with 10 unchanged and 6 fields corrected (light source or setting read from context rather than the image). Vocabulary version 2:
  - `focus: flat` is retired. Twelve stills are now undetermined for focus.
  - Measured symmetry is relabelled *tonal* symmetry.
  - `atmosphere: nostalgic` is retired, because it depended on period.
  - "Practical light" now requires a visible source.
  - A new observed `medium` dimension records live action or animation (13 animated stills).
  - Undetermined values are listed per still in `observed.undetermined`.
  - Extra dimensions go in `library/import/cinema-observed-extra.txt`.
  - Broad terms such as medium contrast (66 of 89) are documented. Changing the contrast cut-points is a question for the owner.
- Limitations: tonal symmetry measures mirrored brightness, not mirrored shapes, so dark, even frames can score high; the composition term "symmetrical" is the viewer's judgment. Observations were made from a 560-pixel copy, by Claude, in one pass; the owner may want to review a sample.

### 4. Skip and undo — data handling built 2026-10-21; controls wait on designs

- Store: `skip`, `undo` (steps back one judgment at a time, never deletes; an undone re-vote restores the earlier vote; an undone skip reopens the work) and `lastUndoable(area)` to tell a future control whether undo is available.
- Screens: `Pallas.cinema.skip() / .undo() / .canUndo() / .busy` and `Pallas.literature.skip() / .undo() / .canUndo() / .busy`. Both refuse while a sequence runs. Skip in the book turns the page like Next; undo returns to the restored still or passage, and the drawer counts, shelf and torn stack update from the votes.
- No visible controls were added. Undo and cinema skip cut directly, because no transition is designed for them.
- Book votes now record the book slug as the work; earlier events recorded the passage id, and the engine reads works from the library, so nothing breaks.
- Tested: store tests (skip, undo, re-vote, persistence across reloads) and in the pane: cinema skip and undo, undo after a like (refused while the like sequence ran), book skip with page turn, undo after a tear-out (passage restored, torn stack emptied). The pane's saved progress was backed up and restored.
- *Remaining:* designs for the controls and their transitions (Claude Design), then wire them to the functions above.

### 5. Taste-analysis engine — built and tested 2026-10-21; version 1.1.0 after stress testing

- `js/taste/` (stats, features, analyse, profile, index): one engine for both areas, deterministic, no LLM, no paid service. Method, assumptions and limitations: `docs/taste-engine.md`.
- Per characteristic: Fisher's exact test against the person's own likes and dislikes, Benjamini–Hochberg correction, Wilson interval. Strength labels (tentative, emerging, well supported) come from those numbers only. Well supported needs evidence from at least two films or books.
- Characteristics that always co-occur are reported together. Confounded findings are marked `explainedBy` the stronger one (Cochran–Mantel–Haenszel). Combinations must beat each part. Spread reads focused, mixed or broad. Reversed judgments are listed.
- Inputs are never modified. Every result records the engine version and thresholds, so profiles can be recalculated from the event log at any time.
- *Tests:* `tests/taste-engine.test.js` checks reference values for every statistic, agreement with direct counts, determinism, six simulated users, and false-discovery control (2 of 30 random users get a well-supported finding, the expected rate).
- **1.1.0 (stress-tested, `docs/engine-stress-report.md`):** `node tools/stress-engine.js` runs 16 scenarios × 100 simulated users. Changes made only where the numbers showed a weakness:
  - work-level and leave-one-film-out checks, so repeated stills from one film count once
  - a two-way confounding test that separates *explained by* from *goes together with*
  - combinations that must hold beyond the single findings and show an interaction (spurious combinations fell from up to 68% of users to 0–2%)
  - grouped terms (close shots, distant shots, off-level camera), lifting recovery of a rare preference from 3% to 78%
  - signatures built only from emerging and well-supported findings, with hedged wording
  - profiles record the vocabulary version, and `Pallas.taste.staleness(area)` says when to regenerate
- *Remaining:* real-user calibration once there is real data. Literature findings wait on more passages, since five cannot support any.

### 6. Personalized Taste Profiles — data foundation built 2026-10-21; screen waits on design

- Profile snapshot format `pallas.taste-profile/1` (`docs/taste-profile-format.md`): signature, preferred and disliked characteristics with evidence and statistics, combinations, confidence (`evidenceLevel` and per-finding strength), glossary terminology, limitations, an empty `interpretations` slot for later AI commentary, and `regeneratedFrom`.
- Store: `profiles(area)`, `latestProfile`, `deleteProfile`. Browser: `Pallas.taste.profile / snapshot / regenerate / lastChange`.
- **For review:** `docs/examples/taste-profiles/README.md` (regenerate with `node tools/example-profiles.js`).
- *Remaining:* the results screen (Claude Design), and owner review of the example wording.

### 7. Taste development and Journal — data foundation built 2026-10-21; screen waits on design

- `js/journal.js` builds `pallas.journal/1` from the store export and the libraries. It covers evaluated works with history, skips, reversed preferences, activity by month and session, techniques encountered, profile history and changes, and reflections. Reference: `docs/journal-data.md`.
- Store: reflections with edit history and delete; `resetArea` also clears that area's profiles and reflections; `encountered()` is reserved for explicit learning content.
- *Remaining:* Journal and educational-content designs; deciding which dimensions count as techniques (`TECHNIQUE_DIMENSIONS`).

### 8. Future expansion

- Complete the IMDb Top 250 (cinema) and the NYT 100 Best Books of the 21st Century (literature).
- Taste Spectrum: mainstream vs niche, focused vs eclectic, unusual combinations; no population-based scores without real comparative data.
- Optional accounts and cross-device sync (Supabase Auth and Postgres are candidates); discuss before adding any dependency or paid service. The event log's uuids and `owner.accountId` allow merging on sign-in.
- AI-generated interpretations with controlled, approved costs.

### Deferred technical work

- [ ] Literature touch interactions for mobile.
- [ ] Reduced-motion accessibility for the TV and the book.
- [ ] Higher-resolution book photography per the photography brief.
- [ ] Safari and Firefox testing, especially CSS 3D and `-webkit-mask-composite`.
- [ ] Responsive behaviour of the TV and the paperback on phones and tablets.
- [x] Lazy-load stills (2026-10-21): the current still, its neighbours and the next one load at once, and the rest load when the browser is idle. Tested in the pane: 3 requests at start instead of 89, both images of the like swipe fully loaded, all 89 loaded in the background.

## Known bugs and limitations

| # | Issue | Status |
|---|---|---|
| 1 | Both screens restart at item 1 and re-present evaluated works | Fixed on `feature/persistence` |
| 2 | No skip or undo controls (data handling done) | Waiting on designs |
| 3 | All stills load eagerly on the film screen | Fixed on `feature/pallas-overnight` |
| 4 | Only tested in Chromium | Deferred |
| 5 | Literature content is stand-in until list passages are supplied | Fixed on `feature/literature`: five NYT passages live |
| 6 | No reduced-motion support, no designed touch behaviour | Deferred |

## Overnight session 2026-10-21 (`feature/pallas-overnight`)

All work is committed on the branch. Nothing is merged to `main`, pushed or deployed. Checks: `node --test tests/*.test.js` (48 tests) and `node tools/check-site.js` (references, syntax, data, validators). A browser pass found the approved screens unchanged, with no console errors; the pane's saved progress was backed up and restored around each test.

**Continue tomorrow:**
1. Review `docs/examples/taste-profiles/README.md` and a sample of `library/import/cinema-observed.txt` against the stills.
2. Answer the questions below.
3. Merge `feature/pallas-overnight` when satisfied. The branch already contains `feature/literature`.

### Questions for Review

1. **Observed cinema metadata.** Claude recorded every still from a 560-pixel copy in one pass. Should the owner spot-check a sample, or should a second pass be made by another method?
2. **Atmosphere terms.** The engine counts them, marked subjective. Should profiles use interpretive terms at all, or only measured and observed ones?
3. **Wording of signatures.** The templates are "A clear / developing leaning towards …", "Early signs of …" and "Less drawn to …". Do they fit the voice, and do they avoid any hint that a dislike is a mistake?
4. **Thresholds.** The engine needs 8 judgments before anything is reported and 30 before a profile is "established". Strength labels use the conventional *q* < 0.05. Keep these?
5. **Techniques for the Journal.** Which dimensions count as craft techniques (`TECHNIQUE_DIMENSIONS` in `js/journal.js`)?
6. **Skip and undo controls.** These need designs, including whether skipping a still or undoing should have a transition (currently a direct cut).
7. **Literature register terms** (restrained, lyrical, experimental, ornamental) are interpretations recorded by Claude for the five passages. Keep the four terms?

## Overnight session, phase 2 (2026-10-21, `feature/pallas-overnight`)

All work is committed and pushed to the branch behind draft PR #1. Nothing is merged or deployed. Checks: `node tools/check-site.js --tests` (references, syntax, data, both validators, 64 tests).

| Milestone | Status |
|---|---|
| 1. Twenty researched books | Done. 25 literature records: 5 live, 20 pending text (Work's file held placeholders only). Importer, template generator, duplicate guards and tests are in place. |
| 2. Cinema metadata audit | Done. 16 stills re-examined, 6 fields corrected, vocabulary version 2 (two retired terms, clearer definitions, `medium` added, undetermined values recorded). `docs/cinema-metadata-audit.md` |
| 3. Engine stress test | Done. `tools/stress-engine.js`, `docs/engine-stress-report.md` |
| 4. Engine improvements | Done. Engine 1.1.0; also fixed a store and Journal bug where a skip could hide a vote. |
| 5. Example profiles | Done. Ten simulated people with hidden rules and draft interpretations: `docs/examples/taste-profiles/README.md` |
| 6. Readiness | Lazy-loaded stills, profile staleness check, and a site check that runs the tests. |

**Review first tomorrow:** `docs/examples/taste-profiles/README.md`, then `docs/engine-stress-report.md`.

**Questions added in phase 2:**
8. **Wording of the draft interpretation** (`profile.narrative`). It opens "Clearly, …" or "Possibly, …", then gives counts and examples, and adds "That is a description of your judgments, not a gap to correct" after dislikes. Does it fit Pallas's voice?
9. **Contrast cut-points.** Medium contrast covers 66 of 89 stills. Should the measured cut-points change? That would change what the terms mean.
10. **Combinations are now conservative.** A real two-characteristic taste is reported less often (28% in one test) in exchange for almost no spurious ones. Keep this balance?
11. **Info-page notes for the 20 pending passages** (author, work, technique notes). Should Claude draft them from the research for your approval, or will you supply them?
12. **Permission to display the 20 new passages.** Work's report says reuse permission was not established for any of them, so a decision is needed before their text is entered.

## Decisions pending

1. Designs for skip and undo, the returning-user prompt, and the all-evaluated state (Claude Design).
2. Vision-model provider and cost cap for metadata batch analysis.
3. Touch and reduced-motion fallbacks.
4. Whether and when to add accounts.
