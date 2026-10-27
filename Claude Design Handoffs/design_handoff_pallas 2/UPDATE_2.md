# Pallas — Handoff update 2

This update supersedes `README.md` wherever the two differ. Everything in `README.md` that is not mentioned here (TV overlay system, like/dislike TV sequences, book coordinate space, opening, page turn, dog-ear, tear, quick-view drawer, tokens) still applies.

**Source of truth for this update:** `prototype/Taste v2.dc.html` (Home, Film, Literature, shelf), `prototype/Taste Profile.dc.html` (taste profile), `prototype/BookPage.dc.html` (page component). `prototype/Pallas Mobile.dc.html` is a review board that frames `Taste v2` at phone size; it is not a screen to build. `prototype/Taste.dc.html` is the previous version, kept for diffing only.

These are HTML design references. Recreate them in the existing codebase's framework and patterns; do not ship the HTML.

## Approval status

Approved by the creative director (27 Oct 2026): Home, Film (desktop and mobile with remote), Literature (desktop and mobile single-page view), the shelf (desktop rail, mobile mini shelf, fly-in), the Taste Profile **"sorting table"** concept (`1b`) and its empty state.

Do **not** build:
- Taste Profile concept `1a` "the reading" (rejected alternative; lives in the same file).
- The "turn 1 — taste profile, two approaches" review header and canvas wrapper in `Taste Profile.dc.html`.
- The 70s cover variant (`cv.c`), the torn-page stack (`stackOn: false`), the corner counters `still 01 / 06` and `excerpt 01 / 05` (removed), the TV menu quick-view (`tvArc`, superseded by the drawer).
- Tweak props (`profileLink`, `previewEmpty`, `homeLinkPosition`): design-review switches only. Ship the defaults listed below.

## Breakpoints

- `phone`: viewport `< 640px`
- `rail`: viewport `>= 900px` (desktop shelf column). Between 640 and 899 the mobile mini shelf is used with the desktop book/TV layout.

## Home (changes)

Order, top to bottom, centred column:
1. `cultural capital` — now a link to `https://culturalcapital.world` (new tab). Cobalt, Archivo wdth 125, 600, `clamp(17px,1.35vw,21px)`, −0.02em. Hover: underline 1.5px, offset 4px. Below it `presents` in ink, wdth 112, 500, `clamp(10px,.8vw,12px)`.
2. `pallas` title (unchanged).
3. Tagline (unchanged).
4. **Your-taste bar** (new). Only when the user has ≥ 5 responses in either medium. A single link row, `max-width:420px`, `margin-top:40px`, `padding-bottom:18px`, 1px `--rule` bottom border. Left: `your taste`, cobalt, Archivo wdth 125, 600, 22px, −0.03em. Right: `from N responses` (singular for 1), graphite, wdth 112, 500, 13px. Press: opacity .6.
5. `develop your taste in` — the word **taste** is bold (700, ink) and is a link to the taste profile. It is always a link; with no responses the profile shows its empty state.
6. Object links (new): TV photo above `film`, paperback photo above `literature`. Both the image and the word link to the screen.
   - Desktop (≥ 640): side by side, `align-items:flex-end`, gap `clamp(56px,7vw,128px)`, image height `clamp(150px,30vh,320px)`.
   - Phone: stacked (TV then book), gap 56px, image height `min(60vw,260px)`; page scrolls.
   - Image → label gap `clamp(8px,1.8vh,30px)`.
   - Grounding: an elliptical contact shadow under each object (`radial-gradient(closest-side, rgba(20,18,15,.26), transparent)`, 2px blur; TV inset 6% sides, 12px tall, −5px bottom; book inset 4%, 10px tall, −4px bottom) plus `drop-shadow(0 2px 2px rgba(0,0,0,.14–.16)) drop-shadow(0 10px 14px rgba(0,0,0,.10))`.

Profile link target: `Taste Profile?m=lit` when literature responses outnumber film, else `?m=film`.

## Film (changes)

- Corner counter `still 01 / 06` removed.
- **Phone remote** (`< 640`, below the TV, centred). Assets `remote-body.png` (246×893 design px), `remote-power.png` (dislike), `remote-green.png` (like). Scale `min(.6, vw*.36/246)`; top = `72 + tvH + 56` where `tvW = min(vw*.92, (vh-160)*1.107, 880)`, `tvH = tvW*1400/1550`. It runs off the bottom of the screen on purpose.
  - Buttons side by side in design px: dislike at (54,201) 53×42, like at (129,199) 47×46; labels `dislike` / `like` at top 254, Archivo wdth 112, 600, 16px, #3d3d3c; `cultural capital` cobalt wdth 125, 600, 22px at top 400. Press: translateY(1.5px), brightness .86, 70ms. Enlarged tap areas (see `style-before` insets in source).
  - **Tilt to vote:** dragging the remote horizontally rotates it about `50% 115%`, `deg = clamp(dx/7, −13, 13)` (starts after 8px). Release at ≤ −9° = dislike, ≥ 9° = like; it springs back over 560ms `cubic-bezier(.2,.7,.1,1)`. A tap that followed a drag must not also fire a button.
  - **One-time hint** on first phone visit to Film: after 900ms tilt to −10° (hold 1100ms), 0° (500ms), +10° (1100ms), 0°. Cancelled if the user starts dragging.
- Phone: the shelf row sits centred under the TV at top `72 + tvH + 18`.

## Literature (changes)

Desktop:
- Torn-page stack and `excerpt 01 / 05` counter removed.
- The closed cover opens the book on click anywhere. While closed, the page hit areas underneath must have `pointer-events:none` (they were swallowing cover clicks). Cover cursor: pointer.

Phone (`< 640`) — single-page view:
- The open book shows one page at a time at scale `min(1.6, (vw−16)/330, (vh−230)/520)`; the stage is clipped and translated: cover `−165`, passage `0`, notes `−330` (book px × scale), 520ms `cubic-bezier(.2,.7,.1,1)`.
- **Scrub bar** directly under the book: 24px hit area, 1px `--rule` track, a 3px ink thumb half the track's width at left 0% (passage) or 50% (notes). Drag or tap to move between passage and notes; it snaps to the nearer side on release. `role="scrollbar"`.
- **Swipes** on either page (vertical swipes ignored; axis locks after 10px):
  - Left = tear out. The passage tears from the top following the finger; past 60px it commits, otherwise it springs back (320ms). Starting from the notes page slides to the passage first.
  - Right = dog-ear. The notes page's corner folds with the finger (`fold = clamp(dx/140, 0, 1)` of the hover preview); past 70px it commits and the page turns. Releasing early unfolds and returns to the page the swipe started on.
  - Taps on pages do not vote on phones.
- Controls: `tear out` (left) and `dog-ear` (right) links, each with a stone 12px caption `or swipe left` / `or swipe right`; below, centred, `Previous` and `Next`. Button presses first slide to the right page (540ms) then act.
- **One-time swipe hint** after the first passage appears (500ms delay): the page nudges `translateX(−26px) rotate(−1.2deg)` and back (900ms, `cubic-bezier(.45,.05,.2,1)`) while `or swipe left` is full opacity and the other dims to .3; pause 250ms; same to the right; after 700ms both captions fade (500ms) and collapse (`max-height` 500ms, 300ms delay).

## Shelf (new — both screens)

Shows only works the user has responded to, A–Z ignoring a leading The/A/An. Every response adds the work; disliked/torn-out works stay but render at opacity .45. Re-voting an existing work replays the fly-in.

**Desktop rail (≥ 900px)**
- Fixed column on the right, 208px, white, 1px `--rule` left border, full height. **Open by default on every entry to Film or Literature** (re-opens on screen change); empty before the first response with the caption `responses collect here` (stone, 12px).
- Main content gets `padding-right: calc(208px + var(--edge))` and re-centres (320ms ease-out). The TV width becomes `min(calc(92vw − 208px), …)`; the book scale uses `vw − 208`. Fixed right-edge UI (book `Close`) shifts to `calc(208px + var(--edge))`.
- Header: count (`3 films` / `1 book`) left, `close shelf` link right. Filter row: `all` · `liked N` · `disliked N` (literature: `dog-eared N` · `torn out N`); active = ink + 1px underline offset 4px, inactive = stone, 12px. Any new vote resets the filter to `all`.
- Spines stand upright on rows 168px wide, 2px apart; a row wraps when full; each row has a 1px graphite shelf line under it; rows 22px apart; the list scrolls.
  - Film spine: 15×118px, film `bg`/`fg`, vertical title (Archivo 9px 600) and year (8px).
  - Book spine: width `max(14, round(w*.72))`, height `round(h/300*132)` from `BOOKSPINE`; Newsreader title, author surname.
  - Inset edge shading: `inset 0 0 0 1px rgba(0,0,0,.08), inset 1px 0 0 rgba(255,255,255,.16), inset -1px 0 0 rgba(0,0,0,.22)`. Hover brightness 1.08. Click opens the quick-view drawer on the shelf tab with that work selected.
- Closed: a vertical `shelf (N)` tab on the right edge, vertically centred, white, 1px `--rule` border without the right side, 20px 9px padding. Click re-opens.

**Mobile mini shelf (< 900px)**
- Replaces the old `shelf — liked — disliked` counter. One link row, `min(100vw − 2·edge, 420px)` wide, ≥ 44px tall: a strip of thin upright spines on a 1px graphite line (film 8×34px; book `max(7, w*.3)` × `24 + h/300*12`; 2px gaps; up to 30, clipped), then `your shelf` + count in stone. Tap opens the shelf drawer.
- Film: centred under the TV. Literature: bottom-left (`position:fixed` on 640–899, in flow on phones).

**Fly-in on each response**
- The new spine's slot starts collapsed (width 0). After the screen's own animation (Film like 1450ms, Film dislike 1900ms — while the screen is dark, Literature 1300ms), the slot opens (width 360ms `cubic-bezier(.2,.7,.1,1)`, neighbours slide apart) and a copy of the spine flies from the centre of the TV screen or the book to the slot:
  - 820ms, `cubic-bezier(.45,0,.2,1)`, keyframes: fade in at source (0 → 10%), arc 70px above the straight path at 55% (40px on mobile), land at the slot; soft shadow `0 8px 18px rgba(0,0,0,.14)` while airborne.
  - Desktop rail open: flies at the spine's real size. Rail closed: flies into the `shelf (N)` tab, shrinking to .4 and fading out. Mobile: starts as a 12×44 upright spine and shrinks into the sliver.
  - On landing, the real spine fades in (200ms) and the flying copy is removed.
  - `prefers-reduced-motion`: no flight; the spine just appears.

## Taste Profile — "sorting table" (new, `1b`)

Desktop composition is a 1440×960 artboard in the source; implement it fluid.
- Top bar: `pallas` back link (left), `film — literature` medium switch (right; active = ink). Opens on the medium from the `?m=` query.
- Left column (404px from 28px): `your taste in film|literature` (Archivo wdth 125, 600, 40px, −0.04em); basis line (`drawn from 6 stills — 3 liked, 3 disliked`, graphite 13px); a numbered list of findings (Newsreader italic numerals `i.`–`v.`, stone 17px; direction `drawn to` in cobalt / `away from` in cola red, 12px; finding title Archivo 28px 500, −0.025em). Unselected findings at opacity .36 (hover 1); click selects.
- Under a 1px `--rule`: `strength — evidence`, the artistic terms as a definition list (term Newsreader italic 18px ink; definition Newsreader 15px graphite) and, when present, relationships to other findings (`shares Chinatown with ii.`).
- Right area: the user's actual stills (framed prints, 240px) or pages (165×260, dog-ear or torn edge shown) physically re-sort into three bands when a finding is selected: `supports`, `contradicts` (`contradicts — none so far` when empty) and, smaller (.58) and faded (.34), `not part of this finding`. 700ms transform / 500ms opacity, `cubic-bezier(.2,.7,.1,1)`, slight fixed rotations (`ROT`).
- Click any work to examine it: white .86 scrim + 2px blur, enlarged still (760px) or page (×1.1), caption, and its role in each finding; click or `Close` to dismiss.
- Mobile: `Taste profile — mobile` block in the same file.
- **Empty state:** with zero responses the page shows only `exercise judgement to build your taste` centred (Archivo wdth 112, 500, `clamp(26px,3.4vw,48px)`), where `exercise judgement` is an underlined cobalt 600 link (2px underline, offset .14em) back to Home; `pallas` back link top-left.
- The findings, terms and evidence strings in the source (`FINDINGS`) are **stand-in content** shaped to the analysis engine's outputs. Wire them to the engine; never invent findings or show scores.

## Assets added in this update (`prototype/assets/`)

- `home-tv.png`, `home-book.png` — homepage cut-outs. The TV shows the Toshiba logo; the cover is a Dell edition of *Bonjour Tristesse* with Françoise Sagan's portrait. **Both need licensing or replacement before launch.**
- `remote-body.png`, `remote-power.png`, `remote-green.png` — built from a retailer photo of the Toshiba CT-90101. **Permission to reuse it is unconfirmed.** `docs/Remote photography brief.md` describes a replacement shoot.
- `tv-cap-mask.png` — TV button cap mask.

## Persistence

- Votes: `localStorage['taste.votes'] = { c: {filmIndex: 'like'|'dislike'}, l: {entryIndex: 'like'|'dislike'} }` (unchanged; move to the codebase's real store).
- The rail's open/closed state is in memory only and resets to open when entering a screen.
- One-time hints (remote tilt, swipe) are per page load in the prototype; persist "seen" per user in production.

## Known prototype shortcuts

- The fly-in creates a temporary DOM node and uses the Web Animations API; use the codebase's animation approach, keeping the timings.
- The `Taste Profile` artboard is fixed-size in the source; make it fluid.
- Swipe and tilt thresholds were tuned with a mouse, not on real devices. Test on iOS Safari and Android Chrome.
