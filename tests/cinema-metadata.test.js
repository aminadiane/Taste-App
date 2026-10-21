// Run: node --test tests/*.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const meta = require('../library/cinema-metadata.json').stills;
const vocab = require('../library/vocab/cinema.json').dimensions;

test('the cinema metadata validator reports no errors', () => {
  const out = execFileSync(process.execPath, [path.join(ROOT, 'tools', 'validate-cinema.js')], { encoding: 'utf8' });
  assert.match(out, / 0 errors/);
});

test('observation and interpretation are kept apart', () => {
  const interp = new Set(Object.keys(vocab).filter((k) => vocab[k].basis === 'interpretation'));
  for (const [id, m] of Object.entries(meta)) {
    for (const k of Object.keys(m.observed || {})) assert.ok(!interp.has(k), `${id}: ${k} under observed`);
    for (const k of Object.keys(m.measured.values)) assert.ok(!interp.has(k), `${id}: ${k} under measured`);
    if (m.interpretation) assert.equal(m.interpretation.subjective, true);
  }
});

test('every still has every single-valued observed dimension filled or explicitly undetermined', () => {
  const dims = Object.keys(vocab).filter((k) => vocab[k].basis === 'observed');
  for (const [id, m] of Object.entries(meta)) for (const d of dims) assert.ok(d in m.observed, `${id}: ${d} missing`);
});
