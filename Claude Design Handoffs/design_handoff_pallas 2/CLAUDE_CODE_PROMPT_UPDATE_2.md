I've updated the Pallas designs in Claude Design. The new spec is `design_handoff_pallas/UPDATE_2.md`; it supersedes `design_handoff_pallas/README.md` wherever they differ. The design source is `design_handoff_pallas/prototype/Taste v2.dc.html` (Home, Film, Literature, shelf) and `design_handoff_pallas/prototype/Taste Profile.dc.html` (taste profile, concept 1b only). Read UPDATE_2.md in full, then the relevant source, before writing code.

**Step 1: inspect before changing anything**
1. Review what's already implemented in this codebase from the first handoff (Home, Film, Literature, quick-view drawer, voting, persistence), plus the existing film list and stills.
2. Diff `prototype/Taste v2.dc.html` against `prototype/Taste.dc.html` to see exactly what changed.
3. Report back what already works, what this update changes, and your plan. Wait for my go-ahead.
4. Preserve all working functionality. Integrate into the existing structure; don't rebuild working code.

**Step 2: implement, in this order**
1. Removals: the `still 01 / 06` and `excerpt 01 / 05` counters, and the torn-page stack. Fix the closed book cover so a click anywhere opens it.
2. Home: the `cultural capital` link, the your-taste bar (after 5 responses), the bold `taste` link, and the TV and book objects (side by side on desktop, stacked and scrolling on phones).
3. Shelf: the desktop rail (≥ 900px), the mobile mini shelf (< 900px), and the fly-in on every response, wired to real vote data.
4. Film on phones: the remote with side-by-side buttons, tilt to vote, and the one-time tilt hint.
5. Literature on phones: the single-page view, scrub bar, swipe-left tear and swipe-right dog-ear, buttons, and the one-time swipe hint.
6. Taste Profile, sorting table (1b) and empty state, wired to the analysis engine's real outputs.

**Rules**
- High fidelity. Use the exact values, copy, timings and easings from UPDATE_2.md and the source. Don't redesign or "improve" anything.
- Build only what's approved. Skip everything under "Do not build" (concept 1a, the 70s cover, tweak switches, the review-board wrappers).
- `Pallas Mobile.dc.html` is a review board, not a screen.
- The `FINDINGS` text, the film and book data, and the stills are stand-ins. Use the real data, and never invent findings or scores.
- Flag the assets that need licensing (`home-tv.png`, `home-book.png`, the remote images) in your report. Use them for now.
- Test the phone gestures on real iOS Safari and Android Chrome, and respect `prefers-reduced-motion`.
- After each step, tell me what changed and anything you couldn't match exactly.
