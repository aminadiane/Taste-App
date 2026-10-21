# Interpretation layer

`js/taste/interpret.js` turns the engine's findings into prose that a person could read about their own taste. It is separate from the statistics: it reads an analysis result and never changes it, and it can be replaced (by better templates, or later by a reviewed AI writer) without touching the engine, as long as it keeps the output contract.

```js
interpret({ result, library, judgments, knowledge, titleOf })   // pure, deterministic
await Pallas.taste.interpretation(area)                          // in the browser, from saved progress; no interface yet
```

## Inputs and their roles

| Input | Source | Role |
|---|---|---|
| `result` | `analyse()` | The only source of claims about the person: findings, strengths, combinations. |
| `library`, `judgments` | features, store | Pick specific liked and disliked works to illustrate each claim, and compute within-characteristic comparisons. |
| `knowledge` | `library/vocab/qualities.json` | Craft knowledge: named qualities (chiaroscuro, closeness, restraint, and so on), the techniques that produce each, and a neutral explanation of how they work together. It describes techniques, never people. Without it, the layer still reports the findings plainly. |
| `titleOf` | caller | Display names for works. |

## What it writes

Sections, in order:

1. **Themes:** a quality is named when at least `min` of its techniques are emerging or well-supported findings in the same direction, or when a combination of two of its techniques is. A theme is not named if any of its techniques points the other way. Each theme gives the counts for every technique, with wording that follows each one's strength. It adds the craft explanation, up to three liked examples from different works, and up to two counter-examples: works on the other side that have one of the techniques but not the rest.
2. **Combinations** not covered by a quality are reported as the meeting of two characteristics, with counts together and apart.
3. **Findings** that no quality covers are reported plainly. Mirror images, such as clear air liked when visible atmosphere is disliked, are left out.
4. **Conditions:** within a well-supported liked characteristic, the second characteristic that most raises liking. It needs a Fisher test with Benjamini–Hochberg *q* < 0.1 across all candidates, and at least 3 works on each side. It is reported with a liked example and a disliked one, and omitted when it would only restate a theme.
5. **Strands:** two liked findings or combinations from different dimensions whose liked works overlap less than 15% are described as two separate tastes.
6. **Aversions:** a quality, or plain findings, in the disliked direction, worded without judgment.
7. **How sure this is:** early signs not already covered, characteristics that cannot yet be told apart, characteristics with too few examples, and the reminder that everything compares the person with themselves.

With insufficient, one-sided or patternless judgments, only the last section appears, saying why.

## Output contract

`pallas.interpretation/1`: `{ generator, basedOn, summary, sections: [{ id, kind, title, strength, text, claims: [{ statement, check, evidence: { liked, disliked } }] }] }`.

Every claim has a `check`, which states the numbers it rests on: `rates` (liked out of exposed for each characteristic), `joint` (a pair), `within` (counts with and without the second characteristic inside the first) or `overlap` (the two strands' liked works). `tests/fixtures/verify-interpretation.js` re-derives every check and every cited work from the judgments. A replacement writer must produce the same contract and pass the same verification.

## Tests

`tests/interpret.test.js` checks:

- Every claim for every simulated person holds against their judgments.
- Eclectic, too-short and insufficient histories get no claims, and random likes rarely produce a well-supported interpretation.
- Each real taste is illustrated with works from different films, with counts.
- Each hidden rule, or what the statistics can see of it, appears.
- Summaries are all different, and the average overlap of claimed characteristics between people is below 25%.
- Two unrelated tastes are described as two strands.
- Craft explanations come verbatim from the knowledge file.
- No sentence judges the person, and no artefacts or unfinished sentences appear.
- The statistics are never altered, and output is deterministic.

## Examples

`node tools/example-interpretations.js` writes 14 simulated people's interpretations, with their hidden rules and the verification result, to `docs/examples/interpretations/README.md`.

## Limitations

- The prose is templated. It is varied and specific, but it repeats its patterns, and an editor's or a model's pass could improve rhythm. Any such writer must keep to the contract and the checks.
- Qualities are only as good as the knowledge file. They are written as general craft descriptions, and their names (chiaroscuro, closeness) are editorial choices for the owner to review.
- When the library ties two characteristics together, the interpretation cannot separate them and says so.
- `profile.narrative()` (in `profile.js`) is the earlier, plainer reading built from a saved profile. The interpretation layer is the richer one, and the two can coexist.
