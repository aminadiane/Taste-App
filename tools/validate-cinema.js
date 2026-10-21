// Checks library/cinema-metadata.json against library/stills.json and library/vocab/cinema.json.
// Run: node tools/validate-cinema.js        Exit code 1 on any error.
const fs = require('node:fs');
const path = require('node:path');
const LIB = path.join(__dirname, '..', 'library');
const read = (f) => JSON.parse(fs.readFileSync(path.join(LIB, f), 'utf8'));
const stills = read('stills.json').stills, meta = read('cinema-metadata.json').stills, vocab = read('vocab/cinema.json').dimensions;
const errors = [], warn = [];
const ids = new Set(stills.map((s) => s.id));
const check = (id, dim, val, basis) => {
  const d = vocab[dim];
  if (!d) return errors.push(`${id}: unknown dimension ${dim}`);
  if (d.basis !== basis) errors.push(`${id}: ${dim} is a ${d.basis} dimension but appears under ${basis}`);
  if (val == null || (Array.isArray(val) && !val.length)) return;
  if (Array.isArray(val) !== !!d.multi) errors.push(`${id}: ${dim} should be ${d.multi ? 'a list' : 'a single value'}`);
  for (const v of [].concat(val)) if (!d.values[v]) errors.push(`${id}: "${v}" is not a ${dim} term`);
};
for (const id of ids) {
  const m = meta[id];
  if (!m) { errors.push(`${id}: no metadata record`); continue; }
  if (!m.measured) errors.push(`${id}: not measured (run node tools/measure-stills.js)`);
  else for (const [k, v] of Object.entries(m.measured.values)) {
    if (k === 'toned') { if (typeof v !== 'boolean') errors.push(`${id}: toned must be true or false`); continue; }
    check(id, k, v, 'measured');
  }
  if (!m.observed) warn.push(`${id}: no observations yet`);
  else for (const [k, v] of Object.entries(m.observed)) {
    if (k === 'undetermined') { for (const u of v) if (!vocab[u] || (m.observed[u] != null && !(Array.isArray(m.observed[u]) && !m.observed[u].length))) errors.push(`${id}: ${u} is marked undetermined but has a value`); continue; }
    if (!['method', 'recorded', 'audited'].includes(k)) check(id, k, v, 'observed');
  }
  if (m.interpretation) {
    if (m.interpretation.subjective !== true) errors.push(`${id}: interpretation must be marked subjective`);
    check(id, 'atmosphere', m.interpretation.atmosphere, 'interpretation');
  }
}
for (const id of Object.keys(meta)) if (!ids.has(id)) errors.push(`${id}: metadata for a still that is not in stills.json`);
const observed = [...ids].filter((id) => meta[id] && meta[id].observed).length;
console.log(`${ids.size} stills, ${observed} observed, ${errors.length} errors`);
warn.forEach((w) => console.log('  pending  ' + w));
errors.forEach((e) => console.log('  ERROR    ' + e));
process.exit(errors.length ? 1 : 0);
