// Applies library/import/cinema-observed.txt to the observed / interpretation blocks of library/cinema-metadata.json.
// Usage: node tools/apply-observations.js [file]
// Every value is checked against library/vocab/cinema.json; nothing is written if any line has an error.
const fs = require('node:fs');
const path = require('node:path');
const LIB = path.join(__dirname, '..', 'library');
const file = process.argv[2] || path.join(LIB, 'import', 'cinema-observed.txt');
const vocab = JSON.parse(fs.readFileSync(path.join(LIB, 'vocab', 'cinema.json'), 'utf8')).dimensions;
const metaPath = path.join(LIB, 'cinema-metadata.json');
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const COLS = ['lightQuality', 'lightDirection', 'lightSource', 'shotScale', 'angle', 'composition', 'focus', 'layers', 'figures', 'setting', 'atmosphere'];
const errors = [], rows = new Map();
fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, n) => {
  if (!line.trim() || line.startsWith('#')) return;
  const cells = line.split('|').map((c) => c.trim());
  const id = cells.shift();
  if (cells.length !== COLS.length) return errors.push(`line ${n + 1} (${id}): expected ${COLS.length} columns, found ${cells.length}`);
  if (!meta.stills[id]) return errors.push(`line ${n + 1}: unknown still ${id}`);
  if (rows.has(id)) errors.push(`line ${n + 1}: ${id} appears twice`);
  const rec = {};
  COLS.forEach((dim, i) => {
    const d = vocab[dim], raw = cells[i];
    if (raw === '-' || raw === '') { rec[dim] = d.multi ? [] : null; return; }
    const vals = raw.split(',').map((v) => v.trim()).filter(Boolean);
    if (!d.multi && vals.length > 1) errors.push(`${id}: ${dim} takes one value, got "${raw}"`);
    for (const v of vals) if (!d.values[v]) errors.push(`${id}: "${v}" is not a ${dim} term`);
    rec[dim] = d.multi ? vals : vals[0];
  });
  rows.set(id, rec);
});
const missing = Object.keys(meta.stills).filter((id) => !rows.has(id));
if (errors.length) { console.log('Nothing was applied:'); errors.forEach((e) => console.log('  ERROR  ' + e)); process.exit(1); }
const today = new Date().toISOString().slice(0, 10);
for (const [id, r] of rows) {
  const { atmosphere, ...observed } = r;
  meta.stills[id].observed = { ...observed, method: 'viewed', recorded: today };
  meta.stills[id].interpretation = { atmosphere, subjective: true, recorded: today };
}
meta.updated = today;
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 1) + '\n');
console.log(`applied ${rows.size} stills` + (missing.length ? `; ${missing.length} without observations: ${missing.join(', ')}` : ''));
