/* pallas — Taste Journal data. No interface yet: this module only assembles what a future Journal screen will show.
   build() is a pure function of the store's exported document and the feature libraries, so the Journal needs no
   storage of its own and works with anonymous browser persistence (and later with an account, unchanged).
   In the browser: await Pallas.journal.build()  →  a 'pallas.journal/1' object. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.Pallas = root.Pallas || {}; root.Pallas.journal = Object.assign(root.Pallas.journal || {}, api); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SCHEMA = 'pallas.journal/1';
  const JUDGE = new Set(['like', 'dislike', 'skip']);
  // Dimensions that count as techniques for "techniques encountered" (the rest describe content, not craft).
  const TECHNIQUE_DIMENSIONS = {
    cinema: ['lightQuality', 'lightDirection', 'lightSource', 'shotScale', 'angle', 'composition', 'focus', 'layers', 'key', 'contrast', 'saturation', 'toned'],
    literature: ['narration', 'person', 'tense', 'syntax', 'sentenceLength', 'diction', 'figuration', 'dialogue', 'pace', 'device'],
  };

  function areaJournal(doc, area, library, compare) {
    const events = doc.events.filter((e) => e.area === area);
    const undone = new Set(events.filter((e) => e.kind === 'undo').map((e) => e.undoes));
    const live = events.filter((e) => JUDGE.has(e.kind) && !undone.has(e.id));
    const byItem = new Map();
    for (const e of live) { if (!byItem.has(e.item)) byItem.set(e.item, []); byItem.get(e.item).push(e); }
    const items = (library && library.items) || {}, terms = (library && library.terms) || {};

    // Works and their histories. A work is "evaluated" when its latest effective event is a like or dislike.
    const works = [], skipped = [], changes = [];
    for (const [item, list] of byItem) {
      const last = list[list.length - 1], votes = list.filter((e) => e.kind !== 'skip');
      for (let i = 1; i < votes.length; i++) if (votes[i].kind !== votes[i - 1].kind) changes.push({ item, work: (items[item] || {}).work || last.work, from: votes[i - 1].kind, to: votes[i].kind, at: votes[i].t });
      if (last.kind === 'skip') { skipped.push({ item, at: last.t, session: last.session }); continue; }
      works.push({
        item, work: (items[item] || {}).work || last.work, judgment: last.kind, firstAt: list[0].t, lastAt: last.t,
        timesJudged: votes.length, changed: votes.some((e, i) => i && e.kind !== votes[i - 1].kind),
        history: list.map((e) => ({ t: e.t, kind: e.kind, session: e.session })), inLibrary: !!items[item],
      });
    }
    works.sort((a, b) => (a.lastAt < b.lastAt ? 1 : a.lastAt > b.lastAt ? -1 : a.item < b.item ? -1 : 1));
    changes.sort((a, b) => (a.at < b.at ? -1 : 1));

    // Activity by month and by session (counts of the events as they happened, undone ones included and marked).
    const months = {}, sessions = {};
    for (const e of events) {
      const m = e.t.slice(0, 7), s = e.session || 'none';
      const bump = (o, k) => { o[k] = o[k] || { likes: 0, dislikes: 0, skips: 0, undos: 0 }; return o[k]; };
      const key = e.kind === 'like' ? 'likes' : e.kind === 'dislike' ? 'dislikes' : e.kind === 'skip' ? 'skips' : 'undos';
      bump(months, m)[key]++; bump(sessions, s)[key]++;
    }
    const sessionMeta = new Map((doc.sessions || []).filter((s) => s.area === area).map((s) => [s.id, s]));
    const timeline = {
      byMonth: Object.keys(months).sort().map((m) => ({ period: m, ...months[m] })),
      bySession: Object.keys(sessions).map((id) => ({ session: id, startedAt: (sessionMeta.get(id) || {}).startedAt || null, endedAt: (sessionMeta.get(id) || {}).endedAt || null, ...sessions[id] })).sort((a, b) => ((a.startedAt || '') < (b.startedAt || '') ? -1 : 1)),
    };

    // Techniques encountered: characteristics of the works responded to (judged or skipped), with first encounter.
    const dims = new Set(TECHNIQUE_DIMENSIONS[area] || []), tech = {};
    for (const [item, list] of byItem) {
      const it = items[item];
      if (!it) continue;
      const last = list[list.length - 1].kind;
      for (const f of it.features) {
        const t = terms[f];
        if (!t || !dims.has(t.dimension)) continue;
        const x = tech[f] = tech[f] || { term: f, label: t.label, definition: t.definition, dimension: t.dimensionLabel, basis: t.basis, works: 0, liked: 0, disliked: 0, skipped: 0, firstAt: list[0].t };
        x.works++; x[last === 'like' ? 'liked' : last === 'dislike' ? 'disliked' : 'skipped']++;
        if (list[0].t < x.firstAt) x.firstAt = list[0].t;
      }
    }
    const techniques = Object.values(tech).sort((a, b) => b.works - a.works || (a.term < b.term ? -1 : 1));

    // Saved profiles and how each differs from the one before.
    const profiles = (doc.profiles || []).filter((p) => p.area === area);
    const profileHistory = profiles.map((p) => ({ id: p.id, generatedAt: p.generatedAt || p.createdAt, engine: p.engine || null, evidenceLevel: p.evidenceLevel || null, summary: (p.signature && p.signature.summary) || null, judged: p.basedOn ? p.basedOn.judged : null }));
    const profileChanges = compare && profiles.length > 1 ? profiles.slice(1).map((p, i) => compare(profiles[i], p)) : [];

    const reflections = (doc.reflections || []).filter((r) => r.area === area);
    return {
      counts: { evaluated: works.length, liked: works.filter((w) => w.judgment === 'like').length, disliked: works.filter((w) => w.judgment === 'dislike').length, skipped: skipped.length, changed: changes.length, reflections: reflections.length, profiles: profiles.length },
      works, skipped, preferenceChanges: changes, timeline, techniques, profiles: profileHistory, profileChanges, reflections,
    };
  }

  /* doc: Pallas.store.exportData(); libraries: { cinema, literature } from Pallas.taste.features;
     compare: Pallas.taste.profiles.compare (optional); generatedAt: passed in for reproducible output. */
  function build({ doc, libraries = {}, compare = null, generatedAt = null }) {
    const areas = {};
    for (const a of ['cinema', 'literature']) areas[a] = areaJournal(doc, a, libraries[a], compare);
    return {
      schema: SCHEMA, generatedAt,
      owner: { anonId: doc.owner && doc.owner.anonId, accountId: (doc.owner && doc.owner.accountId) || null },
      areas,
      reflectionsWithoutArea: (doc.reflections || []).filter((r) => !r.area),
      learning: { encountered: doc.encountered || {} },
    };
  }

  const api = { SCHEMA, TECHNIQUE_DIMENSIONS, build };
  // Browser convenience: assemble the journal from the live store and the libraries.
  if (typeof window !== 'undefined') {
    api.current = async () => {
      const P = window.Pallas, T = P.taste;
      const [cinema, literature] = await Promise.all([T.library('cinema'), T.library('literature')]);
      return build({ doc: P.store.exportData(), libraries: { cinema, literature }, compare: T.profiles.compare, generatedAt: new Date().toISOString() });
    };
  }
  return api;
});
