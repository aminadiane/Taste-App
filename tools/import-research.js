// Integrates a research batch (CSV from ChatGPT Work or the same format) into library/literature.json.
// Usage: node tools/import-research.js <research.csv> [features.json]
//
// - Adds bibliographic records and passage records with source, locator, notes and metadata.
// - Every new passage is 'needs-text'. Placeholder text in the research files is never read as literature.
// - Records already present (same research id, same book slug, or same title and author) are skipped, never overwritten.
// - Existing passages, their text and every vote keyed by their ids are untouched.
// - Writes a .bak, then runs the validator; nothing is written if any row is unusable.
const fs = require('node:fs');
const path = require('node:path');
const LIB = path.join(process.env.PALLAS_LIBRARY || path.join(__dirname, '..', 'library'), 'literature.json');   // override for tests
const [csvPath, featPath] = process.argv.slice(2);
if (!csvPath) { console.log('usage: node tools/import-research.js <research.csv> [features.json]'); process.exit(1); }

// RFC 4180 CSV parser (quoted fields, doubled quotes, newlines inside quotes, optional BOM).
function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || '').trim()])));
}

const lib = JSON.parse(fs.readFileSync(LIB, 'utf8'));
const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
const feats = featPath ? JSON.parse(fs.readFileSync(featPath, 'utf8')).features || {} : {};
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slugOf = (title) => norm(title).replace(/ /g, '-');
const yearOf = (s) => { const m = String(s).match(/\d{4}/); return m ? Number(m[0]) : null; };
const list = (s) => String(s || '').split(/;\s*/).map((x) => x.replace(/\.$/, '').trim()).filter(Boolean);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const errors = [], added = [], skipped = [];
for (const r of rows) {
  const id = r.passage_id, slug = slugOf(r.title);
  for (const k of ['passage_id', 'title', 'author', 'nyt_rank', 'verified_excerpt_url', 'opening_locator', 'closing_locator']) if (!r[k]) errors.push(`${id || '(no id)'}: missing ${k}`);
  if (/PLACEHOLDER|RETRIEVAL_REQUIRED/i.test(r.opening_locator + r.closing_locator)) errors.push(`${id}: locator looks like a placeholder`);
  const dupe = lib.passages.find((p) => p.researchId === id) || lib.books[slug] || Object.values(lib.books).find((b) => norm(b.title) === norm(r.title) && norm(b.author) === norm(r.author));
  if (dupe) { skipped.push(`${r.title} (already in the library)`); continue; }
  if (errors.length) continue;
  const translator = r.translator || null;
  lib.books[slug] = {
    title: r.title, author: r.author, year: yearOf(r.publication_year_original), yearNote: /\D/.test(r.publication_year_original) ? r.publication_year_original : undefined,
    firstEnglishYear: yearOf(r.publication_year_first_english), translator, originalLanguage: r.original_language || null,
    genre: r.genre || null, publisher: null, nytRank: Number(r.nyt_rank), isbn: (r.verified_excerpt_url.match(/isbn=(\d{10,13})/) || [])[1] || null,
    research: { by: 'ChatGPT Work', rankSource: r.nyt_rank_source_url || null, sources: list(r.supplemental_metadata_source_urls.replace(/\s+/g, ';')) },
  };
  const f = feats[id] || { observed: {}, interpretation: {} };
  const tone = r.emotional_tone.replace(/\.$/, '');
  lib.passages.push({
    id: `${slug}-01`, book: slug, status: 'needs-text', researchId: id,
    source: { name: r.source_name, url: r.verified_excerpt_url, kind: 'readable excerpt (verified by research)', verified: r.verified_on, status: r.verification_status, reproduction: r.reproduction_status },
    attribution: `Excerpt from ${r.title} by ${r.author}${translator ? `, translated by ${translator}` : ''}. Source: ${r.source_name}. Copy the full credit line from the source when the text is entered.`,
    notes: { author: null, work: null, research: r.verification_notes || null },
    locator: { start: r.opening_locator, end: r.closing_locator, where: r.chapter_or_section, boundaries: r.retrieval_boundaries, startWithin: 400, endWithin: 120 },
    metadata: {
      scope: r.analysis_scope || null,
      observed: {
        narrativeVoice: r.narrative_perspective_and_voice, proseStyle: r.prose_style, rhythm: r.sentence_structure_and_rhythm,
        pacing: r.pacing, imagery: r.imagery, techniques: list(r.literary_techniques).map((t) => ({ name: cap(t), text: '' })),
        craft: r.craft_explanation || null,
      },
      interpretation: { tone, features: f.interpretation || {} },
      features: f.observed || {},
      featuresStatus: feats[id] ? 'provisional: mapped from the research descriptions, not yet checked against the text' : 'missing',
      analysedBy: 'ChatGPT Work (descriptions), Claude (vocabulary mapping)',
    },
  });
  added.push(`${r.title} → ${slug}-01`);
}

if (errors.length) { console.log('Nothing was imported:'); errors.forEach((e) => console.log('  ERROR    ' + e)); process.exit(1); }
if (added.length) {
  fs.copyFileSync(LIB, LIB + '.bak');
  lib.passages.sort((a, b) => (lib.books[a.book].nytRank || 999) - (lib.books[b.book].nytRank || 999) || (a.id < b.id ? -1 : 1));
  lib.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(LIB, JSON.stringify(lib, null, 2) + '\n');
}
added.forEach((x) => console.log('  added    ' + x));
skipped.forEach((x) => console.log('  skipped  ' + x));
console.log(`${added.length} added, ${skipped.length} skipped`);
require('./validate-literature.js');
