// Run: node --test tests/*.test.js
const { test } = require('node:test');
const strict = require('node:assert/strict');
const plain = (o) => JSON.parse(JSON.stringify(o));
const assert = Object.assign(Object.create(strict), { deepEqual: (a, b, m) => strict.deepEqual(plain(a), plain(b), m) });
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const J = require(path.join(ROOT, 'js', 'journal.js'));
const A = require(path.join(ROOT, 'js', 'taste', 'analyse.js'));
const P = require(path.join(ROOT, 'js', 'taste', 'profile.js'));
const U = require('./fixtures/simulated-users.js');

// A real store, booted in a sandbox exactly as in the browser, so the journal is tested on genuine store output.
function store() {
  const m = new Map();
  const ctx = { localStorage: { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }, crypto: globalThis.crypto };
  ctx.window = ctx;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'store.js'), 'utf8'), ctx);
  return ctx.Pallas.store;
}

test('the journal lists evaluated works, skips, reversed preferences and history, from the store alone', () => {
  const s = store(), lib = U.cinemaLibrary(), [a, b, c, d] = Object.keys(lib.items).sort();
  s.judge('cinema', a, 'like', lib.items[a].work);
  s.judge('cinema', b, 'dislike', lib.items[b].work);
  s.judge('cinema', b, 'like', lib.items[b].work);       // changed mind
  s.skip('cinema', c, lib.items[c].work);
  s.judge('cinema', d, 'like', lib.items[d].work);
  s.undo('cinema');                                       // d undone: not evaluated
  const j = J.build({ doc: s.exportData(), libraries: { cinema: lib } }).areas.cinema;
  assert.deepEqual(j.works.map((w) => w.item).sort(), [a, b].sort());
  assert.equal(j.works.find((w) => w.item === b).changed, true);
  assert.deepEqual(j.preferenceChanges.map((x) => [x.item, x.from, x.to]), [[b, 'dislike', 'like']]);
  assert.deepEqual(j.skipped.map((x) => x.item), [c]);
  assert.equal(j.counts.evaluated, 2); assert.equal(j.counts.liked, 2);
  const month = j.timeline.byMonth[0];
  assert.equal(month.likes + month.dislikes + month.skips + month.undos, 6);
});

test('techniques encountered come from the metadata of works responded to, with like and dislike counts', () => {
  const s = store(), lib = U.cinemaLibrary(), ids = Object.keys(lib.items).sort().slice(0, 10);
  ids.forEach((id, i) => s.judge('cinema', id, i % 2 ? 'like' : 'dislike', lib.items[id].work));
  const t = J.build({ doc: s.exportData(), libraries: { cinema: lib } }).areas.cinema.techniques;
  assert.ok(t.length > 0);
  for (const x of t) {
    assert.ok(J.TECHNIQUE_DIMENSIONS.cinema.includes(lib.terms[x.term].dimension));
    assert.equal(x.works, x.liked + x.disliked + x.skipped);
    assert.equal(x.works, ids.filter((id) => lib.items[id].features.includes(x.term)).length);
  }
});

test('saved profiles appear as history with the changes between snapshots', () => {
  const s = store(), r = U.run('warm-low-key');
  const ids = Object.keys(r.judgments).sort();
  ids.slice(0, 40).forEach((id) => s.judge('cinema', id, r.judgments[id], r.library.items[id].work));
  const j1 = plain(s.judgments('cinema'));
  s.addProfile(P.build(A.analyse({ judgments: j1, library: r.library }), { judgments: j1, generatedAt: '2026-10-01T00:00:00Z' }));
  ids.slice(40).forEach((id) => s.judge('cinema', id, r.judgments[id], r.library.items[id].work));
  const j2 = plain(s.judgments('cinema'));
  s.addProfile(P.build(A.analyse({ judgments: j2, library: r.library }), { judgments: j2, generatedAt: '2026-10-21T00:00:00Z' }));
  const j = J.build({ doc: s.exportData(), libraries: { cinema: r.library }, compare: P.compare }).areas.cinema;
  assert.equal(j.profiles.length, 2);
  assert.equal(j.profileChanges.length, 1);
  assert.equal(j.profileChanges[0].to, '2026-10-21T00:00:00Z');
  assert.equal(j.profiles[1].judged, 89);
});

test('reflections are grouped by area and the journal is reproducible', () => {
  const s = store();
  s.addReflection({ area: 'literature', item: 'gilead-01', text: 'the unbroken sentence' });
  s.addReflection({ text: 'general note' });
  const doc = s.exportData();
  const a = J.build({ doc, generatedAt: 'x' }), b = J.build({ doc, generatedAt: 'x' });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.equal(a.areas.literature.reflections[0].text, 'the unbroken sentence');
  assert.equal(a.reflectionsWithoutArea.length, 1);
  assert.equal(a.schema, 'pallas.journal/1');
  assert.ok(a.owner.anonId);
});

test('a skip after a judgment leaves the work evaluated in the journal', () => {
  const s = store(), lib = U.cinemaLibrary(), [a] = Object.keys(lib.items).sort();
  s.judge('cinema', a, 'dislike', lib.items[a].work); s.skip('cinema', a, lib.items[a].work);
  const j = J.build({ doc: s.exportData(), libraries: { cinema: lib } }).areas.cinema;
  assert.equal(j.works[0].judgment, 'dislike'); assert.equal(j.skipped.length, 0);
});
