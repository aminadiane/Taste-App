// Batch-imports passage text into library/literature.json.
// Usage: node tools/import-passages.js [library/import/passages.txt]
//
// Input format, one block per passage:
//   === <passage id or book title> ===
//   paragraph one
//   (blank line)
//   paragraph two
// Lines starting with "#" are ignored. A block left empty is skipped.
// Nothing is written unless every filled block matches a passage and starts and ends at its locator.
const fs = require('node:fs');
const path = require('node:path');
const LIBDIR = process.env.PALLAS_LIBRARY || path.join(__dirname, '..', 'works', 'pallas', 'library');   // override for tests
const LIB = path.join(LIBDIR, 'literature.json');
const file = process.argv[2] || path.join(LIBDIR, 'import', 'passages.txt');

// Quotes, apostrophes, dashes and spacing vary between sources and keyboards; compare in a normal form.
const norm = (s) => s.replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/\s+/g, ' ').trim().toLowerCase();

const lib = JSON.parse(fs.readFileSync(LIB, 'utf8'));
const byKey = new Map();
for (const p of lib.passages) {
  byKey.set(norm(p.id), p);
  const book = lib.books[p.book];
  if (book && lib.passages.filter((x) => x.book === p.book).length === 1) byKey.set(norm(book.title), p);   // a title matches only when the book has one passage
}

const blocks = [];
let cur = null;
for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
  const head = line.match(/^===\s*(.+?)\s*===\s*$/);
  if (head) { cur = { key: head[1].split('|')[0].trim(), lines: [] }; blocks.push(cur); continue; }
  if (line.startsWith('#')) continue;
  if (cur) cur.lines.push(line);
}

const errors = [], updates = [];
for (const b of blocks) {
  const paras = b.lines.join('\n').split(/\n\s*\n/).map((x) => x.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  if (!paras.length) { console.log(`  skipped   ${b.key} (empty)`); continue; }
  const p = byKey.get(norm(b.key));
  if (!p) { errors.push(`"${b.key}": no passage with that id or title`); continue; }
  const all = norm(paras.join(' '));
  // Research anchors may sit a little inside the passage (startWithin / endWithin characters); owner locators are exact.
  const s = norm(p.locator.start), e = norm(p.locator.end), sw = p.locator.startWithin, ew = p.locator.endWithin;
  if (!(sw ? all.slice(0, sw).includes(s) : all.startsWith(s))) errors.push(`${p.id}: should ${sw ? 'contain near its start' : 'start with'} "${p.locator.start}" but starts with "${paras[0].slice(0, 40)}…"`);
  if (!(ew ? all.slice(-ew).includes(e) : all.endsWith(e))) errors.push(`${p.id}: should ${ew ? 'contain near its end' : 'end with'} "${p.locator.end}" but ends with "…${paras[paras.length - 1].slice(-40)}"`);
  if (/RETRIEVAL_REQUIRED|PLACEHOLDER|Replace this entire placeholder/i.test(all)) errors.push(`${p.id}: the block still contains placeholder instructions, not literary text`);
  updates.push({ p, paras });
}

if (errors.length) {
  console.log('Nothing was imported. Fix these and run again:');
  errors.forEach((e) => console.log('  ERROR     ' + e));
  process.exit(1);
}
if (!updates.length) { console.log('No filled blocks found.'); process.exit(0); }
fs.copyFileSync(LIB, LIB + '.bak');
// A passage goes live only when everything its info page needs is present; otherwise the text is saved and it stays pending.
const missing = (p) => {
  const md = p.metadata || {}, o = md.observed || {}, b = lib.books[p.book] || {}, m = [];
  if (!(p.notes && p.notes.author && p.notes.work)) m.push('info notes');
  if ((o.techniques || []).some((t) => !t.text)) m.push('technique notes');
  if (!b.publisher) m.push('publisher');
  if (/^provisional/.test(md.featuresStatus || '')) m.push('feature check');
  return m;
};
for (const { p, paras } of updates) {
  p.text = paras;
  const m = missing(p);
  p.status = m.length ? 'needs-text' : 'ready';
  console.log(`  imported  ${p.id} (${paras.length} paragraph${paras.length > 1 ? 's' : ''}, ${paras.join(' ').split(/\s+/).length} words)${m.length ? ` — text saved, stays pending until it has: ${m.join(', ')}` : ''}`);
}
lib.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(LIB, JSON.stringify(lib, null, 2) + '\n');
console.log(`Saved ${updates.length} passage(s). Backup: library/literature.json.bak`);
require('./validate-literature.js');
