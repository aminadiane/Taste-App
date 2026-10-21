# Taste Journal data (`pallas.journal/1`)

No Journal screen exists yet; it will be designed in Claude Design first. `js/journal.js` assembles everything the screen will need, as a pure function of the store's exported document and the content libraries. The Journal therefore needs no storage of its own, and it works the same with anonymous browser persistence or a future account.

```js
await Pallas.journal.current()   // in the browser
Pallas.journal.build({ doc: Pallas.store.exportData(), libraries: { cinema, literature }, compare })   // pure
```

For each area (`cinema`, `literature`):

| Field | Contents | Source |
|---|---|---|
| `works` | Every evaluated work: current judgment, first and last judged, times judged, whether it changed, full event history, whether it is still in the library | Events, undone ones excluded |
| `skipped` | Works currently passed over | Events |
| `preferenceChanges` | Each reversed judgment: from, to, when | Events |
| `timeline.byMonth`, `timeline.bySession` | Likes, dislikes, skips and undos per month and per session | Events and sessions |
| `techniques` | Craft characteristics of the works responded to (lighting, composition, shot scale, and so on for cinema; narration, syntax, diction, devices and so on for literature), with how many were liked, disliked or skipped, first encounter and definition | Events plus metadata and vocabulary |
| `profiles`, `profileChanges` | Saved Taste Profile snapshots in order, and what changed between consecutive ones | `store.profiles` and `Pallas.taste.profiles.compare` |
| `reflections` | The person's optional notes, with edit history | `store.reflections` |

The document also holds `owner` (anonymous id; `accountId` reserved), `reflectionsWithoutArea`, and `learning.encountered`, which is reserved for explicit educational content.

**User control** is already in the store: `exportData()`, `resetArea(area)` (also clears that area's profiles and reflections), `deleteAll()`, `deleteProfile(id)`, `editReflection(id, text)` and `deleteReflection(id)`.

**Which dimensions count as techniques** is set in `TECHNIQUE_DIMENSIONS` in `js/journal.js`. That is an editorial choice the owner may want to adjust.
