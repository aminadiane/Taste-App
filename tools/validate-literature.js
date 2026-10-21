// Checks library/literature.json. Run: node tools/validate-literature.js
const lib = require('../library/literature.json');
const errors = [], warn = [];
const ids = new Set();
const need = (cond, msg) => { if (!cond) errors.push(msg); };
for (const [slug, b] of Object.entries(lib.books)) {
  for (const k of ['title', 'author', 'year', 'publisher', 'nytRank']) need(b[k] != null && b[k] !== '', `book ${slug}: missing ${k}`);
}
for (const p of lib.passages) {
  need(/^[a-z0-9-]+-\d{2}$/.test(p.id), `passage ${p.id}: id must be <book-slug>-NN`);
  need(!ids.has(p.id), `passage ${p.id}: duplicate id`); ids.add(p.id);
  need(lib.books[p.book], `passage ${p.id}: unknown book ${p.book}`);
  need(p.source && p.source.url && p.source.verified, `passage ${p.id}: source url and verified date required`);
  need(p.attribution, `passage ${p.id}: attribution required`);
  need(p.locator && p.locator.start && p.locator.end, `passage ${p.id}: locator required`);
  const o = (p.metadata && p.metadata.observed) || {};
  for (const k of ['narrativeVoice', 'person', 'tense', 'proseStyle', 'rhythm', 'pacing', 'imagery']) need(o[k], `passage ${p.id}: observed.${k} required`);
  need(Array.isArray(o.techniques) && o.techniques.length, `passage ${p.id}: at least one technique`);
  need(p.metadata.interpretation && p.metadata.interpretation.tone, `passage ${p.id}: interpretation.tone required`);
  need(['needs-text', 'ready'].includes(p.status), `passage ${p.id}: status must be needs-text or ready`);
  if (p.status === 'ready') {
    need(Array.isArray(p.text) && p.text.length, `passage ${p.id}: ready but no text`);
    const all = (p.text || []).join(' ');
    need(all.startsWith(p.locator.start), `passage ${p.id}: text does not start with the locator`);
    need(all.endsWith(p.locator.end), `passage ${p.id}: text does not end with the locator`);
  } else warn.push(`${p.id}: needs text`);
}
const ready = lib.passages.filter((p) => p.status === 'ready').length;
console.log(`${Object.keys(lib.books).length} books, ${lib.passages.length} passages, ${ready} ready`);
warn.forEach((w) => console.log('  pending  ' + w));
errors.forEach((e) => console.log('  ERROR    ' + e));
process.exit(errors.length ? 1 : 0);
