/* pallas taste engine — analysis. A pure, deterministic function of (judgments, feature library, options).
   It never writes anything: callers store results as snapshots, so improving the algorithm only means re-running it.
   See docs/taste-engine.md for the method, assumptions and limitations. */
(function (root, factory) {
  const isNode = typeof module === 'object' && module.exports;
  const api = factory(isNode ? require('./stats.js') : root.Pallas.taste.stats);
  if (isNode) module.exports = api;
  else { root.Pallas.taste.analyse = api.analyse; root.Pallas.taste.analysis = api; }
})(typeof self !== 'undefined' ? self : this, function (S) {
  'use strict';

  const VERSION = '1.1.0';

  // Every threshold the engine uses. Callers may override any of them; results record the values used.
  const DEFAULTS = {
    minJudgments: 8,          // fewer judged works than this: no associations are reported at all
    minExposure: 3,           // a characteristic must appear in at least this many judged works to be tested
    minAbsent: 2,             // … and be absent from at least this many, so there is something to compare with
    tentativeP: 0.1,          // tentative: uncorrected p below this, a difference of at least tentativeDiff,
    tentativeDiff: 0.25,      //   and a q below tentativeQ (so it is not simply one of many chance results)
    tentativeQ: 0.5,
    emergingQ: 0.2,           // emerging: false-discovery-rate-adjusted q below this
    wellQ: 0.05,              // well supported: false-discovery-rate-adjusted q below this …
    wellExposure: 6,          // … with at least this many exposures …
    wellWorks: 2,             // … drawn from at least this many different works
    pairMinItems: 4,          // a combination must cover at least this many judged works
    pairQ: 0.1,               // combinations are reported only below this q (they are many tests)
    pairMinLift: 0.2,         // and must differ from each single characteristic's like rate by at least this
    pairInteractionP: 0.05,   // and each member must matter among the works that have the other (Fisher p below this)
    leaveOneOutP: 0.05,       // emerging or better must keep p below this with any single film or book left out
    workWellP: 0.05,          // well supported must also hold at the level of works (see workLevel below) with p below this
    workEmergingP: 0.2,       // … and emerging with p below this
    explainedP: 0.1,          // a finding is 'explained by' a stronger one if, holding that one constant, its CMH p is above this
    focusedBelow: 0.6,        // spread: liked-set entropy / judged-set entropy below this = focused
    broadAbove: 0.9,          //                                                above this = broad
  };
  const LEVELS = ['tentative', 'emerging', 'well supported'];

  const pct = (x) => Math.round(x * 100) + '%';
  const r = S.round;

  /* judgments: { [itemId]: 'like' | 'dislike' }  (skips and undone votes are not judgments; see store.judgments)
     library:   output of Pallas.taste.features.cinema() / .literature()
     history:   optional event list (store.history(area)) for the consistency summary */
  function analyse({ judgments, library, history = [], options = {} }) {
    const O = { ...DEFAULTS, ...options };
    const items = library.items, terms = library.terms;
    const judged = Object.keys(judgments).filter((id) => items[id] && (judgments[id] === 'like' || judgments[id] === 'dislike')).sort();
    const notInLibrary = Object.keys(judgments).filter((id) => !items[id]).sort();
    const liked = new Set(judged.filter((id) => judgments[id] === 'like'));
    const n = judged.length, L = liked.size, Dn = n - L;
    const base = {
      engine: { name: 'pallas-taste', version: VERSION }, area: library.area, options: O, vocabularyVersion: library.vocabularyVersion || null,
      counts: { judged: n, likes: L, dislikes: Dn, likeRate: n ? r(L / n) : null, works: new Set(judged.map((id) => items[id].work)).size, notInLibrary: notInLibrary.length },
    };

    // Exposure of every characteristic among judged works.
    const exposure = new Map();
    for (const id of judged) for (const f of items[id].features) { if (!exposure.has(f)) exposure.set(f, []); exposure.get(f).push(id); }

    // Characteristics present in exactly the same judged works cannot be told apart: report them together.
    const groups = new Map();
    for (const [f, ids] of [...exposure].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
      const key = ids.join('|');
      if (!groups.has(key)) groups.set(key, { feature: f, aliases: [], ids });
      else groups.get(key).aliases.push(f);
    }

    const status = n < O.minJudgments ? 'insufficient' : !L || !Dn ? 'one-sided' : 'ok';
    const describe = (f) => ({ feature: f, ...(terms[f] || { label: f, basis: 'unknown' }) });
    const evidence = (ids, dir) => {
      const sup = ids.filter((id) => liked.has(id) === (dir > 0)), con = ids.filter((id) => liked.has(id) !== (dir > 0));
      const w = (list) => list.map((id) => ({ item: id, work: items[id].work }));
      return { supporting: w(sup), contradicting: w(con), supportingWorks: new Set(sup.map((id) => items[id].work)).size };
    };

    // Work-level 2×2 table for a characteristic (see the grading step).
    const byWorkIds = {};
    for (const id of judged) (byWorkIds[items[id].work] = byWorkIds[items[id].work] || []).push(id);
    function workLevel(ids) {
      const inF = new Set(ids); let a = 0, b = 0, c = 0, d = 0;
      for (const list of Object.values(byWorkIds)) for (const present of [true, false]) {
        const grp = list.filter((id) => inF.has(id) === present);
        if (!grp.length) continue;
        const k = grp.filter((id) => liked.has(id)).length * 2 - grp.length;
        if (k === 0) continue;
        if (present) k > 0 ? a++ : b++; else k > 0 ? c++ : d++;
      }
      return { p: a + b && c + d ? S.fisherExact(a, b, c, d) : 1, withUnits: a + b, withLiked: a };
    }

    // Single characteristics.
    const tested = [], insufficient = [];
    for (const g of groups.values()) {
      const nf = g.ids.length, kf = g.ids.filter((id) => liked.has(id)).length;
      if (status !== 'ok' || nf < O.minExposure || n - nf < O.minAbsent) { insufficient.push({ ...describe(g.feature), aliases: g.aliases, exposed: nf, liked: kf }); continue; }
      const p = S.fisherExact(kf, nf - kf, L - kf, Dn - (nf - kf));
      const rateIn = kf / nf, rateOut = (L - kf) / (n - nf);
      tested.push({ g, nf, kf, p, rateIn, rateOut, diff: rateIn - rateOut });
    }
    const qs = S.benjaminiHochberg(tested.map((t) => t.p));
    const findings = [], unremarkable = [];
    tested.forEach((t, i) => {
      const q = qs[i], dir = t.diff >= 0 ? 1 : -1, ev = evidence(t.g.ids, dir);
      let level = -1;
      if (t.p < O.tentativeP && Math.abs(t.diff) >= O.tentativeDiff && q < O.tentativeQ) level = 0;
      if (q < O.emergingQ) level = 1;
      if (q < O.wellQ && t.nf >= O.wellExposure && ev.supportingWorks >= O.wellWorks) level = 2;
      const notes = [], unit = library.area === 'cinema' ? 'film' : 'book';
      if (level > 0 && ev.supportingWorks < O.wellWorks) { level = 0; notes.push(`all supporting examples come from one ${unit}`); }
      // Leave-one-work-out: several stills from one film share their look, so a finding must not rest on any single
      // film (or book). Remove each supporting work's judged items in turn and re-test; the weakest result decides.
      if (level > 0) {
        let worst = 0, by = null;
        for (const w of new Set(ev.supporting.map((e) => e.work))) {
          const keep = judged.filter((id) => items[id].work !== w), inF = new Set(t.g.ids);
          const a = keep.filter((id) => inF.has(id) && liked.has(id)).length, b = keep.filter((id) => inF.has(id) && !liked.has(id)).length;
          const c = keep.filter((id) => !inF.has(id) && liked.has(id)).length, d = keep.filter((id) => !inF.has(id) && !liked.has(id)).length;
          const pw = a + b && c + d ? S.fisherExact(a, b, c, d) : 1;
          if (pw > worst) { worst = pw; by = w; }
        }
        t.looP = worst;
        if (worst >= O.leaveOneOutP) { level = Math.min(level, 0); notes.push(`depends on one ${unit} (${by}): without it the association is not clear`); }
      }
      // Work level: stills from one film are not independent. Within each work, its judged items with the characteristic
      // form one unit and those without form another; each unit counts as liked or disliked by majority (ties dropped).
      // The association must hold across these units, so a liked film's similar stills count once, not three times.
      if (level > 0) {
        const u = workLevel(t.g.ids);
        t.workP = u.p;
        if (level === 2 && u.p >= O.workWellP) { level = 1; notes.push(`holds across individual ${unit === 'film' ? 'stills' : 'passages'} but less clearly across ${unit}s (${u.withLiked} of ${u.withUnits} ${unit} groups with it liked)`); }
        if (level === 1 && u.p >= O.workEmergingP) { level = 0; if (!notes.length) notes.push(`not clear across ${unit}s`); }
      }
      const stats = { exposed: t.nf, likedWhenPresent: t.kf, rateWhenPresent: r(t.rateIn), rateWhenAbsent: r(t.rateOut), difference: r(t.diff), interval: S.wilson(t.kf, t.nf).map((x) => r(x)), p: r(t.p, 4), q: r(q, 4), ...(t.looP != null ? { leaveOneWorkOutP: r(t.looP, 4) } : {}), ...(t.workP != null ? { workLevelP: r(t.workP, 4) } : {}) };
      const row = { ...describe(t.g.feature), aliases: t.g.aliases.map(describe), direction: dir > 0 ? 'liked' : 'disliked', stats };
      if (level < 0) { unremarkable.push(row); return; }
      const lbl = (terms[t.g.feature] || {}).label || t.g.feature;
      findings.push({
        ...row, strength: LEVELS[level], evidence: ev, notes, ids: t.g.ids,
        explanation: `Liked ${t.kf} of ${t.nf} works with ${lbl} (${pct(t.rateIn)}), against ${L - t.kf} of ${n - t.nf} without it (${pct(t.rateOut)}).`,
      });
    });
    const order = (a, b) => LEVELS.indexOf(b.strength) - LEVELS.indexOf(a.strength) || a.stats.p - b.stats.p || Math.abs(b.stats.difference) - Math.abs(a.stats.difference) || (a.feature < b.feature ? -1 : 1);
    findings.sort(order);

    // Confounding: characteristics travel together (dark frames are often warm). For each finding, hold every stronger
    // finding from another dimension constant in turn; if the association then disappears, it is explained by that one.
    const strata = (B, A) => {
      const inA = new Set(A.ids), out = [];
      for (const present of [true, false]) {
        const grp = judged.filter((id) => inA.has(id) === present), inB = new Set(B.ids);
        const a = grp.filter((id) => inB.has(id) && liked.has(id)).length, b = grp.filter((id) => inB.has(id) && !liked.has(id)).length;
        const c = grp.filter((id) => !inB.has(id) && liked.has(id)).length, d = grp.filter((id) => !inB.has(id) && !liked.has(id)).length;
        out.push([a, b, c, d]);
      }
      return out;
    };
    // Joint strata: the works split by every combination of the two given findings (up to four groups).
    const strata2 = (B, A1, A2) => {
      const s1 = new Set(A1.ids), s2 = new Set(A2.ids), inB = new Set(B.ids), out = [];
      for (const x of [true, false]) for (const y of [true, false]) {
        const grp = judged.filter((id) => s1.has(id) === x && s2.has(id) === y);
        out.push([grp.filter((id) => inB.has(id) && liked.has(id)).length, grp.filter((id) => inB.has(id) && !liked.has(id)).length,
          grp.filter((id) => !inB.has(id) && liked.has(id)).length, grp.filter((id) => !inB.has(id) && !liked.has(id)).length]);
      }
      return out;
    };
    // Two-way test (1.1.0): B is 'explained by' A only if B's association disappears with A held constant while A's
    // survives with B held constant. If neither survives the other, they cannot be separated in these judgments and B is
    // marked 'inseparableFrom' A. A one-way test let whichever came first absorb the other even when the data simply
    // lacked the power to separate them (found when reviewing example profiles).
    findings.forEach((B, i) => {
      const stronger = findings.slice(0, i).filter((A) => !A.explainedBy && !A.inseparableFrom && A.dimension !== B.dimension);
      for (const A of stronger) {
        const bGivenA = S.cmh(strata(B, A));
        if (bGivenA.p <= O.explainedP) continue;
        const aGivenB = S.cmh(strata(A, B));
        if (aGivenB.p < O.emergingP) {
          B.explainedBy = { feature: A.feature, label: A.label, p: r(bGivenA.p, 4) };
          B.notes.push(`accounted for by ${A.label}: among works with and without it, ${B.label} makes no clear difference`);
        } else {
          B.inseparableFrom = { feature: A.feature, label: A.label, p: r(bGivenA.p, 4) };
          B.notes.push(`goes together with ${A.label} in these judgments; the two cannot be separated yet`);
        }
        return;
      }
      for (let x = 0; x < stronger.length; x++) for (let y = x + 1; y < stronger.length; y++) {
        const t = S.cmh(strata2(B, stronger[x], stronger[y]));
        if (t.p > O.explainedP) {
          B.explainedBy = { feature: stronger[x].feature, label: `${stronger[x].label} and ${stronger[y].label}`, also: stronger[y].feature, p: r(t.p, 4) };
          B.notes.push(`accounted for by ${stronger[x].label} and ${stronger[y].label} together`);
          return;
        }
      }
    });

    // Combinations of two characteristics from different dimensions whose joint like rate stands apart from each alone.
    const combos = [];
    if (status === 'ok') {
      const single = tested.map((t) => t).filter((t) => t.nf >= O.minExposure);
      const leads = findings.filter((f) => !f.explainedBy && !f.inseparableFrom && f.strength !== 'tentative');
      const cands = [];
      for (let i = 0; i < single.length; i++) for (let j = i + 1; j < single.length; j++) {
        const A = single[i], B = single[j], fa = A.g.feature, fb = B.g.feature;
        if (terms[fa] && terms[fb] && terms[fa].dimension === terms[fb].dimension) continue;
        const setB = new Set(B.g.ids), both = A.g.ids.filter((id) => setB.has(id));
        if (both.length < O.pairMinItems || both.length === A.nf || both.length === B.nf || n - both.length < O.minAbsent) continue;
        const k = both.filter((id) => liked.has(id)).length;
        const p0 = S.fisherExact(k, both.length - k, L - k, Dn - (both.length - k));
        // A pair must be associated beyond what the established single findings already explain: its p is the largest of
        // the plain test and the CMH tests holding constant each established finding from another dimension (a finding in a
        // member's own dimension is that member or its mirror image). The false-discovery
        // correction is then applied to these values.
        let p = p0;
        if (p0 < O.pairQ) for (const Lf of leads) if (Lf.dimension !== terms[fa].dimension && Lf.dimension !== terms[fb].dimension) p = Math.max(p, S.cmh(strata({ ids: both }, Lf)).p);
        cands.push({ A, B, both, k, p, pPlain: p0, rate: k / both.length });
      }
      const pq = S.benjaminiHochberg(cands.map((c) => c.p));
      // Interaction: within the works that have one member, the other must still make a clear difference (Fisher p < 0.05),
      // and the other way round. Without this, a single strong characteristic paired with almost anything looked like a
      // combination (68% of simulated people whose taste rested on black and white alone got one; see the stress report).
      const within = (inner, outer) => {
        const o = new Set(outer.g.ids), n2 = new Set(inner.g.ids), grp = judged.filter((id) => o.has(id));
        const a = grp.filter((id) => n2.has(id) && liked.has(id)).length, b = grp.filter((id) => n2.has(id) && !liked.has(id)).length;
        const c2 = grp.filter((id) => !n2.has(id) && liked.has(id)).length, d = grp.filter((id) => !n2.has(id) && !liked.has(id)).length;
        return a + b && c2 + d ? S.fisherExact(a, b, c2, d) : 1;
      };
      cands.forEach((c, i) => {
        const dirA = c.rate - c.A.rateIn, dirB = c.rate - c.B.rateIn;
        if (pq[i] >= O.pairQ || Math.sign(dirA) !== Math.sign(dirB) || Math.min(Math.abs(dirA), Math.abs(dirB)) < O.pairMinLift) return;
        if (within(c.B, c.A) >= O.pairInteractionP || within(c.A, c.B) >= O.pairInteractionP) return;
        const dir = c.rate >= L / n ? 1 : -1, ev = evidence(c.both, dir);
        const strong = pq[i] < O.wellQ && c.both.length >= O.wellExposure && ev.supportingWorks >= O.wellWorks;
        const la = (terms[c.A.g.feature] || {}).label, lb = (terms[c.B.g.feature] || {}).label;
        combos.push({
          features: [describe(c.A.g.feature), describe(c.B.g.feature)], direction: dir > 0 ? 'liked' : 'disliked',
          strength: strong ? 'well supported' : ev.supportingWorks >= O.wellWorks ? 'emerging' : 'tentative',
          stats: { exposed: c.both.length, likedWhenPresent: c.k, rateTogether: r(c.rate), rateFirstAlone: r(c.A.rateIn), rateSecondAlone: r(c.B.rateIn), p: r(c.pPlain, 4), pBeyondFindings: r(c.p, 4), q: r(pq[i], 4) },
          evidence: ev,
          explanation: `${la} with ${lb}: liked ${c.k} of ${c.both.length} (${pct(c.rate)}), against ${pct(c.A.rateIn)} for ${la} overall and ${pct(c.B.rateIn)} for ${lb} overall.`,
        });
      });
      combos.sort((a, b) => a.stats.q - b.stats.q || (a.features[0].feature + a.features[1].feature < b.features[0].feature + b.features[1].feature ? -1 : 1));
    }

    findings.forEach((f) => delete f.ids);

    // Spread: are likes concentrated in a few values of each dimension, or spread as widely as everything judged?
    const spread = {};
    if (L >= 5) {
      const dims = {};
      for (const f of Object.keys(terms)) { const d = terms[f].dimension; (dims[d] = dims[d] || []).push(f); }
      for (const [d, fs] of Object.entries(dims)) {
        const count = (ids) => { const c = {}; for (const id of ids) for (const f of items[id].features) if (terms[f] && terms[f].dimension === d) c[f] = (c[f] || 0) + 1; return c; };
        const all = count(judged), lk = count([...liked]);
        const cats = Object.keys(all).length;
        if (cats < 2) continue;
        const hAll = S.normalisedEntropy(all, cats), hLike = S.normalisedEntropy(lk, cats);
        const ratio = hAll ? hLike / hAll : 1;
        spread[d] = { label: (terms[fs[0]] || {}).dimensionLabel || d, ratio: r(ratio), reading: ratio < O.focusedBelow ? 'focused' : ratio > O.broadAbove ? 'broad' : 'mixed', valuesJudged: cats, valuesLiked: Object.keys(lk).length };
      }
    }
    const ratios = Object.values(spread).map((s) => s.ratio);
    const overallSpread = ratios.length ? r(ratios.reduce((a, b) => a + b, 0) / ratios.length) : null;

    // Consistency: works whose judgment the user changed (re-votes; undone events excluded).
    const undone = new Set(history.filter((e) => e.kind === 'undo').map((e) => e.undoes));
    const seq = {};
    for (const e of history) if ((e.kind === 'like' || e.kind === 'dislike') && !undone.has(e.id)) (seq[e.item] = seq[e.item] || []).push(e.kind);
    const changed = Object.entries(seq).filter(([, k]) => k.some((x, i) => i && x !== k[i - 1])).map(([id]) => id).sort();
    const byWork = {};
    for (const id of judged) { const w = items[id].work; byWork[w] = byWork[w] || { like: 0, dislike: 0 }; byWork[w][judgments[id]]++; }
    const splitWorks = Object.entries(byWork).filter(([, c]) => c.like && c.dislike).map(([w]) => w).sort();

    return {
      ...base, status,
      findings, combinations: combos,
      unremarkable: unremarkable.sort((a, b) => b.stats.exposed - a.stats.exposed || (a.feature < b.feature ? -1 : 1)),
      insufficient: insufficient.sort((a, b) => b.exposed - a.exposed || (a.feature < b.feature ? -1 : 1)),
      spread: { overall: overallSpread, reading: overallSpread == null ? null : overallSpread < O.focusedBelow ? 'focused' : overallSpread > O.broadAbove ? 'broad' : 'mixed', byDimension: spread },
      consistency: { changedJudgments: changed, worksWithMixedJudgments: splitWorks },
      testsRun: { single: tested.length },
    };
  }

  return { VERSION, DEFAULTS, LEVELS, analyse };
});
