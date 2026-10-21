/* pallas taste engine — browser facade. Connects the pure modules to Pallas.store and the library files.
   Nothing here is visible: no screen calls it yet. Use from code or the console:
     await Pallas.taste.profile('cinema')        → a profile computed now, not saved
     await Pallas.taste.snapshot('literature')   → computed and saved to the store's profile history
   Recalculating never changes the event log, so an improved engine can regenerate every profile. */
(function (root) {
  'use strict';
  const P = root.Pallas = root.Pallas || {};
  const T = P.taste = P.taste || {};
  const SOURCES = {
    cinema: { files: ['library/stills.json', 'library/cinema-metadata.json', 'library/vocab/cinema.json'], build: (s, m, v) => T.features.cinema(s, m, v) },
    literature: { files: ['library/literature.json', 'library/vocab/literature.json'], build: (l, v) => T.features.literature(l, v) },
  };
  const cache = {};

  async function library(area) {
    const src = SOURCES[area];
    if (!src) throw new Error('unknown area ' + area);
    if (!cache[area]) cache[area] = Promise.all(src.files.map((f) => fetch(f, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(f + ' ' + r.status); return r.json(); }))).then((docs) => src.build(...docs));
    return cache[area];
  }

  // The judgments the engine reads: latest like / dislike per item, skips and undone votes excluded.
  function judgments(area) {
    const all = P.store.judgments(area), out = {};
    for (const [k, v] of Object.entries(all)) if (v === 'like' || v === 'dislike') out[k] = v;
    return out;
  }

  async function profile(area, options) {
    const lib = await library(area), j = judgments(area), history = P.store.history(area);
    const result = T.analyse({ judgments: j, library: lib, history, options });
    return T.profiles.build(result, { judgments: j, history, generatedAt: new Date().toISOString() });
  }

  async function snapshot(area, options) {
    const p = await profile(area, options);
    return P.store.addProfile(p);
  }

  // A new snapshot from the same events, for when the engine or the metadata has improved. Earlier snapshots stay.
  async function regenerate(area, options) {
    const prev = P.store.latestProfile(area), p = await profile(area, options);
    return P.store.addProfile({ ...p, regeneratedFrom: prev ? { id: prev.id, engine: prev.engine, generatedAt: prev.generatedAt } : null });
  }

  // How the latest snapshot differs from the one before it, or null.
  function lastChange(area) {
    const list = P.store.profiles(area);
    return list.length > 1 ? T.profiles.compare(list[list.length - 2], list[list.length - 1]) : null;
  }

  // Whether the latest saved profile is out of date (newer engine, changed vocabulary, new judgments).
  async function staleness(area) {
    const lib = await library(area);
    return T.profiles.staleness(P.store.latestProfile(area), { engineVersion: T.analysis.VERSION, vocabularyVersion: lib.vocabularyVersion, judgments: judgments(area) });
  }

  Object.assign(T, { library, judgments, profile, snapshot, regenerate, lastChange, staleness });
})(typeof self !== 'undefined' ? self : this);
