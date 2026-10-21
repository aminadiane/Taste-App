# Pallas roadmap

Living document. Update it at the end of every session: move items between sections, tick acceptance criteria, add bugs and decisions. Dates are absolute. Audit baseline: **2026-10-20, commit `027e2ca` on `main`** (in sync with `origin/main`, which Vercel serves).

Legend: **P0** must happen before further public exposure · **P1** next phase · **P2** later · **P3** exploratory.

---

## 1. Audit — what exists today

### Works

| Area | State |
|---|---|
| Home | Built and approved. Links to film and literature. |
| Film screen | Built and approved: TV photo with registered overlays, like swipe, dislike power-off, sequential loop through the library, counter, corner bar links. |
| Literature screen | Built and signed off: cover, opening, page turns (Previous / Next / arrows), dog-ear, tear-out with drag, torn stack, Close / Escape. |
| Quick-view drawer | Built on both screens: shelf of responded films (DVD spines, colours from the first still's palette) or books (paperback spines), A–Z ignoring The/A/An, drag-scroll with inertia; liked / disliked and dog-eared / torn-out tabs. |
| Votes | Like / dislike saved per still and per passage in `localStorage['pallas.votes']`, by stable id. Survives refresh and browser restart on the same device. |
| Cinema library | **89 stills across 35 films** (34 in the IMDb Top 250 as checked 2026-10-18; Sita Sings the Blues was removed, one more may need a rank check). Rights: 61 `cleared` (public domain / CC), 13 `studio-release` (Studio Ghibli's official stills), 15 `fair-use` (trailer frames). Every record has source URL, rights, palette, palette notes, lighting, composition, framing, camera and tags. All files present. |
| Literature content | **5 stand-in passages** (Gatsby, Mrs Dalloway, The Dead, The Awakening, The Sun Also Rises): public-domain 20th-century texts from the handoff, **none from the NYT 21st-century list**, no source or permission fields, one passage per book. |
| Docs | `README.md`, `library/PROPOSAL.md`, the design handoff, this file and `CLAUDE.md`. |

### Visual or partial only

- Book entries have `author / work / techniques` notes, but nothing uses them beyond display.
- Still metadata is **free text**, mixes observation with interpretation (e.g. tag "epic"), and has no controlled vocabulary, so it cannot yet drive analysis.
- The shelf groups by film but there is no film-level or passage-level page beyond the drawer.

### Does not exist

- **Skip and undo** (no data path and no approved UI).
- **Resume position**: both screens restart at the first item on every visit and re-present works already evaluated.
- Timestamps, sessions, "last engaged", encountered techniques, reflections.
- **Taste-analysis engine, Taste Profiles, Taste Journal, educational content, taste spectrum.**
- Export, reset or delete of saved data; any account system.
- Reduced-motion behaviour; designed touch behaviour for the book.
- Automated tests of any kind.

---

## 2. Completed

- [x] Site implemented from the Claude Design prototype, then renamed Pallas and rebuilt to the approved handoff (2026-10-17 → 2026-10-20).
- [x] Film screen to the approved revision; dislike power-off rebuilt and approved (2026-10-20, `5d9ecf9`).
- [x] Literature book, dog-ear and tear signed off (2026-10-20).
- [x] Quick-view drawer and shelves on both screens.
- [x] Per-still and per-passage votes in localStorage.
- [x] Cinema library to 89 stills / 35 films with documented rights; research in `library/PROPOSAL.md`.
- [x] Project in git, pushed to GitHub, deployed on Vercel.
- [x] `CLAUDE.md` and `ROADMAP.md` (this audit).

## 3. In progress

- Nothing is mid-implementation. A paused cinema sweep left tools, a rank-ordered list of the 216 remaining Top 250 films and a resume note (from the library session of 2026-10-20); locate and fold them into Priority A when resuming.

---

## 4. Next priorities

### P0 — Public-release compliance (live site)

These affect the site that is already public. Small in code, but each needs an owner decision (see §7).

1. **Attribution is not displayed.** The handoff design removed the credit line, so the CC BY-SA still (2001, Touring Club Italiano) is shown without its required attribution, and fair-use and Ghibli stills show no holder credit.
   *Accept when:* every still's required credit is reachable from the film screen in an approved design (for example in the quick-view caption or a credits page), and CC licences are named.
2. **Full-resolution originals are publicly served.** Vercel serves the repository root, so `library/originals/` (14 MB, including 15 non-cleared frames at up to 1920 px, above the 1280 px fair-use cap) and `design_handoff_pallas/` are downloadable.
   *Accept when:* originals and the handoff are excluded from the deployment (for example via `.vercelignore` or moving them out of the served tree) while staying in the repository; the live site still loads every display still.
3. **No takedown contact** is published, although the fair-use records state one is required before going public.
   *Accept when:* a contact route for rights holders is published in an approved place.
4. **Television photograph rights** (derived from a Toshiba product) are unconfirmed; treat as a public-release issue.

### P1-A — Persistent progress and resume (core requirement)

**Recommendation: one versioned, append-only event log in localStorage, behind a single `Pallas.store` module.** It is the simplest reliable option: no dependencies, synchronous, survives refresh and restart, already used by the app, and roughly 5 MB holds tens of thousands of events. Move to IndexedDB only if reflections or saved profiles outgrow it. An event log (rather than overwriting a map) gives undo, history, "last engaged", sessions, profile snapshots and future account sync with one structure.

Proposed document `localStorage['pallas.v1']`:

```js
{
  schema: 1,
  owner: { anonId: '<uuid>', createdAt, accountId: null },   // accountId filled when accounts arrive
  events: [                                                    // append-only; never rewritten
    { id: '<uuid>', t: '<ISO time>', area: 'cinema'|'literature',
      item: '<stillId|passageId>', work: '<filmSlug|bookSlug>',
      kind: 'like'|'dislike'|'skip'|'undo', undoes: '<eventId>'?, session: '<sessionId>' }
  ],
  sessions: [ { id, area, startedAt, endedAt?, completed: bool } ],
  cursors:  { cinema: { order: [...ids], pos }, literature: { order: [...ids], pos } },
  lastActive: { cinema: '<ISO>', literature: '<ISO>' },
  profiles: [ { id, area|'combined', createdAt, basedOnEventCount, findings: [...] } ],   // snapshots, never overwritten
  encountered: { '<techniqueId>': { first, count } },
  reflections: [ { id, t, area?, item?, text } ]
}
```

Current state per item = the latest non-undone event. Migrate `pallas.votes` into synthetic events once, then keep it read-only for one release. Unused legacy keys from earlier builds (`taste:deck`, `taste:still:*`, `taste.votes`) may be removed by the migration.

*Acceptance criteria (each with a manual or scripted test):*
- [ ] A like, dislike or skip is saved immediately after the action; no Save button.
- [ ] **Refresh:** after evaluating three stills and two passages, a refresh shows the same counts, shelf and drawer contents, and resumes at the next unevaluated item on each screen.
- [ ] **Restart:** the same holds after quitting and reopening the browser on the same device.
- [ ] **Independence:** cinema actions never change literature state or cursor, and vice versa.
- [ ] **No repeats:** evaluated works are not presented again unless the user explicitly chooses to revisit; when everything is evaluated, the screen says so in an approved way.
- [ ] **Undo** reverses the most recent action in that area without deleting history (the undo is itself an event).
- [ ] **New discovery session** starts a fresh pass without deleting earlier events or profiles.
- [ ] Earlier preferences and profile snapshots remain readable after new sessions.
- [ ] Migration from `pallas.votes` preserves every existing vote.
- [ ] Storage failures (private mode, quota) degrade to in-memory without errors.
- [ ] Documented in-app or in the privacy note: browser storage does not sync across devices and is lost if site data is cleared.

*Needs design before UI ships:* skip and undo controls on the TV and the book, the returning-user prompt ("continue / start a new session"), and the "all evaluated" state.

### P1-B — Cinematography metadata system (Priority B)

- Define a controlled vocabulary and schema with two blocks per still: `observed` (palette as hex plus hue/value/saturation relationships, key-light direction and quality, contrast range, shot scale, apparent camera height and angle, depth layers, texture/grain, composition devices) and `interpretation` (atmosphere, mood), each interpretation tagged as subjective.
- Migrate the 89 existing free-text records to the schema, preserving the originals as notes.
- *Accept when:* every still validates against the schema, observed fields use only vocabulary terms, no interpretive term appears in `observed`, and a validator script reports zero errors.
- Batch analysis with a vision model is deferred until cost is approved (§7).

### P1-C — Literature library foundation (Priority A)

- Schema for books and passages: book (NYT rank, title, author, year, publisher), passages (text, source URL, attribution, permission status, word count), and literary metadata (narrative voice, person and tense, prose style, sentence rhythm, pacing, imagery, tone, techniques), observation separated from interpretation as in cinema.
- Multiple passages per book; book-level shelf grouping, as films are.
- Source the first ~20 authentic passages from the NYT 100 Best Books of the 21st Century, preferring official publisher or authorised excerpts.
- *Accept when:* 20 passages from list titles load in the book, each with source, attribution and permission status recorded, and the five stand-ins are retired or clearly marked.

### P1-D — Preference tracking completeness (Priority C)

Likes, dislikes, skips and undo in both areas, using the approved interactions. Depends on P1-A and the skip/undo designs.

---

## 5. Future improvements

### P2 — Taste-analysis engine (Priority D)

A shared, area-agnostic module that reads the event log and the structured metadata.
- For each attribute value: exposure count, like and dislike counts, like rate versus the user's overall like rate, with a confidence measure that grows with exposure (for example a Beta–Binomial interval or a Wilson score on the difference). No arbitrary weights.
- Detect co-occurring preferred combinations and tensions (liked A, liked B, disliked A+B), only above a minimum evidence threshold.
- Every finding carries its evidence: the supporting and contradicting items, counts, and a strength label (tentative / emerging / well supported) derived from the statistics.
- *Accept when:* unit tests on synthetic event logs reproduce known patterns, report no finding below the threshold, and the same input always yields the same output.

### P2 — Taste Profiles (Priority E)

Taste signature, recurring liked and disliked characteristics, notable patterns, supporting examples, relevant techniques and concepts. Snapshots saved per P1-A. **Design in Claude Design first; no dashboard layouts.**
*Accept when:* every statement in a profile links to its evidence and strength, and the presentation matches an approved design.

### P2 — Taste development (Priority F)

Optional explanations of techniques, artists, movements and context; exposure to unfamiliar work. Written neutrally; never suggests reversing a dislike. Encountered techniques recorded per P1-A.

### P2 — Taste Journal (Priority G)

Revisit liked and disliked works, profile history, techniques encountered and personal reflections. Design first.

### P2 — Privacy and control

View saved activity, export (JSON), reset one category, delete everything. *Accept when:* each action works on a populated store and the deletion leaves no Pallas keys behind.

### P3 — Accounts and sync

Optional accounts so a user can sign in on several devices. Supabase Auth and Postgres are candidates; **discuss before adding any dependency or paid service.** The event log's uuids and `owner.accountId` allow a merge-on-sign-in without rewriting history.

### P3 — Taste spectrum (Priority H)

Mainstream vs niche, focused vs eclectic, unusual combinations. **No population-based scores until real comparative data exists**; until then only within-user measures (for example breadth of liked attributes).

### P3 — AI-generated interpretations

When appropriate and with controlled, approved costs; always labelled as interpretation.

### Deferred technical work

- [ ] Finalise Literature touch interactions for mobile (hover previews do not exist on touch; tap dog-ears or tears at once). *Needs decision.*
- [ ] Reduced-motion accessibility for the TV and the book. *Needs decision on fallbacks.*
- [ ] Higher-resolution book photography per `design_handoff_pallas/docs/Book photography brief.md`, keeping framing.
- [ ] Television photograph rights (P0 item 4).
- [ ] Safari and Firefox testing, especially CSS 3D, `backface-visibility` and `-webkit-mask-composite`.
- [ ] Responsive behaviour of the TV and the paperback on phones and tablets (known: tiny book text at .42× scale, crowded corner bars, 1.25cqw TV labels).
- [ ] Expand cinema to all 250 films and literature to all 100 books.
- [ ] Lazy-load stills: the film screen currently creates and loads all 89 images at start; this will not scale to 250 films × several stills.
- [ ] Automated checks: library schema validation, and a headless test of the vote/resume acceptance criteria.

---

## 6. Known bugs and limitations

| # | Issue | Severity |
|---|---|---|
| 1 | Required attribution not shown on the live site (P0-1) | High (licence compliance) |
| 2 | Full-resolution originals and handoff files publicly served (P0-2) | High |
| 3 | Both screens restart at item 1 on every visit and re-present evaluated works | High (core requirement) |
| 4 | No skip or undo | Medium |
| 5 | All stills load eagerly on the film screen | Medium (performance as library grows) |
| 6 | Only tested in Chromium | Medium |
| 7 | Stand-in literature content is not from the target list and has no source records | Medium |
| 8 | No reduced-motion support, no designed touch behaviour | Medium (accessibility) |
| 9 | Legacy keys from earlier builds (`taste:deck`, `taste:still:*`) linger in returning browsers | Low |
| 10 | One library film may lack a current IMDb rank; re-check the live chart | Low |

## 7. Blockers requiring the owner's decision

1. **Credits presentation (P0-1):** where attribution appears in the approved design (quick-view caption, a credits page, or a restored corner line). Needs a Claude Design pass if it is new UI.
2. **Originals and handoff on the public site (P0-2):** approve excluding them from the deployment.
3. **Takedown contact (P0-3):** which address or page.
4. **Television photo rights (P0-4).**
5. **Skip and undo controls, the returning-user prompt and the "all evaluated" state:** design in Claude Design.
6. **Literature rights posture:** publisher excerpts are promotional, not licensed for reuse. Apply the same fair-use posture as cinema, restrict to public-domain or openly licensed texts, or seek permissions.
7. **Vision-model batch analysis:** approve a provider and a spending cap before any paid call.
8. **Touch and reduced-motion fallbacks** for the TV and the book.
9. **Accounts:** whether and when to add Supabase or another service.
