/* pallas taste engine — feature extraction. Turns a content library plus its vocabulary into one shape the engine
   reads, so cinema and literature share all analysis code:
     { items: { [itemId]: { work, features: ['dimension:value', …] } },
       terms: { 'dimension:value': { dimension, value, label, definition, basis, dimensionLabel } } }
   Content metadata is read, never modified. A new vocabulary term needs no code change. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.Pallas = root.Pallas || {}; root.Pallas.taste = root.Pallas.taste || {}; root.Pallas.taste.features = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function termTable(vocab) {
    const terms = {};
    for (const [dim, d] of Object.entries(vocab.dimensions || {})) {
      for (const [val, v] of Object.entries(d.values || {})) {
        terms[`${dim}:${val}`] = { dimension: dim, value: val, label: v.label, definition: v.definition, basis: d.basis, dimensionLabel: d.label };
      }
    }
    return terms;
  }

  // Adds dimension values to a feature list, skipping empty and unknown values (unknown terms are reported).
  function push(out, terms, dim, val, unknown) {
    for (let v of [].concat(val == null ? [] : val)) {
      if (v === true) v = 'yes';
      if (v === false || v === '' || v == null) continue;
      const key = `${dim}:${v}`;
      if (terms[key]) out.push(key); else unknown.add(key);
    }
  }

  // Cinema: stills.json + cinema-metadata.json + vocab/cinema.json. Work = film slug.
  function cinema(stillsDoc, metaDoc, vocab) {
    const terms = termTable(vocab), items = {}, unknown = new Set();
    for (const s of stillsDoc.stills || []) {
      const m = (metaDoc.stills || {})[s.id];
      if (!m) continue;
      const f = [];
      for (const [dim, v] of Object.entries((m.measured && m.measured.values) || {})) push(f, terms, dim, v, unknown);
      for (const [dim, v] of Object.entries(m.observed || {})) if (dim !== 'method' && dim !== 'recorded') push(f, terms, dim, v, unknown);
      if (m.interpretation) push(f, terms, 'atmosphere', m.interpretation.atmosphere, unknown);
      items[s.id] = { work: s.film, features: [...new Set(f)].sort() };
    }
    return { area: 'cinema', items, terms, unknown: [...unknown].sort() };
  }

  // Literature: literature.json + vocab/literature.json. Work = book slug.
  function literature(litDoc, vocab) {
    const terms = termTable(vocab), items = {}, unknown = new Set();
    for (const p of litDoc.passages || []) {
      const md = p.metadata || {};
      if (!md.features) continue;
      const f = [];
      for (const [dim, v] of Object.entries(md.features)) push(f, terms, dim, v, unknown);
      for (const [dim, v] of Object.entries((md.interpretation && md.interpretation.features) || {})) push(f, terms, dim, v, unknown);
      items[p.id] = { work: p.book, features: [...new Set(f)].sort() };
    }
    return { area: 'literature', items, terms, unknown: [...unknown].sort() };
  }

  return { termTable, cinema, literature };
});
