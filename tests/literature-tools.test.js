// Run: node --test tests/*.test.js
// The literature tools run on a temporary copy of the library (PALLAS_LIBRARY), never on the real one.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ROOT = path.join(__dirname, '..');

function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pallas-lib-'));
  fs.mkdirSync(path.join(dir, 'vocab')); fs.mkdirSync(path.join(dir, 'import'));
  fs.copyFileSync(path.join(ROOT, 'library', 'literature.json'), path.join(dir, 'literature.json'));
  fs.copyFileSync(path.join(ROOT, 'library', 'vocab', 'literature.json'), path.join(dir, 'vocab', 'literature.json'));
  return dir;
}
const run = (dir, tool, args = []) => spawnSync(process.execPath, [path.join(ROOT, 'tools', tool), ...args], { env: { ...process.env, PALLAS_LIBRARY: dir }, encoding: 'utf8' });
const read = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'literature.json'), 'utf8'));

test('the real library validates with no errors', () => {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'validate-literature.js')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout); assert.match(r.stdout, / 0 errors/);
});

test('re-importing the research batch adds nothing and changes nothing', () => {
  const dir = sandbox(), before = fs.readFileSync(path.join(dir, 'literature.json'), 'utf8');
  const r = run(dir, 'import-research.js', [path.join(ROOT, 'library', 'import', 'research', 'pallas-literature-research.csv')]);
  assert.match(r.stdout, /0 added, 20 skipped/);
  assert.equal(fs.readFileSync(path.join(dir, 'literature.json'), 'utf8'), before);
});

test('placeholder instructions are refused as literary text', () => {
  const dir = sandbox(), f = path.join(dir, 'import', 'p.txt');
  fs.writeFileSync(f, '=== outline-01 ===\n[RETRIEVAL_REQUIRED — EXCERPT TEXT NOT INCLUDED] Before the flight I was asked … arrived at that subject.\n');
  const r = run(dir, 'import-passages.js', [f]);
  assert.equal(r.status, 1); assert.match(r.stdout, /placeholder instructions/);
  assert.equal(read(dir).passages.find((p) => p.id === 'outline-01').text, undefined);
});

test('text for a researched passage is saved but stays pending until its info page is complete', () => {
  const dir = sandbox(), f = path.join(dir, 'import', 'p.txt');
  fs.writeFileSync(f, '=== outline-01 ===\nTest sentence. Before the flight I was taken to lunch, test wording only, and we arrived at that subject.\n');
  const r = run(dir, 'import-passages.js', [f]);
  assert.equal(r.status, 0, r.stdout);
  const p = read(dir).passages.find((x) => x.id === 'outline-01');
  assert.equal(p.status, 'needs-text'); assert.ok(p.text.length);
  assert.match(r.stdout, /stays pending until it has: info notes, technique notes, publisher, feature check/);
});

test('importing text never alters other passages or the ready five', () => {
  const dir = sandbox(), f = path.join(dir, 'import', 'p.txt'), before = read(dir);
  fs.writeFileSync(f, '=== outline-01 ===\nBefore the flight I was test text and we arrived at that subject.\n');
  run(dir, 'import-passages.js', [f]);
  const after = read(dir);
  for (const p of before.passages) if (p.id !== 'outline-01') assert.deepEqual(after.passages.find((x) => x.id === p.id), p, p.id);
  assert.equal(after.passages.filter((p) => p.status === 'ready').length, 5);
});
