# Pallas taste engine

The engine turns a person's likes and dislikes into evidence-based statements about their taste. It is deterministic, uses no language model and no paid service, and is shared by cinema and literature.

## Layers

| Layer | File | Role | Changes when |
|---|---|---|---|
| Judgments | `js/store.js` (`localStorage['pallas.v1']`) | The source of truth: append-only events (like, dislike, skip, undo). | The person acts. |
| Content metadata | `library/cinema-metadata.json`, `library/literature.json` | What each work is like, in vocabulary terms. | The library grows or is re-analysed. |
| Vocabulary | `library/vocab/cinema.json`, `library/vocab/literature.json` | Every term, its definition (the glossary), its basis, and the thresholds for measured terms. | New terms are added. |
| Features | `js/taste/features.js` | Reads metadata plus vocabulary into one shape: `items[id] = { work, features: ['dimension:value'] }`. | Never needs to change for new terms. |
| Statistics | `js/taste/stats.js` | Fisher's exact test, Wilson interval, Benjamini–Hochberg, Cochran–Mantel–Haenszel, entropy. | Rarely. |
| Analysis | `js/taste/analyse.js` | Pure function of judgments + features + options. Returns findings, combinations, spread and consistency. | The algorithm improves (bump `VERSION`). |
| Profiles | `js/taste/profile.js` | Builds a Taste Profile snapshot from an analysis; compares two snapshots. | Presentation of results changes. |
| Facade | `js/taste/index.js` | `Pallas.taste.profile(area)` computes a profile now; `Pallas.taste.snapshot(area)` also saves it via `store.addProfile`. | — |

Calculated results never overwrite inputs. A profile records the engine version, every threshold used and a digest of the judgments it was built from, so an improved engine can recompute every person's profile from their event log and the old snapshots stay in history.

## Method

For one area, take the person's current judgments (latest like or dislike per work; skips and undone votes are not judgments). Let *n* be the number of judged works and *L* the number liked.

**Single characteristics.** For each characteristic *f* (for example `key:low`), count the judged works with it (*n_f*) and the liked ones among them (*k_f*). The 2×2 table is liked/disliked × with/without *f*.

- Tested only when *n* ≥ 8, the person has both liked and disliked something, *n_f* ≥ 3 and at least 2 judged works lack *f*.
- *p*: two-sided Fisher's exact test (exact at any sample size).
- *q*: Benjamini–Hochberg adjustment across all characteristics tested for this person, because many are tested at once.
- Difference: like rate with *f* minus like rate without it. Interval: Wilson 95% interval for the like rate with *f*.
- Characteristics present in exactly the same judged works cannot be told apart and are reported as one finding with aliases.

**Strength labels** (from the statistics only):

| Label | Rule |
|---|---|
| tentative | *p* < 0.1, \|difference\| ≥ 0.25 and *q* < 0.5 |
| emerging | *q* < 0.2 |
| well supported | *q* < 0.05, *n_f* ≥ 6, and the supporting works come from at least 2 different films or books |

Anything that would be emerging or well supported but whose supporting examples all come from one film or book is capped at tentative, so one film's stills cannot create a finding about a characteristic.

Since 1.1.0, two checks address the fact that several stills from one film are not independent (see `engine-stress-report.md`):

- **Leave-one-work-out:** an emerging or well-supported finding must keep *p* < 0.05 with each supporting film's (or book's) items removed in turn. Otherwise it is tentative, with a note naming the film.
- **Work level:** within each work, its judged items with the characteristic form one unit and those without form another, each liked or disliked by majority (ties dropped). Well supported also requires a Fisher test across these units with *p* < 0.05, and emerging with *p* < 0.2. Otherwise the finding drops a level, with a note. Both values are reported as `leaveOneWorkOutP` and `workLevelP`.

**Confounding.** Characteristics travel together. Dark frames are often warm, for example. Findings are ordered from strongest to weakest. For each one, every stronger finding from a different dimension is held constant in turn with a Cochran–Mantel–Haenszel test, and then every pair of stronger findings together (four strata; since 1.1.0). If the association disappears (CMH *p* > 0.1), the finding is marked `explainedBy` the stronger one, or the pair. It stays in the results with a note, but it is not used in the signature or the evidence level.

**Grouped terms.** A vocabulary dimension can define `groups`, broader terms made of several values (close shots = medium close-up, close-up or extreme close-up). The feature step adds them automatically, so a preference spread across rare values can still be detected. A group present in exactly the same works as one of its members is reported as an alias.

**Combinations.** For pairs of tested characteristics from different dimensions that occur together in at least 4 judged works, the joint like rate is tested against everything else with Fisher's test. Benjamini–Hochberg is applied across all pairs. A pair is reported only when *q* < 0.1 and the joint like rate differs from each characteristic's own like rate by at least 0.2 in the same direction. A pair therefore has to be more than the sum of its parts.

**Spread (focused or eclectic).** For each dimension, the normalised Shannon entropy of the liked works' values is divided by that of all judged works' values. Below 0.6 means focused, above 0.9 means broad, and anything between is mixed. The overall figure is the mean across dimensions. It needs at least 5 likes.

**Consistency.** The analysis lists works whose judgment was later reversed (undone votes excluded), and films or books where some works were liked and others disliked. The second is common and expected, since works are judged one still or passage at a time.

**Evidence level of a profile.** `insufficient` (fewer than 8 judgments), `one-sided` (all liked or all disliked), `no-pattern`, `early` (tentative findings only), `developing` (at least one emerging or well-supported finding), or `established` (at least one well-supported finding not explained by another, after at least 30 judgments).

**Signature.** Up to three liked characteristics and two disliked ones, strongest first. A disliked value is left out when a liked value of the same dimension is at least as strong, because it is then usually the mirror image: low-key liked, mid-key disliked. Observed and measured characteristics come before interpreted ones, and explained findings are left out. The wording comes from fixed templates. Only emerging and well-supported findings are used: "A clear leaning towards …" for well-supported findings, "Early signs of a leaning towards …" for emerging ones, and "Less drawn to …" or "Possibly less drawn to …" for disliked ones. Tentative findings stay in the lists but never in the signature, because stress tests show they arise often by chance. The single strongest combination may be added. Nothing implies that a dislike is a mistake.

All thresholds are in `DEFAULTS` in `js/taste/analyse.js`. Any of them can be overridden per call (`options`), and each result records the values it used.

## Assumptions and limitations

- **Within-person only.** Findings compare a person's likes with their own dislikes in this library. They say nothing about other people, so there is no population baseline.
- **The library shapes what can be found.** A characteristic that is rare in the library, such as high key with 6 of 89 stills, can only be detected after many judgments. Characteristics that are confounded in the library can be separated only as far as the library varies them independently.
- **Metadata quality bounds the analysis.** Measured cinema terms come from pixels and are objective but crude. Tonal symmetry, for instance, measures mirrored brightness, not mirrored shapes. Observed terms were recorded by Claude from 560-pixel copies in one pass. Atmosphere, tone and register are interpretations and are flagged `subjective` wherever they appear.
- **Fixed thresholds.** Thresholds are conventional (*q* = 0.05, *p* = 0.05 and 0.2, at least 2 works), not tuned to Pallas data. In `engine-stress-report.md`, 0 to 3% of people with random likes get a well-supported finding, and 10% of people who like whole films at random do.
- **Independence.** The tests treat judgments as independent. Several stills from one film are not fully independent, which is why "well supported" needs evidence from at least 2 works.
- **Literature is small.** Five real passages cannot support findings yet. The literature tests use a synthetic corpus in `tests/fixtures/simulated-users.js`, which is clearly labelled and never shown to users.
- **Time.** All judgments count equally regardless of age. Taste development is described by comparing snapshots (`profile.compare`), not by weighting recent votes.

## Extending

- **New vocabulary term:** add it to the vocabulary file and use it in the metadata. No code changes are needed, and the validators enforce consistency.
- **New measured cinema term:** compute it in `tools/measure-stills.js`, add the dimension and threshold to the vocabulary, then re-run the tool.
- **Improved algorithm:** change `analyse.js`, bump `VERSION`, run `node --test tests/*.test.js`, then regenerate profiles from the stored events (`Pallas.taste.snapshot(area)`). Older snapshots remain.
- **AI interpretation (later, owner approval needed for any paid model):** write into the profile's `interpretations` array. Each entry should cite finding ids and the model used. It must never replace or alter the statistical findings.

## Example output

`node tools/example-profiles.js` writes the profiles of six simulated users to `docs/examples/taste-profiles/`, with a summary in its `README.md`. These are for reviewing the quality of the analysis before a results screen is designed.
