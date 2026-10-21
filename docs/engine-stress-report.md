# Taste engine stress test — 2026-10-21

`node tools/stress-engine.js --seeds 100` runs 100 seeded simulated users through each of 16 scenarios. Every person judges all 89 stills (or the 60-passage synthetic literature corpus), except where a scenario uses fewer judgments. The table compares engine 1.0.0 (before) with 1.1.0 (after), using the same users and library.

- **Null:** choices with no relation to any characteristic. Every well-supported finding is false.
- **Film-loyal:** the person likes whole films chosen at random, with no aesthetic rule. Findings can be real coincidences in what those films share, but they rest on few films and many near-duplicate stills.
- **True:** choices follow a written rule on known characteristics. A finding counts as recovered when a rule characteristic is well supported. Another finding counts as false only if it is unrelated to the rule: not a mirror value of a rule dimension (mid-key disliked when low-key is liked), and not mostly co-occurring with the rule.

| Scenario | Kind | Any well supported | Any emerging or better | Real preference recovered | False well-supported findings | Any well-supported combination |
|---|---|---|---|---|---|---|
| random, likes half | null | 3% → 2% | 11% → 10% | — | 4/4 → 3/3 | 1% → 1% |
| random, likes 20% | null | 1% → 1% | 8% → 8% | — | 1/1 → 1/1 | 1% → 1% |
| random, likes 85% | null | 2% → 2% | 9% → 9% | — | 2/2 → 2/2 | 0% → 0% |
| random, 12 judgments | null | 0% → 0% | 2% → 1% | — | 0/0 → 0/0 | 0% → 0% |
| random, 25 judgments | null | 0% → 0% | 5% → 5% | — | 0/0 → 0/0 | 1% → 1% |
| random literature (60 synthetic) | null | 2% → 2% | 16% → 16% | — | 2/2 → 2/2 | 0% → 0% |
| likes 8 random films | film-loyal | 14% → 10% | 32% → 27% | — | 22/22 → 16/16 | 3% → 2% |
| likes 3 random films | film-loyal | 4% → 4% | 17% → 16% | — | 9/9 → 7/7 | 3% → 1% |
| warm low-key (strong rule) | true | 93% → 92% | 100% → 100% | 89% → 88% | 1/227 → 1/214 | 69% → 28% |
| bright symmetrical (strong rule) | true | 100% → 100% | 100% → 100% | 100% → 100% | 32/449 → 14/408 | 84% → 12% |
| hard light (moderate rule) | true | 62% → 61% | 80% → 80% | 62% → 61% | 7/110 → 4/103 | 7% → 2% |
| black and white (strong rule) | true | 100% → 100% | 100% → 100% | 99% → 98% | 0/282 → 0/267 | 63% → 2% |
| close shots (rare feature) | true | 43% → 81% | 78% → 94% | 3% → 78% | 12/81 → 10/133 | 12% → 0% |
| warm low-key, only 20 judgments | true | 4% → 4% | 18% → 16% | 2% → 2% | 0/6 → 0/6 | 2% → 1% |
| restrained prose (60 synthetic) | true | 100% → 100% | 100% → 100% | 100% → 95% | 4/203 → 4/161 | 52% → 0% |
| inconsistent warm low-key | true | 8% → 8% | 26% → 24% | 1% → 1% | 1/9 → 1/9 | 0% → 0% |

## What the review found

1. **Repeated stills from one film inflated the evidence.** The tests treated each still as independent, but stills from one film share lighting, palette and setting. People who liked eight random films got a "well supported" aesthetic finding 14% of the time. Fix: a **work-level check**. Within each film, the stills with and without a characteristic each become one unit, liked or disliked by majority. Well supported now also needs the association across these units (Fisher *p* < 0.05), and emerging needs *p* < 0.2. A **leave-one-film-out** check was added as well: an emerging or well-supported finding must keep *p* < 0.05 with any single film's stills removed. It caught little in these scenarios, but it explains clearly when a finding rests on one film.
2. **Correlated characteristics slipped through the confounding check.** One stronger finding was held constant at a time, but a rule on two characteristics, such as low key *and* warm colour, makes a third look meaningful when neither alone accounts for it. Fix: the Cochran–Mantel–Haenszel check now also holds **pairs** of stronger findings constant. For the bright, symmetrical users, false well-supported findings fell from 32 to 14.
3. **Rare characteristics could not be detected.** A real liking for close shots was recovered 3% of the time, because close-ups are split across three values with 2 to 6 stills each. Fix: vocabulary **groups** (close shots, distant shots, high or low camera). Recovery rose to 78%. Groups are data in the vocabulary, not code.
4. **Emerging findings appear without a real preference.** 8 to 16% of null users get at least one, as expected with *q* < 0.2 across about 100 characteristics. Fix: wording, not thresholds. Only emerging and well-supported findings reach the signature. Emerging ones read as "Early signs of a leaning towards …", and tentative ones never appear in the signature.
5. **The confounding check was one-directional.** When two characteristics overlap heavily, whichever came first "explained" the other, even when the data could not tell them apart. In one example profile, "lyrical prose" was absorbed by "short sentences". Fix: a two-way test. B is *explained by* A only if B disappears with A held constant while A survives with B held constant. If neither survives the other, B is marked *goes together with* A, and the draft interpretation says so.
6. **Combinations were mostly side effects.** When a person's taste rested on one characteristic, combinations of unrelated characteristics appeared anyway: 68% of black-and-white lovers got a well-supported one, such as eye-level with distant shots, because distant shots in this library are mostly in colour. Fix: a combination's *p* is now the largest of its plain test and its tests with each established finding from another dimension held constant. Each member must also matter among the works that have the other (*p* < 0.05). The false-discovery correction is applied to these values. Spurious combinations fell to 0 to 2%. The cost is that real two-characteristic tastes are found less often (28% for the warm low-key rule). When few works have both characteristics, one of them, or a third that stands for both, such as orange for warm low-key frames, can account for the likes just as well.
7. **A skip could hide a vote.** In the store and the Journal, skipping a still that had already been judged (possible once the library loops) made it read as skipped, so the vote vanished from the drawer and the analysis. Fix: a skip never overrides a like or dislike. This is covered by store and Journal tests.

## What held up without change

- **False discovery on null users:** 0 to 3% of users get any well-supported finding, at every like rate tested (20%, 50%, 85%).
- **Small samples:** with 12 or 25 random judgments nothing is well supported, and at most 5% get an emerging finding. With 20 judgments, even a real preference is rarely confirmed (2%), so a profile says it is early rather than overstating.
- **Strong real preferences** are recovered 88 to 100% of the time. A moderate one (hard light) is recovered 61% of the time.
- **Inconsistent people,** who follow their taste only 40% of the time, get no confident findings: 8% any well supported, 1% recovery. That is the honest outcome.
- **Library bias:** black and white is 46 of 89 stills and travels with period. A person who likes black and white gets that finding (98%), and its correlates are marked as explained by it rather than reported as separate tastes.

## Costs of the changes

- Combinations are conservative: a real pair is reported only when it clearly adds to the single findings.
- The work-level check is stricter. In one simulated profile, warmth that holds across stills but only marginally across films (work-level *p* = 0.056) is now *emerging* rather than *well supported*. Recovery of strong rules fell by about one point, and the restrained-prose rule from 100% to 95%.
- Thresholds were not tuned to these results. The new checks use the existing conventional levels (0.05 and 0.2).

## Remaining limitations

- People who like whole films still get a well-supported finding 10% of the time (4% when they like only three films). Some of these are genuine: the films they chose do share a look. The engine cannot tell taste in a film's look from loyalty to the film, and profiles say which works support each finding.
- Inconsistency is described through reversed votes and weak findings. The engine does not model a person's reliability.
- The literature results use a synthetic corpus. Real literature findings need far more than five ready passages.
