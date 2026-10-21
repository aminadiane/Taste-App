# Taste Profile format (`pallas.taste-profile/1`)

A Taste Profile is a snapshot computed from a person's judgments by the taste engine (see `taste-engine.md`). It is plain JSON, stored with `Pallas.store.addProfile()` in `localStorage['pallas.v1'].profiles`. Snapshots are never overwritten. Examples are in `examples/taste-profiles/`.

| Field | Meaning |
|---|---|
| `schema`, `kind` | `pallas.taste-profile/1`, `taste-profile` |
| `id`, `createdAt`, `basedOnEventCount` | Added by the store when saved |
| `area` | `cinema` or `literature` |
| `generatedAt` | When the analysis ran |
| `engine` | `{ name, version }` of the engine that produced it |
| `options` | Every threshold used, so a result can be reproduced or compared |
| `basedOn` | `judged`, `likes`, `dislikes`, `likeRate`, `works`, `notInLibrary`, `eventCount`, `lastEventAt`, `judgmentsDigest` (hash of the exact judgments) |
| `evidenceLevel` | `insufficient`, `one-sided`, `no-pattern`, `early`, `developing` or `established` |
| `signature` | `summary` (a templated sentence or two), `terms` (feature keys used), `statements` (one per term, with its explanation and strength) |
| `preferred`, `disliked` | Findings. Each has `feature` (`dimension:value`), `label`, `basis` (`measured`, `observed` or `interpretation`), `subjective`, `aliases` (characteristics that always occurred with it), `strength` (`tentative`, `emerging`, `well supported`), `explainedBy` (a stronger finding that accounts for it, or null), `stats` (`exposed`, `likedWhenPresent`, `rateWhenPresent`, `rateWhenAbsent`, `difference`, `interval`, `p`, `q`), `explanation` (the counts in words), `notes`, `evidence` (`supporting` and `contradicting` item ids, `supportingWorks`) |
| `combinations` | Pairs whose joint like rate stands apart: `features`, `labels`, `direction`, `strength`, `stats`, `explanation`, `evidence` |
| `notYetClear` | Characteristics encountered too rarely to test, with counts |
| `spread` | `overall` ratio and `reading` (`focused`, `mixed`, `broad`), plus `byDimension` |
| `consistency` | `changedJudgments` (reversed votes) and `worksWithMixedJudgments` |
| `terminology` | Glossary entries for every characteristic mentioned: `term`, `label`, `definition`, `dimension`, `basis` |
| `interpretations` | Empty. Reserved for later AI-written commentary; each entry must cite finding keys and the model used |
| `limitations` | Plain statements of what the profile cannot say |
| `reading` | The interpretation of the same judgments (`pallas.interpretation/1`, see `interpretation-layer.md`), saved by `snapshot()` and `regenerate()`. It is kept apart from the statistics and tagged with its generator version. |
| `regeneratedFrom` | Set by `Pallas.taste.regenerate()`: the previous snapshot's id, engine and date |

**Browser API (no interface yet):** `await Pallas.taste.profile(area)` (compute only), `snapshot(area)` (compute and save), `regenerate(area)` (save a new snapshot after an engine or metadata change), `lastChange(area)` (what changed between the last two snapshots). For storage, use `Pallas.store.profiles(area)`, `latestProfile(area)` and `deleteProfile(id)`.
