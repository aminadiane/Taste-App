/* pallas taste engine — interpretation layer. Turns an analysis result into readable prose, separately from the
   statistics: it reads results, it never changes them, and it can be replaced wholesale (e.g. by a reviewed AI writer)
   as long as it keeps the output contract below.

   interpret({ result, library, judgments, knowledge, titleOf }) → {
     schema: 'pallas.interpretation/1', generator, basedOn, summary,
     sections: [{ id, kind, title, text, strength, claims: [{ statement, check, evidence: { liked, disliked } }] }]
   }
   Every claim carries a `check`: the numbers it rests on, in a form tests recompute from the judgments and library.
   Rules: only findings that are emerging or well supported are interpreted; craft explanations come from
   library/vocab/qualities.json and describe techniques, not people; every theme is illustrated with specific liked
   works and, where they exist, disliked ones; uncertainty is stated, never hidden. Deterministic. */
(function (root, factory) {
  const isNode = typeof module === 'object' && module.exports;
  const api = factory(isNode ? require('./stats.js') : root.Pallas.taste.stats);
  if (isNode) module.exports = api;
  else { root.Pallas = root.Pallas || {}; root.Pallas.taste = root.Pallas.taste || {}; root.Pallas.taste.interpret = api; }
})(typeof self !== 'undefined' ? self : this, function (S) {
  'use strict';

  const VERSION = '1.0.0';
  const RANK = { 'well supported': 3, emerging: 2, tentative: 1 };
  const pct = (x) => Math.round(x * 100) + '%';
  const list = (xs, and = 'and') => (xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ` ${and} ` + xs[xs.length - 1]);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function interpret({ result, library, judgments, knowledge, titleOf = (id) => id, options = {} }) {
    const O = { maxThemes: 3, maxConditions: 2, conditionQ: 0.1, conditionMin: 3, ...options };
    const area = result.area, noun = area === 'cinema' ? 'still' : 'passage', nouns = noun + 's', unit = area === 'cinema' ? 'film' : 'book';
    const items = library.items, terms = library.terms;
    const lbl = (f) => (terms[f] || {}).label || f;
    const has = (id, f) => items[id] && items[id].features.includes(f);
    const judged = Object.keys(judgments).filter((id) => items[id] && (judgments[id] === 'like' || judgments[id] === 'dislike')).sort();
    const liked = judged.filter((id) => judgments[id] === 'like'), disliked = judged.filter((id) => judgments[id] === 'dislike');
    const workOf = (id) => items[id].work;
    // Up to k examples, one per work, in a stable order (most matching features first, then id).
    const pick = (ids, k, score = () => 0) => {
      const seen = new Set(), out = [];
      for (const id of [...ids].sort((a, b) => score(b) - score(a) || (a < b ? -1 : 1))) { if (seen.has(workOf(id))) continue; seen.add(workOf(id)); out.push(id); if (out.length === k) break; }
      return out;
    };
    const titles = (ids) => list(ids.map(titleOf));
    const counts = (f) => { const e = judged.filter((id) => has(id, f)); return { exposed: e.length, liked: e.filter((id) => judgments[id] === 'like').length }; };
    const strengthWord = (s) => (s === 'well supported' ? 'consistently' : 'tend to');

    const out = {
      schema: 'pallas.interpretation/1', generator: { name: 'pallas-templates', version: VERSION, knowledge: knowledge && knowledge.version },
      area, basedOn: { engine: result.engine, judged: result.counts.judged, likes: result.counts.likes, status: result.status },
      summary: '', sections: [],
    };
    const sec = (s) => { out.sections.push(s); return s; };

    // Findings that may be interpreted: emerging or well supported. Explained / inseparable ones still describe a real
    // association in the person's choices, so they can count towards a quality, but never lead one on their own.
    const usable = result.findings.filter((f) => f.strength !== 'tentative');
    const lead = usable.filter((f) => !f.explainedBy && !f.inseparableFrom);
    const keysOf = (f) => [f.feature, ...(f.aliases || []).map((a) => a.feature)];
    const findingFor = (feature, dir) => usable.find((f) => f.direction === dir && keysOf(f).includes(feature));

    if (result.status !== 'ok' || (!lead.length && !(result.combinations || []).some((c) => c.strength !== 'tentative'))) {
      const why = result.status === 'insufficient' ? `${result.counts.judged} ${nouns} judged so far; nothing is interpreted until there are at least ${result.options.minJudgments}`
        : result.status === 'one-sided' ? `every ${noun} judged so far was ${result.counts.likes ? 'liked' : 'disliked'}, so there is nothing to compare`
          : `across ${result.counts.judged} ${nouns} no characteristic separates your likes from your dislikes clearly${result.counts.judged < 30 ? `; with this few judged, only a very strong preference could show yet` : ''}`;
      out.summary = cap(why) + '.';
      sec({ id: 'uncertainty', kind: 'uncertainty', title: 'What can be said so far', strength: null, text: out.summary + (result.status === 'ok' && result.spread.reading === 'broad' ? ` Your likes range as widely as everything you judged, which is itself a description: an eclectic eye, or one that responds to something these terms do not capture.` : ''), claims: [] });
      return out;
    }

    /* ---------- themes: craft qualities whose techniques appear among the person's findings ---------- */
    const qualities = (knowledge && knowledge[area]) || [];
    const combos = (result.combinations || []).filter((c) => c.strength !== 'tentative');
    const themeFor = (q, dir) => {
      const found = q.members.map((m) => findingFor(m, dir)).filter(Boolean);
      let uniq = [...new Map(found.map((f) => [f.feature, f])).values()];
      // A value already covered by a broader group term in the same theme is not listed twice (close-up within close shots).
      uniq = uniq.filter((f) => !uniq.some((g) => g !== f && terms[g.feature] && terms[g.feature].group && terms[g.feature].group.includes(f.feature)));
      // A combination of two members counts as evidence for the quality even when neither member is a finding alone.
      const combo = combos.find((c) => c.direction === dir && c.features.every((f) => q.members.includes(f.feature)));
      if (combo && uniq.length < Math.max(2, q.min)) return { q, found: uniq, combo, score: RANK[combo.strength] * 2 };
      if (uniq.length < q.min || !uniq.some((f) => !f.explainedBy && !f.inseparableFrom)) return null;
      const other = dir === 'liked' ? 'disliked' : 'liked';
      if (q.members.some((m) => { const c = findingFor(m, other); return c && !c.explainedBy && !c.inseparableFrom; })) return null;   // contradictory evidence: not a theme
      return { q, found: uniq, combo, score: uniq.reduce((s, f) => s + RANK[f.strength], 0) };
    };
    const pickThemes = (dir, max) => {
      const cands = qualities.map((q) => themeFor(q, dir)).filter(Boolean).sort((a, b) => b.score - a.score || b.found.length - a.found.length || (a.q.id < b.q.id ? -1 : 1));
      const chosen = [];
      const featsOf = (t) => (t.found.length ? t.found.map((f) => f.feature) : t.combo.features.map((f) => f.feature));
      for (const c of cands) {
        const keys = new Set(featsOf(c));
        if (chosen.some((x) => { const xf = featsOf(x); return xf.filter((f) => keys.has(f)).length >= Math.max(1, Math.min(keys.size, xf.length) * 0.6); })) continue;   // mostly the same evidence
        chosen.push(c); if (chosen.length === max) break;
      }
      return chosen;
    };

    const comboSection = (c, q) => {
      const [a, b] = c.features.map((f) => f.feature), n = (id) => (has(id, a) ? 1 : 0) + (has(id, b) ? 1 : 0);
      const pool = c.direction === 'liked' ? liked : disliked, opposite = c.direction === 'liked' ? disliked : liked;
      const examples = pick(pool.filter((id) => has(id, a) && has(id, b)), 3);
      const partial = pick(opposite.filter((id) => n(id) === 1), 2);
      const st = c.stats;
      let text = `${c.direction === 'liked' ? 'What you responded to is' : 'What you passed over is'} the meeting of ${lbl(a)} and ${lbl(b)}: ${st.likedWhenPresent} of ${st.exposed} ${nouns} with both ${c.direction === 'liked' ? 'were liked' : 'were liked, fewer than either alone suggests'}, against ${pct(st.rateFirstAlone)} for ${lbl(a)} and ${pct(st.rateSecondAlone)} for ${lbl(b)} overall. Neither works alone.`;
      if (q) text += ` ${q.explains}`;
      if (examples.length) text += ` ${c.direction === 'liked' ? 'You can see it in' : 'For instance'} ${titles(examples)}.`;
      if (partial.length) text += ` ${c.direction === 'liked' ? 'By contrast, you did not like' : 'Yet you did like'} ${list(partial.map((id) => `${titleOf(id)} (${has(id, a) ? lbl(a) : lbl(b)} only)`), c.direction === 'liked' ? 'or' : 'and')}.`;
      return sec({
        id: `${q ? 'theme-' + q.id : 'combination-' + a + '+' + b}`, kind: c.direction === 'liked' ? 'theme' : 'aversion', title: cap(q ? q.name : `${lbl(a)} with ${lbl(b)}`), strength: c.strength, text,
        claims: [{ statement: `${lbl(a)} with ${lbl(b)}: ${st.likedWhenPresent}/${st.exposed} liked.`, check: { type: 'joint', a, b, liked: st.likedWhenPresent, exposed: st.exposed }, evidence: { liked: c.direction === 'liked' ? examples : partial, disliked: c.direction === 'liked' ? partial : examples } }],
      });
    };

    const themeSection = (t, dir) => {
      if (t.combo && t.found.length < 2) return comboSection(t.combo, t.q);
      const feats = t.found.map((f) => f.feature);
      const n = (id) => feats.filter((f) => has(id, f)).length;
      const pool = dir === 'liked' ? liked : disliked, opposite = dir === 'liked' ? disliked : liked;
      const need = Math.min(2, feats.length);
      const examples = pick(pool.filter((id) => n(id) >= need), 3, n);
      // Counterpoint: works on the other side that share one of these techniques but not the rest.
      const partial = pick(opposite.filter((id) => n(id) === 1 && feats.length > 1), 2, () => 0);
      const strongest = t.found.reduce((a, b) => (RANK[b.strength] > RANK[a.strength] ? b : a));
      const part = (f) => `${f.label} (${f.stats.likedWhenPresent} of ${f.stats.exposed} liked)`;
      const firm = t.found.filter((f) => f.strength === 'well supported'), loose = t.found.filter((f) => f.strength !== 'well supported');
      const who = dir === 'liked' ? `The ${nouns} you liked` : `The ${nouns} you passed over`;
      const parts = t.found.map(part);
      const verb = `${who} ${strengthWord(strongest.strength)} share`;
      const lead1 = firm.length && loose.length ? `${who} consistently share ${list(firm.map(part))}, and more loosely ${list(loose.map(part))}.` : `${verb} ${list(parts)}.`;
      let text = `${lead1} ${t.q.explains}`;
      if (examples.length) text += ` ${dir === 'liked' ? 'You can see it in' : 'For instance'} ${titles(examples)}.`;
      if (partial.length) {
        const which = (id) => lbl(feats.find((f) => has(id, f)));
        const missing = (id) => { const m = feats.filter((f) => !has(id, f)).map(lbl); return m.length === 1 ? m[0] : 'the others'; };
        text += ` ${dir === 'liked' ? 'By contrast, you did not like' : 'Yet you did like'} ${list(partial.map((id) => `${titleOf(id)} (${which(id)}, but not ${missing(id)})`), dir === 'liked' ? 'or' : 'and')}.`;
      }
      if (t.found.some((f) => f.basis === 'interpretation')) text += ' Part of this rests on subjective readings of mood.';
      return sec({
        id: `${dir === 'liked' ? 'theme' : 'aversion'}-${t.q.id}`, kind: dir === 'liked' ? 'theme' : 'aversion', title: cap(t.q.name), strength: strongest.strength, text,
        claims: [{
          statement: lead1,
          check: { type: 'rates', direction: dir, features: t.found.map((f) => ({ feature: f.feature, liked: f.stats.likedWhenPresent, exposed: f.stats.exposed })) },
          evidence: { liked: dir === 'liked' ? examples : partial, disliked: dir === 'liked' ? partial : examples },
        }],
      });
    };

    const likedThemes = pickThemes('liked', O.maxThemes);
    likedThemes.forEach((t) => themeSection(t, 'liked'));

    const usedCombo = new Set(likedThemes.filter((t) => t.combo).map((t) => t.combo));
    for (const c of combos.filter((x) => x.direction === 'liked' && !usedCombo.has(x)).slice(0, 1)) comboSection(c, null);

    // A clear finding that no quality covers is still reported plainly, with its own examples.
    const covered = new Set(likedThemes.flatMap((t) => t.found.map((f) => f.feature)));
    const mirrored = (f) => usable.some((g) => g.direction !== f.direction && g.dimension === f.dimension && !g.explainedBy && !g.inseparableFrom && RANK[g.strength] >= RANK[f.strength]);
    for (const f of lead.filter((x) => x.direction === 'liked' && !covered.has(x.feature) && !mirrored(x)).slice(0, Math.max(0, 3 - likedThemes.length))) {
      const ex = pick(liked.filter((id) => has(id, f.feature)), 3);
      const d = (terms[f.feature] || {}).definition;
      sec({
        id: `finding-${f.feature}`, kind: 'finding', title: cap(f.label), strength: f.strength,
        text: `You ${f.strength === 'well supported' ? 'consistently' : 'tend to'} like ${nouns} with ${f.label}${d ? ` (${d.charAt(0).toLowerCase() + d.slice(1).replace(/\.$/, '')})` : ''}: ${f.stats.likedWhenPresent} of ${f.stats.exposed}, against ${pct(f.stats.rateWhenAbsent)} of the others. ${ex.length ? `For example ${titles(ex)}.` : ''}`.trim(),
        claims: [{ statement: `${f.label}: ${f.stats.likedWhenPresent} of ${f.stats.exposed} liked.`, check: { type: 'rates', direction: 'liked', features: [{ feature: f.feature, liked: f.stats.likedWhenPresent, exposed: f.stats.exposed }] }, evidence: { liked: ex, disliked: [] } }],
      });
    }

    // When nothing liked leads (the taste shows mainly as an aversion), name the liked side the statistics do support,
    // saying plainly that it is the reverse of what is passed over.
    if (!out.sections.some((x) => x.kind === 'theme' || x.kind === 'finding')) {
      for (const f of usable.filter((x) => x.direction === 'liked').slice(0, 2)) {
        const ex = pick(liked.filter((id) => has(id, f.feature)), 3), by = f.explainedBy || f.inseparableFrom;
        sec({
          id: `finding-${f.feature}`, kind: 'finding', title: cap(f.label), strength: f.strength,
          text: `You liked ${f.stats.likedWhenPresent} of ${f.stats.exposed} ${nouns} with ${f.label}, against ${pct(f.stats.rateWhenAbsent)} of the others${by ? `, largely the other side of how you judged ${by.label}` : ''}. ${ex.length ? `For example ${titles(ex)}.` : ''}`.trim(),
          claims: [{ statement: `${f.label}: ${f.stats.likedWhenPresent} of ${f.stats.exposed} liked.`, check: { type: 'rates', direction: 'liked', features: [{ feature: f.feature, liked: f.stats.likedWhenPresent, exposed: f.stats.exposed }] }, evidence: { liked: ex, disliked: [] } }],
        });
      }
    }

    /* ---------- conditions: within a liked characteristic, what made the difference ---------- */
    const featureList = Object.keys(terms);
    let conditions = 0;
    // Anchored on well-supported likes; a B that forms a quality already described together with A adds nothing new.
    const themed = (a, b) => likedThemes.some((t) => t.found.some((f) => f.feature === a) && t.q.members.includes(b));
    for (const A of lead.filter((f) => f.direction === 'liked' && f.strength === 'well supported')) {
      if (conditions >= O.maxConditions) break;
      const inA = judged.filter((id) => has(id, A.feature));
      const cands = [];
      for (const B of featureList) {
        if (terms[B].dimension === A.dimension || keysOf(A).includes(B) || themed(A.feature, B)) continue;
        const w = inA.filter((id) => has(id, B)), wo = inA.filter((id) => !has(id, B));
        if (w.length < O.conditionMin || wo.length < O.conditionMin) continue;
        const k1 = w.filter((id) => judgments[id] === 'like').length, k2 = wo.filter((id) => judgments[id] === 'like').length;
        if (k1 / w.length <= k2 / wo.length) continue;   // we describe what raised liking within A
        cands.push({ B, w, wo, k1, k2, p: S.fisherExact(k1, w.length - k1, k2, wo.length - k2) });
      }
      if (!cands.length) continue;
      const q = S.benjaminiHochberg(cands.map((c) => c.p));
      const best = cands.map((c, i) => ({ ...c, q: q[i] })).filter((c) => c.q < O.conditionQ).sort((a, b) => a.p - b.p || (a.B < b.B ? -1 : 1))[0];
      if (!best) continue;
      conditions++;
      const exWith = pick(best.w.filter((id) => judgments[id] === 'like'), 2), exWithout = pick(best.wo.filter((id) => judgments[id] === 'dislike'), 2);
      const shared = qualities.find((qq) => qq.members.includes(A.feature) && qq.members.includes(best.B));
      sec({
        id: `condition-${A.feature}-${best.B}`, kind: 'condition', title: `${cap(A.label)}, with ${lbl(best.B)}`, strength: best.q < 0.05 ? 'well supported' : 'emerging',
        text: `Not every ${noun} with ${A.label} appealed equally. Among them you liked ${best.k1} of ${best.w.length} with ${lbl(best.B)}, but only ${best.k2} of ${best.wo.length} without it.${shared ? ` Together they make ${shared.name}.` : ''} Compare ${titles(exWith)} with ${titles(exWithout)}.`,
        claims: [{
          statement: `Within ${A.label}: ${best.k1}/${best.w.length} liked with ${lbl(best.B)}, ${best.k2}/${best.wo.length} without.`,
          check: { type: 'within', a: A.feature, b: best.B, with: [best.k1, best.w.length], without: [best.k2, best.wo.length] },
          evidence: { liked: exWith, disliked: exWithout },
        }],
      });
    }

    /* ---------- strands: two lines of liking that rarely meet ---------- */
    // Candidate strands: unexplained liked findings and liked combinations, each with at least 4 liked works.
    const strandOf = (x) => (x.features
      ? { label: `${x.features[0].label} with ${x.features[1].label}`, a: x.features[0].feature, b: x.features[1].feature, dims: x.features.map((f) => f.dimension), ids: x.evidence.supporting.map((e) => e.item), strength: x.strength }
      : { label: x.label, a: x.feature, dims: [x.dimension], ids: x.evidence.supporting.map((e) => e.item), strength: x.strength });
    const lk = [...combos.filter((c) => c.direction === 'liked'), ...lead.filter((f) => f.direction === 'liked')].map(strandOf).filter((x) => x.ids.length >= 4);
    outer: for (let i = 0; i < lk.length; i++) for (let j = i + 1; j < lk.length; j++) {
      const a = new Set(lk[i].ids), b = lk[j].ids;
      const both = b.filter((x) => a.has(x)).length, union = new Set([...a, ...b]).size;
      if (!lk[i].dims.some((d) => lk[j].dims.includes(d)) && both / union < 0.15) {
        sec({
          id: 'strands', kind: 'strands', title: 'Two separate strands', strength: [lk[i], lk[j]].every((f) => f.strength === 'well supported') ? 'well supported' : 'emerging',
          text: `Your likes follow two lines that rarely meet: ${lk[i].label} (${a.size} liked, for example ${titles(pick([...a], 2))}) and ${lk[j].label} (${b.length} liked, for example ${titles(pick(b, 2))}). Only ${both} liked ${both === 1 ? noun : nouns} ${both === 1 ? 'has' : 'have'} both, so these read as two tastes rather than one.`,
          claims: [{ statement: `${lk[i].label} and ${lk[j].label} overlap in ${both} of ${union} liked ${nouns}.`, check: { type: 'overlap', a: lk[i].ids, b: lk[j].ids, both, union }, evidence: { liked: [...pick([...a], 2), ...pick(b, 2)], disliked: [] } }],
        });
        break outer;
      }
    }

    /* ---------- aversions ---------- */
    const dislikedThemes = pickThemes('disliked', 1);
    dislikedThemes.forEach((t) => themeSection(t, 'disliked'));
    if (!dislikedThemes.length) {
      const likedDims = new Set(lead.filter((f) => f.direction === 'liked').map((f) => f.dimension));
      const d = lead.filter((f) => f.direction === 'disliked' && !likedDims.has(f.dimension)).slice(0, 2);
      if (d.length) {
        const ex = pick(disliked.filter((id) => d.some((f) => has(id, f.feature))), 2);
        sec({
          id: 'aversion', kind: 'aversion', title: 'Less drawn to', strength: d[0].strength,
          text: `You were less drawn to ${list(d.map((f) => `${f.label} (${f.stats.likedWhenPresent} of ${f.stats.exposed} liked)`))}${ex.length ? `, as in ${titles(ex)}` : ''}. A dislike is as informative as a like; it describes your eye, not a gap in it.`,
          claims: [{ statement: `Less drawn to ${list(d.map((f) => f.label))}.`, check: { type: 'rates', direction: 'disliked', features: d.map((f) => ({ feature: f.feature, liked: f.stats.likedWhenPresent, exposed: f.stats.exposed })) }, evidence: { liked: [], disliked: ex } }],
        });
      }
    }

    /* ---------- uncertainty ---------- */
    const presented = new Set(out.sections.flatMap((x) => x.claims.flatMap((c) => (c.check.features || []).map((f) => f.feature).concat([c.check.a, c.check.b].filter((v) => typeof v === 'string')))));
    const early = usable.filter((f) => f.strength === 'emerging' && !f.explainedBy && !f.inseparableFrom && !presented.has(f.feature));
    const together = usable.filter((f) => f.inseparableFrom && (usable.find((g) => g.feature === f.inseparableFrom.feature) || {}).direction === f.direction).slice(0, 3);
    const rare = (result.insufficient || []).filter((x) => x.exposed >= 2 && !['setting', 'figures', 'medium'].includes(x.dimension)).slice(0, 3);
    const u = [];
    if (early.length) u.push(`${cap(list(early.slice(0, 3).map((f) => f.label)))} ${early.length === 1 ? 'is an early sign' : 'are early signs'} that more judgments could confirm or dissolve.`);
    if (together.length) u.push(`Some characteristics cannot yet be told apart because they occur in nearly the same ${nouns}: ${list(together.map((f) => `${f.label} with ${lbl(f.inseparableFrom.feature)}`))}.`);
    if (rare.length) u.push(`There are too few examples to say anything about ${list(rare.map((x) => `${x.label} (${x.exposed} judged)`))}.`);
    u.push(`All of this compares your own likes with your own dislikes among ${result.counts.judged} ${nouns}; it is not a comparison with anyone else.`);
    sec({ id: 'uncertainty', kind: 'uncertainty', title: 'How sure this is', strength: null, text: u.join(' '), claims: [] });

    // Summary: the leading themes in one sentence.
    const names = out.sections.filter((s) => s.kind === 'theme' || s.kind === 'finding').map((s) => s.title.toLowerCase());
    const strands = out.sections.find((s) => s.kind === 'strands');
    const away = out.sections.filter((s) => s.kind === 'aversion').map((s) => (s.id === 'aversion' ? s.claims[0].statement.replace(/^Less drawn to /, '').replace(/\.$/, '') : s.title.toLowerCase()));
    const head = `Across ${result.counts.judged} ${nouns} from ${result.counts.works} ${unit}s`;
    out.summary = names.length
      ? `${head}, the clearest thread${names.length > 1 ? 's are' : ' is'} ${list(names)}${strands ? ', in two separate strands' : ''}${away.length ? `; you were less drawn to ${list(away)}` : ''}.`
      : `${head}, the clearest pattern is in what you pass over: ${list(away)}.`;
    return out;
  }

  // Plain text rendering, for review and tests.
  function toText(interp) {
    return [interp.summary, ...interp.sections.map((s) => `${s.title}${s.strength ? ` (${s.strength})` : ''}. ${s.text}`)].join('\n\n');
  }

  return { VERSION, interpret, toText };
});
