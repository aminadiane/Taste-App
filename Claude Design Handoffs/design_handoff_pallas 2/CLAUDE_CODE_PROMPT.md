I'm handing off the approved Pallas designs (previously "Taste") from Claude Design. The full spec is in `design_handoff_pallas/README.md`, and the design source and assets are in `design_handoff_pallas/prototype/`. Read the README in full before writing code.

**Step 1: inspect before changing anything**
1. Explore this codebase: framework, routing, styling approach, state and persistence, and the existing Cinema/Film implementation (film list from the IMDb Top 250, stills, voting).
2. Report back what already works and how you plan to integrate the handoff. Wait for my go-ahead.
3. Preserve all working functionality. Integrate into the existing structure; don't rebuild or replace working code.

**Step 2: implement, in this order**
1. Design tokens from `prototype/_ds/.../tokens/` (colours, Archivo with its width axis, spacing, motion), plus the Drawer and TextLink components (`design_handoff_pallas/design-system/components/`).
2. Homepage (approved).
3. Film screen (approved): the TV photograph with the % / container-query overlay system; like = channel-change swipe; dislike = static, then line, then dot; green "liked" / red "disliked" on-screen text. Wire it to the existing film data and stills.
4. Quick-view drawer on both screens: shelf (only responded items, A–Z ignoring The/A/An, continuous drag/swipe scroll that stops at the ends), plus liked/disliked tabs.
5. Literature screen: the photographic paperback with its approved cover; opening; page turns; dog-ear (like) and tear (dislike) with hover previews; the torn stack; keyboard controls. The book, dog-ear and tear are not yet formally signed off, so build them as specified and flag them for my review.

**Rules**
- High fidelity. Use the exact values, copy, timings and easings from the README and `prototype/Taste.dc.html` / `BookPage.dc.html`. Do not redesign, rename, restyle or add anything: no screen transitions, no new UI, no taste analysis or Journal.
- Do not build the items under "Do NOT build" in the README: the on-TV quick view, the 70s and "presents" covers, and dead animation phases.
- Copy the files in `prototype/assets/` into the app's static assets. Don't port `support.js` or `image-slot.js`.
- Key votes by stable film and excerpt IDs, not array index. Use the codebase's persistence.
- Keep the TV and the book in their fixed coordinate spaces (TV percentages and `cqw` units; the book's 660×520 space scaled by one transform).
- Test Chrome, Safari and Firefox, especially CSS 3D and `-webkit-mask-composite`.
- If something can't be reproduced exactly, or the README's open items come up (mobile touch behaviour, reduced motion, image resolution, TV photo rights), ask me instead of deciding yourself.

To check intended behaviour, run `npx serve design_handoff_pallas/prototype` and open `/Taste.dc.html`, `#cinema` and `#literature`.
