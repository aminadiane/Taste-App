# Cinema metadata audit — 2026-10-21

The audit asked whether the metadata for the 89 stills describes each image, or something else: the film's reputation, its period, or the measuring method. It covered the vocabulary definitions, how often each term is used, and a full-resolution re-examination of 16 stills chosen for variety. The sample spans black and white, colour, toned prints, animation, night, day, close-ups and extreme wides: `double-indemnity-02`, `metropolis-02`, `the-godfather-02`, `12-angry-men-02`, `bridge-on-the-river-kwai-02`, `mad-max-fury-road-02`, `in-the-mood-for-love-02`, `psycho-01`, `the-apartment-01`, `on-the-waterfront-02`, `the-general-02`, `vertigo-02`, `2001-a-space-odyssey-01`, `some-like-it-hot-01`, `my-neighbor-totoro-01` and `the-passion-of-joan-of-arc-02`. These stills are marked `audited` in `library/cinema-metadata.json`.

## Corrected classifications

| Still | Field | Was | Now | Why |
|---|---|---|---|---|
| 2001-a-space-odyssey-01 | light source | daylight | undetermined | One hard source is visible in its effect, not as a source. "Daylight" relied on knowing the scene is in space. |
| my-neighbor-totoro-01 | light source | practical | undetermined | No lamp is drawn in the frame. "Practical" requires a visible source. |
| in-the-mood-for-love-02 | light source | practical | artificial | The warm light comes from out of frame. No lamp is visible. |
| mad-max-fury-road-02 | key-light direction | back | undetermined | Headlamps and fire face the camera. Front or back cannot be decided. |
| metropolis-02 | setting | interior | undetermined | The staircase set does not show whether it is indoors or outdoors. |
| vertigo-02 | setting | exterior | undetermined | Flowers behind glass. The image does not show which side of the window the camera is on. |

The other ten audited stills matched their records. That is 10 of 16 with no change, and six corrected fields across 176 checked (16 stills × 11 observed fields). The errors fall into one pattern: a light source or setting taken from context rather than from what is visible. "Practical" and setting now carry stricter definitions.

## Definitions fixed

- **Depth of field mixed two ideas.** `focus: flat` described the scene (a wall behind the subject), not depth of field. The value is retired. The 12 stills that had it are now *undetermined* for focus, and their flatness is still recorded under spatial layers.
- **"Symmetrical" appeared twice with different meanings.** The measured term is tonal: the brightness of the two halves mirrors. It labelled *Bridge on the River Kwai* (dark jungle either side) and the *Mad Max* night frame as "strongly symmetrical", although neither composition is arranged symmetrically. Its labels are now "strong tonal symmetry", "partial tonal symmetry" and "tonal asymmetry", and its definition says it measures brightness only. Arranged symmetry stays with the observed composition term.
- **"Practical light"** now requires the source to be visible in the frame. **Figures** now explicitly includes human-like characters in animation.

## Overly subjective term retired

- **`atmosphere: nostalgic`** was removed from all 12 stills that had it. It depends on knowing that a film is old, which is reputation and period, not the image. The other atmosphere terms describe the image's mood and remain marked `subjective`.

## Missing characteristic added

- **`medium`** (live action or hand-drawn animation, observed). Thirteen stills from four films are animation, and nothing recorded it. Animation differs from photography in ways that confound other terms: flat colour, drawn light, smooth surfaces. A taste for animation would otherwise surface as "smooth detail" or "ambient light". It lives in `library/import/cinema-observed-extra.txt`, a new file for extra dimensions, so the vocabulary can grow without reshaping the main table.

## Uncertainty is now explicit

Each still's `observed.undetermined` lists the dimensions the image does not show; 20 stills have at least one. The engine never counts an undetermined dimension as evidence.

## Terms too broad to distinguish preferences

Each of these covers more than two thirds of the library, so liking or disliking it says little:

| Term | Stills | Note |
|---|---|---|
| contrast: medium (measured) | 66 of 89 | The cut-points (0.45 and 0.78 on the 5th-to-95th-percentile range) are fixed and absolute; most film stills fall between them. |
| light quality: soft | 61 | Hard light appears mainly in high-contrast black and white and desert exteriors. |
| angle: eye level | 59 | — |
| focus: deep | 59 | — |
| detail: moderate (measured) | 51 | Also influenced by scan grain and JPEG compression, not only by the scene. |

The engine already treats them correctly: a term present almost everywhere cannot reach significance. Whether to change the contrast cut-points is listed as a question for the owner, since it changes what the terms mean.

## Library composition the engine must account for

- **Black and white is 46 of 89 stills**, and every one predates 1962. Monochrome, neutral temperature, toned prints and some detail values therefore travel with period. A person who likes older films will show findings on these terms, and the engine reports them as related rather than independent.
- **Stills per film** range from 1 to 5, with most films at 2 or 3. Several stills from one film share lighting and palette, so the engine needs evidence from at least two films before a finding is well supported. The stress tests examine this further.
- **Unused terms:** purple and magenta hues, underlight, mixed light sources, overhead and canted angles. They stay in the vocabulary for future stills.

## Not changed

Measured values are computed from pixels and were re-run after the vocabulary change; their thresholds are unchanged. Free-text notes in `stills.json` are unchanged. Nothing was inferred from titles, directors or reputations. The observation that 13 stills are animated was made from the images when they were first viewed.

## Second pass — 2026-10-21 (vocabulary version 3)

Every one of the 89 stills was viewed again to record four new observed dimensions, and the existing values were checked against the image at the same time. No existing value needed correction in this pass. The 16 corrections from the first audit hold.

The vocabulary could say *that* a frame is low-key or warm, but not much about what light and air are doing in it, which is often what a viewer responds to. Version 3 adds:

| Dimension | Basis | Values (stills) |
|---|---|---|
| light pattern | observed | even 64, pools of light 14, glare 9, beams 4, rim 2, patterned shadow 2; group *shaped light* |
| atmospherics | observed | clear 67, smoke 10, mist 8, dust 4, rain 1; group *veiled air* |
| gaze | observed | face not visible 25, out of frame 20, averted 13, at the camera 7, within the frame 6; undetermined when no figure is shown |
| motion | observed | still 53, implied 34, blur 2 |
| colour harmony | measured | analogous 21, single-hue 15, contrasting 7; not recorded for monochrome |
| colour accent | measured | 7 stills with a small vivid area in a muted or dark frame |

Thresholds for the measured terms are in the vocabulary. Rare values are covered by the two groups so that preferences across them can still be detected.
