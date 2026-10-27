# Cultural Capital — Design System

Studio name: **Cultural Capital**.

A multidisciplinary practice led by a designer / creative director: **handbags and leather goods** first, plus **digital experiences, websites and events**. The director sets creative direction and works with collaborators who execute. This system translates their reference board into tokens, components and a click-through website so new work starts from the same visual language.

**The objects come first.** Photography, composition and typography exist to serve the object, never to compete with it.

## Sources

No codebase, Figma file or existing brand assets were supplied. Everything here is derived from:

- The director's written brief (design philosophy, how they want to work, visual qualities).
- Reference sites (not accessed, named in brief): Blue Elephant — `en.blueelephant.co`; Open YY — `en.theopenproduct.com`.
- Nine reference images in `uploads/`, copied to `assets/reference/`:
  - `street-bag.png` — two women walking, black chain bag with steel plate (Open YY-style lookbook, overhead, natural colour).
  - `shoes-on-white.png` — oxblood lace-ups isolated on white, tiny "SHOES" label top-left (catalogue image).
  - `openyy-store.png` — Open YY site: expanded grotesk wordmark, "@INSTAGRAM" label, inset store image.
  - `hand-can.jpg` — hand with oxblood nails crushing a cola can on white (body + object, seamless white).
  - `poster-collage.jpg` — editorial poster: cut-out portrait on white, inset framed crops, tiny right-aligned credits + barcode.
  - `compact-mirror.jpg` — hands with red nails holding a compact mirror on violet (object × body in saturated colour).
  - `lips-closeup.jpg` — gloss close-up (material / surface detail).
  - `flip-phone-ad.jpg` — Y2K flip-phone ad: figure on pale grey, object repeated as a product row.
  - `leather-jacket.jpg` — glazed black leather jacket close-up on white (material).

These are **mood references, not owned imagery**. They stand in for product photography in the UI kit and cards until real work is supplied. Several contain third-party trademarks — never ship them.

**No logo was provided.** The wordmark is rendered in plain type (Archivo Expanded, bold). Do not draw a mark.

---

## Content fundamentals

- **Very few words.** The photography speaks. A page should be readable with every word removed.
- **Labels, not copy.** Almost all text is small ALL-CAPS sans, widely tracked, tucked into corners: `SS27 — FILM`, `LOOK 04`, `CHAIN BAG 01`, `BAG (1)`.
- **Naming objects:** short noun + number. `Chain bag 01`, `Lace-up 02`, `Jacket 01`. No adjectives in names.
- **Descriptions:** one or two plain sentences of fact — material, construction, run size. "Small shoulder bag in glazed calf. Steel plate, doubled chain. Made in a run of forty." No "elevate", "iconic", "timeless".
- **Voice:** third-person and impersonal. No "we", rarely "you". Interface verbs are bare imperatives: `Add to bag`, `Subscribe`, `Close`, `Remove`.
- **Credits** follow the poster convention: `SHOT BY … / 04. 2026` stacked right-aligned in a corner.
- **Numbers:** tabular figures, em dash as separator (`Oxblood — 38`), prices `€640`.
- **No emoji. No exclamation marks.** Sentence case only for the rare description; everything else caps.

## Visual foundations

- **Colour:** near-monochrome interface — White `#FFF`, Paper `#F4F4F2`, Fog `#E8E8E5`, Rule `#DADAD6`, Stone `#8C8C88`, Graphite `#4A4A48`, Ink `#0B0B0B`. Colour enters through photographs only. A **photographic palette** (oxblood, cola red, lip tan, violet, cobalt) is recorded from the references for styling, sets and events — not for UI chrome.
- **Type (approved: grotesk):** Archivo (Swiss grotesk with a width axis) is the typeface. Jost (Futura-like geometric) remains in tokens as an unused alternate. Used small: 10–14px, uppercase, 500 weight, tracking .12em (labels) / .22em (sparse corner labels). The **only** large type is the wordmark in Archivo Expanded (wdth 125, 600, −0.02em), used in the footer.
- **Imagery:** the anchor image is a person using/wearing the object on **seamless white** — bright, clean, body and object only. Also: objects isolated on white as catalogue images; material close-ups (glazed leather, gloss); occasional saturated set colour (violet, cobalt). Warm natural skin, high-key, crisp, no grain filters, no duotones.
- **Rhythm:** person → objects → person → objects. Deliberate contrast pairings: object on white × person in colour; close-up × full figure.
- **Scale:** images are half-screen or full-screen. Never thumbnails, never carousels of small cards.
- **Layout (approved: edge-to-edge):** images run edge-to-edge with zero gutters — this is the default. Soft-margin `inset` mode (`--gutter-inset`, 8–20px fluid) is kept as an opt-in via `data-layout="inset"`, not for general use.
- **Page frame:** corner labels sit `--edge` (14–28px fluid) from the viewport edge. Header is 56px, transparent, `mix-blend-mode: difference`, so it reads over any photograph and over white.
- **Backgrounds:** white. Paper/Fog only as image placeholders or behind cut-outs. No gradients, patterns, textures or illustrations.
- **Corners:** 0 radius everywhere. **Borders:** 1px hairlines in `--rule`, used sparingly (drawer edge, input underline, bag line items). **Shadows:** none. **Cards:** there are no cards — an image with a label beneath is the unit.
- **Transparency & blur:** only the drawer scrim (white 72% + 2px blur). Nothing else is translucent.
- **Protection:** no gradients over images. Labels go white (`inverse`) on darker photos, ink on light ones; the header uses blend-mode instead.
- **Motion:** opening is full-screen motion (looping film, or crossfading stills with a slow 1.06 push-in). Images fade in on load (700ms). Hover image swap object→worn (320ms). Drawers slide (320ms). Easing `cubic-bezier(.2,.7,.1,1)` — quick start, long settle. No bounce, no parallax, no scroll-jacking. Respects reduced motion.
- **Hover:** links draw a 1px underline from the left; secondary text dims to .72 opacity; solid button lightens Ink→Graphite; outline button inverts. **Press:** opacity .6. No scale/shrink.
- **Focus:** 1px ink outline, 3px offset.

## Iconography

There is **no icon system**, by intent. The references use words in caps where other sites use icons: `MENU`, `BAG (1)`, `CLOSE`, `SEARCH`. Follow that:

- No icon font, no SVG sprite, no emoji, no unicode glyph icons (no ×, →, ♡).
- The only graphic marks allowed: 1px hairlines, the thin hero progress ticks, and colour swatch squares.
- If an icon is ever unavoidable (e.g. play on a video), use a single-weight 1px outline glyph from Lucide via CDN and flag it.

## Index

- `styles.css` — entry point; `@import`s only.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css` (incl. inset/bleed modes), `motion.css`, `base.css`.
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Layout, Motion, Brand).
- `assets/reference/` — the nine reference images (stand-in imagery only).
- `components/` — React primitives, each with `.jsx`, `.d.ts`, `.prompt.md`, plus one card per folder.
- `ui_kits/website/` — click-through shop site (Home, Shop, Product, Bag drawer, mobile Menu).
- `SKILL.md` — Agent Skill entry point.
- `thumbnail.html` — project tile.

### Components

- `components/core/` — **Label**, **Button**, **TextLink**
- `components/media/` — **Figure**, **Pair**, **HeroMotion**, **ProductTile**
- `components/navigation/` — **Header**, **Footer**
- `components/forms/` — **Input**, **OptionGroup**
- `components/overlay/` — **Drawer**

No source component library existed, so this is an authored set sized to a shop / portfolio site. Standard primitives with no place in this language (Badge, Tabs, Toast, Tooltip, Checkbox, Card) were left out on purpose.

### UI kits

- `ui_kits/website/` — see its `README.md`.

## Open decisions (for the director)

Approved: edge-to-edge images, grotesk typeface (Oct 2026). Preserve.

1. Wordmark / logo (currently plain type).
2. Real typeface files, if a licensed grotesk is preferred over Archivo.
