# Handoff: Pallas — Home, Film, Literature

Pallas (working title earlier: Taste, Bent, Hunch) is an interactive experience presented by Cultural Capital that helps people discover their taste in film and literature. Hyperrealistic vintage objects sit in stark white, minimal environments; users respond to film stills on a silver CRT television and to literary excerpts in a vintage paperback.

This document is the full spec. `CLAUDE_CODE_PROMPT.md` is the short instruction to paste into Claude Code.

---

## About the design files

Everything in `prototype/` is an **HTML design reference**: a working prototype that shows the intended look, timing and behaviour. It is not production code to copy. Recreate it in the existing Taste/Pallas codebase using that codebase's framework and patterns.

The source of truth is:

- `prototype/Taste.dc.html` — all three screens, all state and animation logic (logic class at the bottom of the file, inside `<script type="text/x-dc">`).
- `prototype/BookPage.dc.html` — one 330×520 book page (title / excerpt / info / blank), used many times by the book.

The `.dc.html` format is a templating wrapper: `{{ name }}` holes are filled from `renderVals()` in the logic class, `<sc-if>` / `<sc-for>` are conditionals and loops, `<dc-import name="BookPage">` mounts the page component, and `<x-import component-from-global-scope="CreativeOutputDesignSystem_ca4438.X">` mounts a design-system component. Read the markup for layout and the logic class for behaviour.

**To view the prototype locally:** serve `prototype/` from a static server (e.g. `npx serve prototype`) and open `/Taste.dc.html`, `/Taste.dc.html#cinema`, `/Taste.dc.html#literature`. Opening the file directly from disk will not load `BookPage`.

## Fidelity

**High fidelity.** Final colours, type, measurements, copy, timings and easings. Recreate pixel-for-pixel. Do not redesign, restyle, rename or "improve" anything. If something cannot be reproduced exactly, flag it to the director instead of substituting.

---

## Approval status — read before building

| Area | Status |
|---|---|
| Homepage | **Approved** |
| Film screen: TV, nameplate, like/dislike buttons, on-screen "liked"/"disliked" text, like = channel-change swipe, dislike = static → line → dot | **Approved** (latest revision) |
| Quick view: drawer (not "on the TV") | **Approved choice** |
| Shelf tab: only responded items, A–Z, continuous swipe to the ends | **Specified by director**, built as described |
| Book cover: 50s style, black "Pallas", "Build your taste in literature" in Ultra, "A Cultural Capital Publication" bottom right, worn ink | **Approved** |
| Photographic book, dog-ear and tear interactions | **Built to the director's latest feedback, not yet formally signed off.** Implement as specified, and tell the director these await sign-off. |
| Black band between pictures during the like swipe | **Open question** — built and present; keep it unless the director says otherwise. |

### Do NOT build (present in the source, unapproved or dead)

- **"On the TV" quick view**: `openQV()` has `if (false) {...}`; `arcGo`, `arcStep`, `tvArc`, `onArcStep`, the "back to tv" link, and OSD texts like `liked 01 / 03` / `no liked stills`. Rejected in favour of the drawer.
- **Alternative covers**: `cv.b` ("Cultural Capital presents" cover) and `cv.c` (70s cover with Shrikhand, Didact Gothic and stripes) plus the `seventies` values. Only `cv.a` ships. Do not load Shrikhand or Didact Gothic.
- **Old like animation phases** in `picStyle()`: `tearOut`, `rollIn`, `settle` (used only by the dead TV-arc code).
- Leftovers with no effect: `genTear`, `bk.tearing`, `bk.rightEdges`, `cover = 'publication'`.
- Unused project assets not included here: `cover-wear.png`, `cover-worn.png`, `fore-edge.png`, `tv-a.jpg`.

### Stand-in content (replace, don't treat as final)

- `FILMS` (6 titles from the IMDb Top 250, with invented spine colours) — Claude Code is already building the real film list from the IMDb Top 250. Each film needs: id, title, year, director, still image, DVD spine `bg`/`fg` colours.
- `ENTRIES` (5 public-domain excerpts with author/work/techniques notes).
- `BOOKSPINE` (5 spine colour/size presets cycled by index).
- TV stills are empty `<image-slot>` drop targets in the prototype (`still-01` … `still-06`); no real stills ship with this bundle.

---

## Design system — Cultural Capital

Tokens live in `prototype/_ds/creative-output-design-system-ca443838-334a-4774-b349-fec337126a32/tokens/`. Port these as CSS custom properties (or the codebase's token system) with the same names and values.

**Colours**
- `--white #FFFFFF` (all page backgrounds), `--paper #F4F4F2`, `--fog #E8E8E5`, `--rule #DADAD6`, `--stone #8C8C88`, `--graphite #4A4A48`, `--ink #0B0B0B`
- `--ref-cobalt #2E5BD6` (CULTURAL CAPITAL, TV nameplate, dog-ear hover, info-page headings)
- `--ref-cola #D3222A` (tear-out hover state)
- `--ref-oxblood #6B1420`, `--ref-violet #4A3E9E`, `--ref-tan #B66E55` (spine colours only)
- `--overlay-scrim rgba(255,255,255,.72)` (drawer scrim, with 2px backdrop blur)

**Type**
- Archivo variable (Google Fonts, `wdth 62..125`, `wght 300..700`) = `--font-sans`. Pallas uses width settings 100, 112 and 125 via `font-variation-settings:'wdth' N`.
- Book only: **Ultra** (cover title, subtitle, spine), **Gloock** (title page, excerpt numbers, book spines in shelf), **Newsreader** (opsz 6..72, 400/500, roman + italic — body text, imprint lines).
- Exact Google Fonts URL used: `https://fonts.googleapis.com/css2?family=Gloock&family=Ultra&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&display=swap`
- Director rule: no uppercase, widely letter-spaced, monospaced headings. Pallas UI text is lowercase sentence fragments.

**Spacing**: `--space-1..9` = 4, 8, 12, 16, 24, 32, 48, 72, 120px. `--edge: clamp(14px,2.2vw,28px)` (corner-label inset). `--header-h: 56px`. Radius 0 for UI.

**Motion**: `--ease-out cubic-bezier(.2,.7,.1,1)`, `--ease-inout cubic-bezier(.65,0,.35,1)`, `--dur-fast 160ms`, `--dur-base 320ms`, `--dur-slow 700ms`.

**Components used** (source in `design-system/components/`):
- **TextLink** — `<a>`, no text-decoration; 1px underline drawn from the left on hover/active via `background-size 0%→100% 1px`, `320ms --ease-out`. Pallas always overrides its default caps styling (see per-use styles below) and uses `tone="inherit"` in the corner bars.
- **Drawer** — fixed overlay, right side, white panel with 1px `--rule` left border, header 56px with a "Close" TextLink, scrim click and Escape close, slide `translateX(100%)→none` 320ms `--ease-out`.
- **Label** — imported by Drawer (title is empty in Pallas).

Global: `html, body { background:#fff }`, `a { color: var(--ink) }`.

---

## Navigation

Hash routing in the prototype: `''`/`#` → Home, `#cinema` → Film, `#literature` → Literature. **Keep whatever routing the existing codebase already uses**; the visible link label is "film" even though the prototype route is `#cinema`.

Screen changes are instant swaps; no inter-screen transition was designed. Do not add one.

On Film and Literature, a fixed back link sits top-left at `top: var(--edge); left: var(--edge)`: TextLink "pallas" → home, 18px, weight 600, `wdth 125`, letter-spacing −.04em, line-height 1.1, no uppercase.

---

## Screen 1 — Home (approved)

Centred column on white. `main`: `min-height:100vh; display:grid; place-items:center; padding: var(--space-9) var(--edge)`. Inner column: flex column, centred, `text-align:center`, `transform: translateY(-3vh)`.

Top to bottom:
1. **"CULTURAL CAPITAL"** — Archivo `wdth 112`, `clamp(12px,.95vw,14px)`, 500, line-height 1.3, letter-spacing .06em, colour `--ref-cobalt`. (Uppercase is typed, not text-transform.)
2. **"presents"** — 4px below; Archivo `wdth 112`, `clamp(10px,.8vw,12px)`, 500, lh 1.3, ls .01em, colour `--ink`.
3. **"pallas"** (h1) — margin-top `clamp(14px,1.6vw,24px)`; Archivo `wdth 125`, `clamp(112px,21vw,330px)`, 600, lh .8, ls −.05em, `--ink`, `padding-right:.05em`.
4. **"an exploration of what moves you, and why"** — margin-top `clamp(28px,3.2vw,48px)`; Archivo, `clamp(17px,1.5vw,22px)`, 400, lh 1.4, ls −.005em, `--ink`, `text-wrap:balance`.
5. **nav** — margin-top `clamp(72px,10vh,128px)`; column, gap `clamp(14px,1.4vw,20px)`:
   - "develop your taste in" — `clamp(14px,1.05vw,16px)`, 400, lh 1.3, ls .005em, `--graphite`.
   - Row (flex, baseline, wrap, gap `clamp(32px,4.4vw,72px)`): TextLinks **"film"** and **"literature"** — `clamp(30px,3.4vw,48px)`, 500, `wdth 112`, ls −.025em, lh 1.1, no uppercase, padding-bottom 6px, ink. Hover = underline draws from left.

---

## Screen 2 — Film (approved)

`main`: `min-height:100vh; display:grid; place-items:center; padding:72px var(--edge) 88px; overflow:hidden`, white.

### Television
Container: `width: min(92vw, calc((100vh - 160px) * 1.107), 880px); aspect-ratio: 1550/1400; container-type: inline-size; position:relative`. All TV overlays are positioned in % of this box and sized in `cqw`, so they stay registered to the photo at every size.

Layers (in order):
1. `assets/tv.jpg` (1550×1400) filling the box, `draggable=false`.
2. Soft floor shadow: `left 4%; width 90%; top 92.6%; height 6.5%; border-radius 50%; background rgba(0,0,0,.16); filter blur(2.2cqw); mix-blend-mode multiply`.
3. Contact shadow: `left 30.5%; width 32%; top 95.2%; height 1.6%; border-radius 50%; rgba(0,0,0,.42); blur(.45cqw); multiply`.
4. **Screen**: `left 11.36%; top 14.14%; width 75.16%; height 60%; border-radius 1.1% / 1.5%; overflow hidden; background #171a19`. Inside:
   - **Picture layer** (receives the collapse transforms): all stills stacked `inset:0`, only the current one visible; stills fill the screen (`object-fit: cover`; screen ratio ≈ 1165:840). The static **noise canvas** (200×146, stretched to 100%) lives *inside* this layer so it collapses with the picture.
   - **Dot**: centred, 1.2cqw circle, `#fff`, `box-shadow: 0 0 1.4cqw .6cqw rgba(220,240,255,.85), 0 0 4cqw 1.4cqw rgba(200,225,255,.4)`; opacity 0 except during power-off.
   - Vignette: `box-shadow: inset 0 0 8cqw rgba(0,0,0,.5), inset 0 0 1.4cqw rgba(0,0,0,.55)`.
   - Glass reflection: `linear-gradient(160deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,.035) 36%, transparent 37%)`.
   - No scan lines (removed at the director's request).
   - **OSD text**: `top 7%; left 7%`, Archivo `wdth 112`, 4.4cqw, 500, lh 1, ls .01em. "liked" = `#d6ffd2` with `text-shadow: 0 0 .8cqw rgba(140,255,150,.75), .25cqw .25cqw 0 rgba(0,0,0,.7)`. "disliked" = `#ffd4cf` with glow `rgba(255,70,55,.8)` (same shadow structure).
5. **Nameplate "cultural capital"**: `left 45.03%; top 78.21%; width 8.9%; height 2.5%`, centred; Archivo `wdth 112`, .9cqw, 600, ls −.01em, `--ref-cobalt`, `text-shadow: 0 .08cqw 0 rgba(255,255,255,.8)`, nowrap.
6. **Buttons** (real `<button>`s, `aria-label` "dislike"/"like"): `top 82.68%; width 5.68%; height 1.86%`; dislike `left 42.97%`, like `left 50.19%`; background `assets/tv-cap.png` stretched 100%; no border. `:active` → `translateY(.12cqw)` + `brightness(.88)`, 80ms.
7. **Button labels** (non-interactive): Archivo `wdth 112`, 1.25cqw, 500, `#d2d3d4`, vertically centred on the buttons. "dislike" right-aligned with `right: 57.03%; padding-right: .9cqw`; "like" at `left: 56.5%`.

### Corner bars
- Bottom-right (fixed, `--edge`): `still 01 / 06` — 13px, 500, `wdth 112`, `--graphite`, tabular-nums.
- Bottom-left (fixed, `--edge`, flex baseline gap 10px, same type): TextLinks `shelf` — `liked (n)` — `disliked (n)` separated by "—" spans. Each opens the quick-view drawer on that tab. Link style: 13px/500/`wdth 112`, no uppercase, ls 0, colour graphite (ink when active).

### Like sequence (channel change)
Inputs are ignored unless `phase === 'idle'`. Times from click:
- **0ms**: save vote; show OSD "liked" (green).
- **900ms**: OSD clears. Next still becomes current and is placed at `translateY(107%)`; previous still stays at 0. A 7%-tall black band sits directly above the incoming still (`top:-7%`, `linear-gradient(180deg,#050505,#000 40%,#151515)`).
- **940ms**: both move together with `transform 420ms cubic-bezier(.55,.05,.25,1)`: incoming → `none`, outgoing → `translateY(-107%)`.
- **1400ms**: idle. No static during a like.

### Dislike sequence (power off)
- **0ms**: save vote; OSD "disliked" (red).
- **900ms**: OSD clears; static starts at opacity .95 over the still (picture layer unchanged).
- **1450ms**: one Web Animations API animation on the picture layer (static included), 340ms, `fill: forwards`:
  - `scale(1,1)`, `brightness(1)` → @50% `scale(1,.006)`, `brightness(2.6)` (collapses vertically to a bright full-width line)
  - → @100% `scale(0,.006)`, `brightness(2.6)` (line shrinks horizontally to the centre)
  - each segment eased `cubic-bezier(.6,0,.9,.3)`. Use one keyframed animation, not two chained CSS transitions, so the line always forms before the dot (chained transitions can interpolate both axes together and read as a shrinking box).
- **1620ms**: dot fades in (90ms).
- **1790ms**: static stops; cancel the collapse animation; picture layer set instantly to `transform:none; opacity:0` (screen black, `#171a19`); dot fades out `560ms ease-out`.
- **2400ms**: advance to next still; picture layer fades on: `opacity 0→1` over 520ms and `filter brightness(1.8)→none` over 700ms, both `--ease-out`. **No scale on power-on** (scaling up from the centre reads as a box).
- **3000ms**: idle.

**Static generation** (per animation frame while on): 200×146 grey noise, each pixel `random()*215`, plus one bright band (±6px rows, +70) and one dark band (±3px, −60) at random heights.

Stills loop: `idx = (idx + 1) % N`.

---

## Screen 3 — Literature

`main`: `min-height:100vh; display:flex; column; centred; gap:48px; padding:72px var(--edge) 88px; overflow:hidden; user-select:none`.

### Book coordinate space and scaling
The book is authored in a fixed **660×520 px** space (closed book = right half, 330×520), then uniformly scaled:

```
narrow = vw < 1100
extra  = (narrow && tornCount > 0) ? 190 : 0      // room for the torn stack on narrow screens
scale  = clamp(0.42, 1.3, min((vw - 48) / (narrow ? 700 + extra : 1000), (vh - 230) / 540))
stage  = width (660 + extra) * scale, height 520 * scale
```
Inner wrapper: 660×520, `transform: scale(s)`, origin `0 0`, `perspective: 2400px`. Book group: `transform-style: preserve-3d; transform-origin: 495px 260px; transition: transform 1150ms cubic-bezier(.45,.05,.2,1)`. Closed: `translateX(-165px) rotateY(22deg)`; open: `translateX(0) rotateY(0)`.

### Closed book (layers, all in book space)
- **Base shadow** (`translateZ(-34px)`, radius 3px): `box-shadow: 16px 24px 38px -6px rgba(0,0,0,.20), 4px 6px 12px rgba(0,0,0,.13), 1px 1px 2px rgba(0,0,0,.16)`. Closed: `left 330px; width 330px`; open: `left 0; width 660px; opacity 0` (transitions 950ms same curve, 200ms delay; opacity 600ms 500ms delay).
- **Spine**: `left 296px; width 34px; height 520px; transform-origin 100% 50%; rotateY(-90deg)`, `assets/book-spine.jpg`. Text column (top 28, bottom 24, space-between): "Pallas" Ultra 15px vertical-rl, `#0e0c10`, multiply, .92; "CULTURAL CAPITAL" Newsreader 8.5px 500 ls .16em uppercase `#efe4cc` .88. Overlay `linear-gradient(90deg, rgba(0,0,0,.18), rgba(255,255,255,.06) 40%, rgba(0,0,0,.14))`.
- **Fore-edge** (closed only): `left 660px; top 3px; 34×514; origin 0 50%; translateZ(2px) rotateY(90deg)`, `assets/book-fore.jpg`, `inset 3px 0 4px rgba(0,0,0,.18)`.
- **Cover** (`left 330; 330×520; origin 0 50%; translateZ(3px)`; radius `2px 5px 5px 2px`): `assets/book-cover.jpg`, then a type layer masked by `assets/ink-wear.png` (100% 100%) with `filter: blur(.25px)` so the ink breaks where the cover is worn:
  - "A Cultural Capital Publication": `right 20px; bottom 24px`, Newsreader 9px 600, lh 1, ls .2em, uppercase, `#f4ebd6`, right-aligned.
  - Title block `left 62px; right 18px; top 122px`, column, left-aligned:
    - "Pallas" — Ultra 66px, lh .86, ls −.035em, `#0e0c10`, `mix-blend-mode: multiply`, opacity .94, `margin-left:-3px`.
    - Rule 132×1.5px, `#efe4cc`, opacity .9, margin `30px 0 22px`.
    - "Build your taste" / "in literature" (two lines) — Ultra 24px, lh 1.12, ls −.01em, `#f1e7d0`, .95.
  - Sheen over everything: `linear-gradient(118deg, rgba(255,255,255,.06), rgba(255,255,255,0) 34%, rgba(0,0,0,0) 62%, rgba(0,0,0,.06))`.
  - Back face (inside cover) is a blank page (`BookPage kind="inside" side="left"`).
- **Cover hover** (closed): `rotateY(-14deg) translateZ(3px)`, `420ms --ease-out`. Cursor pointer.

### Opening
Trigger: click the cover or the "open" link.
1. Book group goes flat and centred (1150ms). Cover `rotateY(-180deg) translateZ(3px)`, 1150ms `cubic-bezier(.45,.05,.2,1)`.
2. Open-spread photo `assets/book-spread.jpg` at `left -65.2px; top -40.6px; 796×596; translateZ(-1px)` fades in: `opacity 500ms ease 650ms`.
3. After 380ms the title page turns as a leaf (see page turn), revealing spread 1: excerpt left, info right.

### Page turn (shared by open / next / previous / after dog-ear / after tear)
The turning leaf sits over the right page (`left 330; translateZ(2px); origin 0 50%`) and is built from two hinged segments so the paper bends: inner 132px and outer 198px (hinged at x=132). Front shows the outgoing right page; back shows the incoming left page.
- Leaf: `rotateY(0) → rotateY(-180deg)`, 1100ms, `cubic-bezier(.42,.06,.22,1)`.
- Outer segment: `0 → -16deg @20% → 20deg @62% → 0`, ease-in-out.
- Shading (`#2a2014` overlays): fronts 0 → .14 @45% → .3; backs .3 → .1 @55% → 0.
- Right-page shadow (`linear-gradient(90deg, rgba(30,20,5,.34), rgba(30,20,5,.10) 30%, transparent 70%)`): 0 → 1 @25% → 0 @60%.
- Left-page shadow (mirror gradient, 270deg): 0 → 0 @50% → .85 @86% → 0.
- **Previous** plays the same animation reversed.
- Navigation loops through entries modulo the count.

### Pages (`BookPage.dc.html`, 330×520)
Base `#ead9b6`, text `#2a241b`; texture `page-left.jpg` (left pages) or `page-right.jpg` (right pages); all type sits in a `mix-blend-mode: multiply` layer so it looks printed into the paper.
- **Excerpt (left)**: block `left 38; right 34; top 74`. Number: Gloock 26px centred `#1d1b18`. Body (28px below): Newsreader 14.5px / 1.52, justified, `hyphens:auto`, `text-wrap:pretty`; first paragraph no indent, later paragraphs indent 1.3em. Folio bottom 26px, centred, Newsreader 11px `#5a544c`, value `2i + 2`.
- **Info (right)**: block `left 34; right 38; top 42`. Title Newsreader italic 23px / 1.1 `#1d1b18`, balance. Byline 7px below: Archivo 10.5px 500 `#4d4943` ("Author — Year"). Rule 1px `#bfa983`, margin `16px 0 14px`. Sections (gap 12px), each heading Archivo 10px 600 `--ref-cobalt`: "the author", "the work", "techniques"; body Newsreader 12.5px / 1.42; technique name in italics followed by "." Folio `2i + 3`.
- **Title page**: "Pallas" Gloock 44px / .98, ls −.02em, top 150px, centred; rule 36×1 `#1d1b18`, margin `22px 0 18px`; "Build your taste in literature" Newsreader italic 15px / 1.3; "CULTURAL CAPITAL" at bottom 44px, Archivo 8px 500 ls .14em uppercase `#4d4943`.

### Dog-ear = like (right page)
- **Hover** right page (only when idle and the spread is showing): a 236×236 corner flap folds down to `rotate3d(1,1,0,-158deg)` (about halfway down the page) over 560ms `--ease-out`; the page underneath is clipped `polygon(0 0, 94px 0, 330px 236px, 330px 520px, 0 520px)`. Flap front is the same page content; flap back is paper (`#e6d3ac` + `assets/paper-photo.jpg` 330px tile + a fold highlight gradient). Flap shadow: `drop-shadow(-7px 10px 9px rgba(50,30,5,.34)) drop-shadow(-1px 2px 1.5px rgba(50,30,5,.25))`. The "dog-ear" link turns `--ref-cobalt` and lifts 2px. Mouse-leave unfolds (560ms).
- **Click** right page or "dog-ear": vote like; flap animates to **118×118** and `rotate3d(1,1,0,-180deg)` over 780ms `cubic-bezier(.3,.1,.15,1)`; shadow becomes `drop-shadow(-2px 3px 2.4px rgba(60,40,10,.36))`. Wait 1250ms, then page-turn to the next spread.
- After any dog-ear, up to 4 tiny triangles (6×8, `linear-gradient(225deg,#efe8d6 0 45%,#c4b594 55%)`) appear at the book's top-left edge (`left 2px; top 2 + 9k px`); clicking them opens the drawer on "dog-eared".

### Tear out = dislike (left page)
Driven by two CSS variables on the book group: `--ty` (how far the tear has travelled down, px in book space) and `--sk` (skew of the loosening piece, deg).
- The page is split by raster masks: the tearing piece uses `assets/tear-piece.png`, the stub that stays bound at the gutter uses `assets/tear-stub.png`, each intersected with `linear-gradient(#000 var(--ty), transparent var(--ty))` (`mask-composite: intersect` / `-webkit-mask-composite: source-in`). `tear-core.png` / `tear-core-stub.png` overlay the fibrous white torn edge. Below `--ty` the page is still whole. The piece skews from `transform-origin: 0 var(--ty)` with `skewX(var(--sk))` and carries `drop-shadow(.9px .3px 1.3px rgba(40,25,5,.34))`; the stub `drop-shadow(-.6px 0 .9px rgba(40,25,5,.3))`.
- **Hover** left page: tween to `ty 250, sk 2.2` (≈ halfway) over 560ms, ease-out cubic. "tear out" link turns `--ref-cola`. Mouse-leave → `0, 0` in 380ms.
- **Drag** (pointer events, `touch-action:none`): with horizontal drag `dx` (book px), `p = clamp(0,1,-dx/160)`, `ty = 250 + 230p`, `sk = 2.2 + 1p`. Release with `dx < -60`, or a click without movement, completes the tear; otherwise snap back over 320ms.
- **Complete** (also via "tear out" link): vote dislike → if `ty < 200` tween to 250/2.2 in 420ms → wait 140ms → tween to 520/3.4 in 520ms (ease-in-out quad) → the piece flies off with WAAPI keyframes over 1150ms:
  - `translateZ(1px) translate(0,0) rotateY(0) rotateZ(0)` (easing `cubic-bezier(.3,.6,.4,1)`)
  - @25% `translate(-6px,-3px) rotateY(14deg) rotateZ(-3deg)` (easing `cubic-bezier(.55,0,.85,.45)`)
  - @100% `translate(-640px,380px) rotateY(36deg) rotateZ(-38deg)`, opacity 0
  - then the page stays hidden (the stub remains), wait 380ms, page-turn to the next spread.
- **Torn stack**: the last 4 torn pages appear beside the book at book-space `left 700px; top 330px`, each the masked page at `scale(.34)` with offsets/rotations `[0,0,-6°] [12,-8,4°] [-6,6,-1.5°] [6,-3,7°]` and `drop-shadow(0 3px 3px rgba(0,0,0,.16)) drop-shadow(0 16px 26px rgba(0,0,0,.08))`. Click opens the drawer on "torn out".

### Controls and corner bars
- Under the book: 3-column grid (`1fr auto 1fr`), width `660 * scale`, min-height 20px.
  - Left: "Previous"; right: "Next" — TextLink 10px 500 ls .12em uppercase `--stone` (open only).
  - Centre: closed → "open"; open → "tear out" and "dog-ear" (gap 40px) — 13px 500 `wdth 112`, no uppercase.
  - Dimmed while animating (.35 for actions, .4 for nav).
- Top-right (open only): "Close" (same style as Previous/Next) → reverse leaf to title page, then cover closes (1200ms), reset.
- Bottom-right (open only): `excerpt 01 / 05`.
- Bottom-left: `shelf` — `dog-eared (n)` — `torn out (n)`.
- Keyboard while open and drawer closed: → next, ← previous, Esc close.

---

## Quick view drawer (both screens)

Design-system **Drawer**, right side, `width = max(440, round(vw * 0.5))` (component caps at 100vw), empty title, scrim white .72 + 2px blur. Also set `visibility:hidden` once the close transition ends (bug fix so "Close" never shows while closed).

Body: column, gap 36px, padding `8px 0 64px`.
- **Tabs** (flex baseline gap 24px, 13px 500 `wdth 112`): `shelf (n)`, then `liked (n)` / `disliked (n)` (film) or `dog-eared (n)` / `torn out (n)` (literature). Active = ink + underline; inactive = graphite.
- Empty tab: "none yet", 14px, `--stone`.

**Shelf tab**
- Contains **only items the user has responded to**, sorted A–Z ignoring a leading "The ", "A " or "An ".
- Horizontal row bleeding to the drawer edges: `display:flex; align-items:flex-end; gap:1px; padding:28px calc(var(--edge) + 6px) 0; overflow-x:auto; scrollbar hidden; overscroll-behavior-x:contain`. Continuous scroll that stops at the first/last item (not a loop). Mouse: drag-to-scroll with inertia (release velocity × 16, decays ×0.94 per 16ms), and the click after a drag is swallowed. Touch: native `pan-x`.
- **DVD spine** (film): 23×300, radius `2px 2px 1px 1px`, film `bg`; black plastic caps 8px top/bottom (`#2a2a2a → #0e0e0e`); title vertical Archivo `wdth 112` 11px 600 in `fg`; year 8.5px 500 at .78; gloss `linear-gradient(90deg, rgba(0,0,0,.22) 0, rgba(255,255,255,.06) 12%, rgba(255,255,255,.34) 24%, rgba(255,255,255,.04) 38%, rgba(255,255,255,0) 70%, rgba(0,0,0,.26) 100%)`; `box-shadow: 0 1px 1.5px rgba(0,0,0,.32), inset 0 0 0 .5px rgba(0,0,0,.3)`.
- **Paperback spine** (literature): width/height from `BOOKSPINE`, title Gloock 12.5px vertical, author Newsreader italic 9.5px .85, `paper.png` multiply .35, end/edge shading gradients, 1px crease at 26%.
- Hover lifts a spine `translateY(-10px)` (320ms `--ease-out`); the selected spine sits at `-16px`, and its still/page shows below the shelf.
- Shelf board: 12px tall `linear-gradient(180deg,#f4f4f2 0,#e6e6e2 55%,#d4d4cf 100%)`, `box-shadow: inset 0 1px 0 rgba(0,0,0,.08), 0 1px 0 #c4c4bf, 0 18px 24px -12px rgba(0,0,0,.26)`; then a 5px fade `rgba(0,0,0,.08)→0`.

**Liked / disliked tabs**
- Film: each still edge to edge (bleeds past drawer padding), aspect 1165/840, background `#171a19`; caption below (10px gap, padded by `--edge`): `Title — Director, Year — liked|disliked`, 13px 500 `wdth 112` graphite.
- Literature: each excerpt page laid flat at `pageScale = clamp(.6, 1.2, (min(drawerW, vw) - 80) / 330)`, alternately rotated −.5° / .7°, `drop-shadow(0 1px 1px rgba(0,0,0,.14)) drop-shadow(0 8px 14px rgba(0,0,0,.07))`. Torn pages use the `tear-piece.png` mask + `tear-core.png` edge; dog-eared pages are clipped `polygon(52px 0,100% 0,100% 100%,0 100%,0 52px)` with a 52px folded triangle (`#ebe3cf` + `paper.png`). Caption `Title — dog-eared|torn out`, centred.

---

## State and persistence

```
route: 'home' | 'film' | 'literature'
film:  idx, phase: idle|hold|swipePrep|swipe|static|off1|off2|black|on, osd, prevIdx
book:  bOpen, bIdx, bLeftIdx, bRight{kind,idx}, bLeftShown, bLeaf, bBusy,
       bCoverHover, bFlapHover, bFlapAnim: none|hover|fold, bFolded,
       bPageHover, bDragging, bTearing, bTorn, (--ty, --sk as CSS vars)
votes: cVotes{[id]: 'like'|'dislike'}, lVotes{[id]: 'like'|'dislike'}
drawer: qvOpen, qvTab: shelf|like|dislike, qvSel
```
The prototype persists votes to `localStorage['taste.votes'] = {c, l}` keyed by **array index**. In production key by stable film/excerpt IDs and use whatever persistence the codebase already has; a re-vote overwrites. These votes are the input for the later taste analysis and Taste Journal (not designed yet; do not invent them).

---

## Responsive behaviour (what exists)

- **Home**: fully fluid via `clamp()`; film/literature row wraps.
- **Film**: TV width `min(92vw, (100vh − 160px) × 1.107, 880px)`; all overlays scale with the TV via % and `cqw`.
- **Literature**: book scales uniformly between .42× and 1.3× (formula above); below 1100px wide it reserves 190px for the torn stack.
- **Drawer**: half the viewport, min 440px, full width on phones.
- **No dedicated mobile layout was designed.** Known gaps to raise with the director, not to solve by redesign: hover previews (dog-ear and tear halfway states, cover peek) don't exist on touch, so a tap on the right page dog-ears at once and a tap on the left page tears at once (drag-to-tear does work on touch); at the .42× minimum, book text is tiny; the fixed corner bars can crowd on small phones; TV labels at 1.25cqw get very small on phones.

---

## Assets (`prototype/assets/`)

| File | Size | Use |
|---|---|---|
| `tv.jpg` | 1550×1400 | TV photograph (built from the director's Toshiba CRT/DVD studio photos) |
| `tv-cap.png` | 176×52 | Like/dislike button cap |
| `book-cover.jpg` | 660×1040 | Front cover (violet, worn, no text) |
| `ink-wear.png` | 660×1040 | Alpha mask that distresses the cover type |
| `book-spine.jpg` | 68×1040 | Spine |
| `book-fore.jpg` | 24×1040 | Page-block fore-edge (closed) |
| `book-spread.jpg` | 1410×1056 | Open-spread photograph behind the pages |
| `page-left.jpg` / `page-right.jpg` | 660×1040 | Page paper textures |
| `paper-photo.jpg` | 512×512 | Back of the dog-ear flap |
| `paper.png` | 256×256 | Paper grain (spines, drawer dog-ears) |
| `tear-piece.png`, `tear-stub.png` | 990×1560 | Masks: torn piece / remaining stub |
| `tear-core.png`, `tear-core-stub.png` | 990×1560 | Fibrous torn-edge overlays |

All rasters are @2x for the 330×520 page (tear masks @3x). Book imagery was derived from an AI-generated 1536×1024 reference sheet (see `docs/book-reference-assets-README.md`), so it softens above ~1×. For production, replace it with higher-resolution photography per `docs/Book photography brief.md`, keeping the same framing so the coordinates still match.

---

## Technical requirements and limitations

1. **Inspect the existing codebase first** and preserve working Film/Cinema functionality (routing, data loading, film list, persistence). Integrate this spec into it; do not rebuild from scratch.
2. **Fixed coordinate spaces**: keep the TV as a % / `cqw` overlay on the photo, and keep the book as a 660×520 space scaled by one transform. Re-deriving positions will break registration with the photographs.
3. **CSS 3D**: relies on `preserve-3d`, `backface-visibility`, `perspective`. Ancestors of 3D layers must not have `overflow:hidden`, `filter` or `opacity < 1`, or the 3D flattens. Built and checked in Chromium; **test Safari and Firefox**.
4. **Masks**: needs `-webkit-mask-*` and `-webkit-mask-composite: source-in` alongside standard `mask-composite: intersect` (Safari).
5. **Animation engine**: the prototype mixes CSS transitions (TV phases, cover, dog-ear), WAAPI (page turn, tear fly-off) and rAF tweens on CSS variables (tear line). Any equivalent is fine (e.g. WAAPI or Motion) as long as the timings and curves match. Lock input while an animation runs.
6. **Visual approximations to know about**: the tear always uses the same raster tear shape (it does not vary per page); the page bend is two rigid hinged segments, not a mesh; static is per-frame canvas noise; the dog-ear is a rigid triangle.
7. **Reduced motion is not implemented** for the TV or the book. Ask the director before choosing fallbacks.
8. **Accessibility**: TV buttons are `<button>`s with labels; on the book, the text links ("open", "tear out", "dog-ear", Previous/Next/Close) are the keyboard path, plus the arrow keys and Esc.
9. **Fonts**: Archivo (variable width axis required), Ultra, Gloock, Newsreader from Google Fonts. Self-host if the codebase prefers it.
10. **Rights**: `tv.jpg` derives from photographs of a third-party (Toshiba) product. The "cultural capital" nameplate covers the original badge; confirm rights before launch. The design system's reference images contain trademarks and must never ship.

## Files

- `CLAUDE_CODE_PROMPT.md` — prompt to paste into Claude Code
- `prototype/Taste.dc.html` — design source (all screens, logic)
- `prototype/BookPage.dc.html` — book page component
- `prototype/assets/` — production assets listed above
- `prototype/_ds/…/tokens/*.css`, `styles.css` — design tokens; `_ds_bundle.js` — compiled DS components (prototype runtime only)
- `prototype/support.js`, `prototype/image-slot.js` — prototype runtime only; do not port
- `design-system/components/` — Drawer, TextLink, Label source (React)
- `docs/` — book photography brief and reference-asset notes
