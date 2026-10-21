// Regenerates library/import/passages.txt: one block per passage that has no text yet, with its anchors and source.
// Usage: node tools/make-import-template.js
const fs = require('node:fs');
const path = require('node:path');
const LIB = path.join(__dirname, '..', 'library');
const lib = JSON.parse(fs.readFileSync(path.join(LIB, 'literature.json'), 'utf8'));
const out = ['# Pallas — passage import', '# Paste each excerpt under its heading, exactly as published, within the boundaries described.',
  '# Separate paragraphs with a blank line. Leave a block empty to skip it. Lines starting with # are ignored.',
  '# Then run:  node tools/import-passages.js', ''];
const pending = lib.passages.filter((p) => !(p.text && p.text.length));
for (const p of pending) {
  const b = lib.books[p.book], L = p.locator;
  out.push(`=== ${p.id} | ${b.title} — ${b.author}${b.translator ? `, tr. ${b.translator}` : ''} ===`);
  out.push(`# ${L.startWithin ? 'opening anchor (near the start)' : 'starts'}: ${L.start}`);
  out.push(`# ${L.endWithin ? 'closing anchor (near the end)' : 'ends'}:   ${L.end}`);
  if (L.where) out.push(`# section: ${L.where}`);
  if (L.boundaries) out.push(`# boundaries: ${L.boundaries}`);
  out.push(`# source: ${p.source.url}`, '');
}
fs.writeFileSync(path.join(LIB, 'import', 'passages.txt'), out.join('\n') + '\n');
console.log(`template lists ${pending.length} passages without text`);
