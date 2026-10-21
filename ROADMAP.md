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

## In progress

### 1. Persistent progress and resume — started 2026-10-20 on branch `feature/persistence`

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
- [ ] Every like and dislike is saved immediately; no Save button.
- [ ] **Refresh:** counts, shelves and drawer contents survive a refresh, and each screen resumes where it left off.
- [ ] **Restart:** the same holds after quitting and reopening the browser on the same device.
- [ ] **Independence:** cinema actions never change literature state or position, and vice versa.
- [ ] **No repeats:** after a vote, the next work shown is one not yet evaluated; evaluated works return only when everything has been evaluated or the user explicitly revisits (Previous / Next in the book).
- [ ] **History is preserved:** a new discovery session does not delete earlier events; re-votes are new events.
- [ ] Migration from `pallas.votes` preserves every existing vote.
- [ ] Storage failures (private mode, quota) fall back to memory without errors.
- [ ] Store API supports skip, undo, new session, export, reset one area and delete everything, with tests (UI for these waits on designs).
- [ ] Automated tests in `tests/` pass with `node --test`.

*Waiting on design (Claude Design):* the returning-user prompt (continue / start a new session), and the state shown when every work has been evaluated. Until then the screens resume silently, and when everything is evaluated they continue in library order.

## Next

### 2. Literature library

- Schema for books and passages: book (NYT rank, title, author, year, publisher) and passages (text, source URL, attribution, word count), with literary metadata: narrative voice, person and tense, prose style, rhythm, pacing, imagery, tone and techniques, observation separated from interpretation.
- Multiple passages per book; shelf grouping by book, as films are.
- First ~20 authentic passages from the NYT 100 Best Books of the 21st Century, preferring official publisher or authorised excerpts.
- *Accept when:* 20 passages from list titles load in the book with source and attribution recorded, ids are stable, and the five stand-ins are retired or marked as stand-ins.

### 3. Cinema metadata

- A controlled vocabulary with two blocks per still: `observed` (colour palette as hex plus hue / value / saturation relationships; key-light direction and quality; contrast range; shot scale; apparent camera height and angle; depth and spatial layers; texture and grain; composition devices) and `interpretation` (atmosphere, mood), the latter marked subjective.
- Each still analysed individually, never from a general description of the film. Existing free-text notes kept as notes.
- *Accept when:* all 89 stills validate against the schema, observed fields use only vocabulary terms, no interpretive term appears in `observed`, and a validator script reports zero errors.
- Batch analysis with a vision model only after the owner approves a provider and a cost cap.

### 4. Skip and undo

- Store support lands with priority 1. Controls on the TV and the book are designed in Claude Design first, then built with the approved interactions.
- *Accept when:* skip and undo work in both areas, undo reverses the most recent action without deleting history, and skipped works return in a later session.

### 5. Taste-analysis engine

- Shared, area-agnostic module reading the event log and structured metadata.
- Per attribute value: exposure count, likes, dislikes, like rate against the user's overall like rate, with a confidence interval that narrows with exposure (Beta–Binomial or Wilson). No arbitrary weights.
- Combinations and tensions only above a minimum evidence threshold.
- Every finding lists supporting and contradicting items, counts and a strength label (tentative / emerging / well supported) derived from the statistics.
- *Accept when:* tests on synthetic logs reproduce known patterns, produce no finding below threshold, and are deterministic.

### 6. Personalized Taste Profiles

- Taste signature, recurring liked and disliked characteristics, notable patterns, supporting examples, relevant techniques and concepts; snapshots stored in `profiles`.
- Designed in Claude Design first; no dashboard layouts.
- *Accept when:* every statement links to its evidence and strength, and the presentation matches an approved design.

### 7. Taste development and Journal

- Optional, neutral explanations of techniques, artists, movements and context; exposure to unfamiliar work; never suggests reversing a dislike. Encountered techniques recorded in `encountered`.
- Journal: liked and disliked works, profile history, techniques encountered, personal reflections. Designed first.
- User control: view saved activity, export, reset a category, delete all.

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
- [ ] Lazy-load stills; the film screen loads all images at start.

## Known bugs and limitations

| # | Issue | Status |
|---|---|---|
| 1 | Both screens restart at item 1 and re-present evaluated works | Fixing in priority 1 |
| 2 | No skip or undo | Priority 4 |
| 3 | All stills load eagerly on the film screen | Deferred |
| 4 | Only tested in Chromium | Deferred |
| 5 | Literature content is stand-in | Priority 2 |
| 6 | No reduced-motion support, no designed touch behaviour | Deferred |

## Decisions pending

1. Designs for skip and undo, the returning-user prompt, and the all-evaluated state (Claude Design).
2. Vision-model provider and cost cap for metadata batch analysis.
3. Touch and reduced-motion fallbacks.
4. Whether and when to add accounts.
