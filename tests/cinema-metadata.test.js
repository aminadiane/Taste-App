// Run: node --test tests/*.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const meta = require('../works/pallas/library/cinema-metadata.json').stills;
const vocab = require('../works/pallas/library/vocab/cinema.json').dimensions;

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

test('every metadata value maps to a vocabulary term, and undetermined values are never counted', () => {
  const F = require('../works/pallas/js/taste/features.js');
  const lib = F.cinema(require('../works/pallas/library/stills.json'), require('../works/pallas/library/cinema-metadata.json'), require('../works/pallas/library/vocab/cinema.json'));
  assert.deepEqual(lib.unknown, []);
  for (const [id, m] of Object.entries(meta)) for (const dim of m.observed.undetermined || []) {
    assert.ok(!lib.items[id].features.some((f) => f.startsWith(dim + ':')), `${id}: undetermined ${dim} counted`);
  }
});

test('retired terms are no longer used', () => {
  const retired = Object.keys(require('../works/pallas/library/vocab/cinema.json').retired || {});
  for (const [id, m] of Object.entries(meta)) for (const t of retired) {
    const [dim, val] = t.split(':');
    const v = (m.observed || {})[dim] ?? (m.interpretation || {})[dim];
    assert.ok(![].concat(v ?? []).includes(val), `${id} still uses ${t}`);
  }
});
