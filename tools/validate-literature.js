// Checks library/literature.json. Run: node tools/validate-literature.js
// Errors block; warnings list what a passage still needs before it can be marked ready.
const fs = require('node:fs');
const path = require('node:path');
const LIBDIR = process.env.PALLAS_LIBRARY || path.join(__dirname, '..', 'library');   // override for tests
const lib = JSON.parse(fs.readFileSync(path.join(LIBDIR, 'literature.json'), 'utf8'));
const vocab = JSON.parse(fs.readFileSync(path.join(LIBDIR, 'vocab', 'literature.json'), 'utf8')).dimensions;
const norm = (s) => s.replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/\s+/g, ' ').trim().toLowerCase();
const errors = [], warn = [];
const ids = new Set(), research = new Set(), titles = new Map();
const need = (cond, msg) => { if (!cond) errors.push(msg); };

for (const [slug, b] of Object.entries(lib.books)) {
  for (const k of ['title', 'author', 'year', 'nytRank']) need(b[k] != null && b[k] !== '', `book ${slug}: missing ${k}`);
  const key = `${(b.title || '').toLowerCase()}|${(b.author || '').toLowerCase()}`;
  need(!titles.has(key), `book ${slug}: duplicate of ${titles.get(key)}`); titles.set(key, slug);
  if (!b.publisher) warn.push(`book ${slug}: publisher not recorded`);
}
const ranks = new Map();
for (const [slug, b] of Object.entries(lib.books)) { need(!ranks.has(b.nytRank), `book ${slug}: NYT rank ${b.nytRank} also used by ${ranks.get(b.nytRank)}`); ranks.set(b.nytRank, slug); }

function checkFeatures(id, feats, basis) {
  for (const [dim, val] of Object.entries(feats || {})) {
    const d = vocab[dim];
    if (!d) { errors.push(`passage ${id}: unknown feature dimension ${dim}`); continue; }
    if (d.basis !== basis) errors.push(`passage ${id}: ${dim} is ${d.basis}, recorded under ${basis}`);
    if (Array.isArray(val) !== !!d.multi) errors.push(`passage ${id}: ${dim} should be ${d.multi ? 'a list' : 'one value'}`);
    for (const v of [].concat(val)) if (!d.values[v]) errors.push(`passage ${id}: "${v}" is not a ${dim} term`);
  }
}

for (const p of lib.passages) {
  need(/^[a-z0-9-]+-\d{2}$/.test(p.id), `passage ${p.id}: id must be <book-slug>-NN`);
  need(!ids.has(p.id), `passage ${p.id}: duplicate id`); ids.add(p.id);
  if (p.researchId) { need(!research.has(p.researchId), `passage ${p.id}: duplicate research id ${p.researchId}`); research.add(p.researchId); }
  need(lib.books[p.book], `passage ${p.id}: unknown book ${p.book}`);
  need(p.source && p.source.url && p.source.verified, `passage ${p.id}: source url and verified date required`);
  need(p.attribution, `passage ${p.id}: attribution required`);
  need(p.locator && p.locator.start && p.locator.end, `passage ${p.id}: locator required`);
  need(['needs-text', 'ready'].includes(p.status), `passage ${p.id}: status must be needs-text or ready`);
  const md = p.metadata || {}, o = md.observed || {};
  for (const k of ['narrativeVoice', 'proseStyle', 'rhythm', 'pacing', 'imagery']) need(o[k], `passage ${p.id}: observed.${k} required`);
  need(Array.isArray(o.techniques) && o.techniques.length && o.techniques.every((t) => t.name), `passage ${p.id}: at least one named technique`);
  need(md.interpretation && md.interpretation.tone, `passage ${p.id}: interpretation.tone required`);
  checkFeatures(p.id, md.features, 'observed');
  checkFeatures(p.id, md.interpretation && md.interpretation.features, 'interpretation');
  const placeholder = /RETRIEVAL_REQUIRED|PLACEHOLDER|Replace this entire placeholder/i;
  need(!(p.text || []).some((t) => placeholder.test(t)), `passage ${p.id}: text contains placeholder instructions`);
  if (p.status === 'ready') {
    need(Array.isArray(p.text) && p.text.length, `passage ${p.id}: ready but no text`);
    const all = norm((p.text || []).join(' ')), s = norm(p.locator.start), e = norm(p.locator.end);
    const sw = p.locator.startWithin, ew = p.locator.endWithin;
    need(sw ? all.slice(0, sw).includes(s) : all.startsWith(s), `passage ${p.id}: text does not ${sw ? 'contain the opening anchor near its start' : 'start with the locator'}`);
    need(ew ? all.slice(-ew).includes(e) : all.endsWith(e), `passage ${p.id}: text does not ${ew ? 'contain the closing anchor near its end' : 'end with the locator'}`);
    need(p.notes && p.notes.author && p.notes.work, `passage ${p.id}: ready passages need info-page notes (author, work)`);
    need(o.techniques.every((t) => t.text), `passage ${p.id}: ready passages need a note for every technique (info page)`);
    need(lib.books[p.book] && lib.books[p.book].publisher, `passage ${p.id}: ready passages need the book's publisher`);
    need(!/^provisional/.test(md.featuresStatus || ''), `passage ${p.id}: features are still provisional; check them against the text`);
  } else {
    const todo = ['text'];
    if (!(p.notes && p.notes.author)) todo.push('info notes');
    if (o.techniques && o.techniques.some((t) => !t.text)) todo.push('technique notes');
    if (/^provisional/.test(md.featuresStatus || '')) todo.push('feature check');
    if (lib.books[p.book] && !lib.books[p.book].publisher) todo.push('publisher');
    warn.push(`${p.id}: needs ${todo.join(', ')}`);
  }
}
const ready = lib.passages.filter((p) => p.status === 'ready').length;
console.log(`${Object.keys(lib.books).length} books, ${lib.passages.length} passages, ${ready} ready, ${lib.passages.length - ready} pending, ${errors.length} errors`);
if (process.argv.includes('--verbose')) warn.forEach((w) => console.log('  pending  ' + w));
errors.forEach((e) => console.log('  ERROR    ' + e));
if (require.main === module || errors.length) process.exitCode = errors.length ? 1 : 0;
