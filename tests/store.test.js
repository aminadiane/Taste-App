// Run: node --test tests/
// Loads js/store.js in a fresh context per "page load", sharing one simulated localStorage, so a new load
// behaves like a refresh or a browser restart on the same device.
const { test } = require('node:test');
const strict = require('node:assert/strict');
// Objects built inside the vm context have that realm's prototypes; compare their plain JSON form.
const plain = (o) => JSON.parse(JSON.stringify(o));
const assert = Object.assign(Object.create(strict), { deepEqual: (a, b, m) => strict.deepEqual(plain(a), plain(b), m) });
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'store.js'), 'utf8');

function storage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    map: m,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
}
function boot(ls) {
  const ctx = { localStorage: ls, crypto: globalThis.crypto };
  ctx.window = ctx;   // as in a browser, window is the global object
  vm.runInNewContext(SRC, ctx);
  return ctx.Pallas;
}
const FILMS = ['s1', 's2', 's3', 's4'];
const BOOKS = ['b1', 'b2', 'b3'];

test('a like or dislike is saved immediately, without any save step', () => {
  const ls = storage();
  const { votes } = boot(ls);
  votes.set('c', 's1', 'like', 'film-a');
  const doc = JSON.parse(ls.getItem('pallas.v1'));
  assert.equal(doc.events.length, 1);
  assert.equal(doc.events[0].kind, 'like');
  assert.equal(doc.events[0].work, 'film-a');
});

test('progress survives a refresh and a browser restart (new load, same storage)', () => {
  const ls = storage();
  let P = boot(ls);
  P.votes.set('c', 's1', 'like'); P.votes.set('c', 's2', 'dislike');
  P.store.setCursor('cinema', 's3');
  P.votes.set('l', 'b1', 'like');
  P.store.setCursor('literature', 'b2');
  const anon = P.store.anonId;
  P = boot(ls);   // refresh
  P = boot(ls);   // restart
  assert.deepEqual(P.votes.all('c'), { s1: 'like', s2: 'dislike' });
  assert.deepEqual(P.votes.all('l'), { b1: 'like' });
  assert.equal(P.store.resumeIndex('cinema', FILMS), 2);
  assert.equal(P.store.resumeIndex('literature', BOOKS), 1);
  assert.equal(P.store.anonId, anon);
});

test('cinema and literature progress stay independent', () => {
  const ls = storage();
  const P = boot(ls);
  P.votes.set('c', 's1', 'like');
  P.store.setCursor('cinema', 's2');
  assert.deepEqual(P.votes.all('l'), {});
  assert.equal(P.store.cursor('literature'), null);
  P.store.resetArea('literature');
  assert.deepEqual(P.votes.all('c'), { s1: 'like' });
  assert.equal(P.store.cursor('cinema'), 's2');
});

test('returning visitors resume at the next unevaluated work, never an evaluated one', () => {
  const ls = storage();
  let P = boot(ls);
  P.votes.set('c', 's1', 'like');
  P.store.setCursor('cinema', 's1');   // reloaded before the screen advanced
  P = boot(ls);
  assert.equal(P.store.resumeIndex('cinema', FILMS), 1);
  P.votes.set('c', 's2', 'dislike'); P.votes.set('c', 's4', 'like');
  assert.equal(P.store.nextOpen('cinema', FILMS, 2), 2);
  assert.equal(P.store.nextOpen('cinema', FILMS, 3), 2, 'wraps past evaluated s4 and s1');
});

test('when everything is evaluated the screen keeps working in library order', () => {
  const P = boot(storage());
  FILMS.forEach((id) => P.votes.set('c', id, 'like'));
  assert.equal(P.store.nextOpen('cinema', FILMS, 1), 1);
  assert.equal(P.store.nextOpen('cinema', FILMS, 0), 0);
});

test('a re-vote is a new event: history is kept and the latest judgment wins', () => {
  const P = boot(storage());
  P.votes.set('c', 's1', 'like');
  P.votes.set('c', 's1', 'dislike');
  assert.equal(P.votes.get('c', 's1'), 'dislike');
  assert.equal(P.store.history('cinema').length, 2);
});

test('undo reverses the most recent judgment in that area only, without deleting history', () => {
  const P = boot(storage());
  P.votes.set('c', 's1', 'like');
  P.votes.set('l', 'b1', 'dislike');
  P.votes.set('c', 's2', 'dislike');
  const undone = P.store.undo('cinema');
  assert.equal(undone.item, 's2');
  assert.equal(P.votes.get('c', 's2'), undefined);
  assert.equal(P.votes.get('c', 's1'), 'like');
  assert.equal(P.votes.get('l', 'b1'), 'dislike');
  assert.equal(P.store.history('cinema').length, 3, 'two judgments plus the undo event');
  assert.equal(P.store.undo('cinema').item, 's1');
  assert.equal(P.store.undo('cinema'), null);
});

test('a skip hides a work for the rest of its session; it returns in a new session', () => {
  const P = boot(storage());
  P.store.skip('cinema', 's1');
  assert.equal(P.store.isEvaluated('cinema', 's1'), false);
  assert.equal(P.store.nextOpen('cinema', FILMS, 0), 1);
  assert.equal(P.votes.get('c', 's1'), undefined, 'skips are not likes or dislikes');
  P.store.newSession('cinema');
  assert.equal(P.store.nextOpen('cinema', FILMS, 0), 0);
});

test('a new discovery session does not overwrite earlier history or profiles', () => {
  const ls = storage();
  let P = boot(ls);
  P.votes.set('c', 's1', 'like');
  P.store.addProfile({ area: 'cinema', findings: ['example'] });
  const first = P.store.newSession('cinema');
  P.votes.set('c', 's2', 'dislike');
  P = boot(ls);
  assert.deepEqual(P.votes.all('c'), { s1: 'like', s2: 'dislike' });
  assert.equal(P.store.profiles().length, 1);
  const sessions = P.store.sessions('cinema');
  assert.ok(sessions.length >= 2);
  assert.ok(sessions.some((s) => s.id === first));
});

test('votes from the earlier pallas.votes format are migrated once and kept', () => {
  const ls = storage({ 'pallas.votes': JSON.stringify({ c: { s1: 'like', s3: 'dislike' }, l: { b2: 'like' } }) });
  let P = boot(ls);
  assert.deepEqual(P.votes.all('c'), { s1: 'like', s3: 'dislike' });
  assert.deepEqual(P.votes.all('l'), { b2: 'like' });
  P.votes.set('c', 's1', 'dislike');
  P = boot(ls);   // no second migration
  assert.equal(P.votes.get('c', 's1'), 'dislike');
  assert.equal(P.store.history('cinema').filter((e) => e.migrated).length, 2);
  assert.ok(ls.getItem('pallas.votes'), 'legacy key left in place');
});

test('storage failures fall back to memory without throwing', () => {
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); }, removeItem() {} };
  const P = boot(broken);
  P.votes.set('c', 's1', 'like');
  assert.equal(P.votes.get('c', 's1'), 'like');
  assert.equal(P.store.persistent, false);
});

test('an unreadable saved document is preserved, not discarded', () => {
  const ls = storage({ 'pallas.v1': '{not json' });
  const P = boot(ls);
  P.votes.set('c', 's1', 'like');
  assert.ok([...ls.map.keys()].some((k) => k.startsWith('pallas.v1.unreadable.')));
});

test('export, reset one area and delete everything', () => {
  const ls = storage();
  let P = boot(ls);
  P.votes.set('c', 's1', 'like'); P.votes.set('l', 'b1', 'like');
  const dump = P.store.exportData();
  assert.equal(dump.events.length, 2);
  P.store.resetArea('cinema');
  assert.deepEqual(P.votes.all('c'), {});
  assert.deepEqual(P.votes.all('l'), { b1: 'like' });
  P.store.deleteAll();
  assert.equal(ls.getItem('pallas.v1'), null);
  P = boot(ls);
  assert.deepEqual(P.votes.all('l'), {});
});

test('lastUndoable previews undo without changing anything', () => {
  const P = boot(storage());
  assert.equal(P.store.lastUndoable('cinema'), null);
  P.votes.set('c', 's1', 'like');
  const before = P.store.history('cinema').length;
  assert.equal(P.store.lastUndoable('cinema').item, 's1');
  assert.equal(P.store.history('cinema').length, before);
});

test('undoing a re-vote restores the earlier vote; undoing a skip makes the work open again', () => {
  const P = boot(storage());
  P.votes.set('c', 's1', 'like');
  P.votes.set('c', 's1', 'dislike');
  P.store.undo('cinema');
  assert.equal(P.votes.get('c', 's1'), 'like');
  P.store.skip('cinema', 's2');
  assert.equal(P.store.nextOpen('cinema', FILMS, 1), 2);
  P.store.undo('cinema');
  assert.equal(P.store.nextOpen('cinema', FILMS, 1), 1);
});

test('undo and skip survive a refresh and keep every timestamped event', () => {
  const ls = storage();
  let P = boot(ls);
  P.votes.set('l', 'b1', 'like'); P.store.skip('literature', 'b2', 'book-b'); P.store.undo('literature');
  P = boot(ls);
  const h = P.store.history('literature');
  assert.deepEqual(h.map((e) => e.kind), ['like', 'skip', 'undo']);
  assert.ok(h.every((e) => typeof e.t === 'string' && e.session));
  assert.equal(h[2].undoes, h[1].id);
  assert.equal(P.votes.get('l', 'b1'), 'like');
  assert.equal(P.store.nextOpen('literature', BOOKS, 1), 1, 'the undone skip no longer hides b2');
});

test('profile snapshots accumulate per area and are never overwritten', () => {
  const ls = storage();
  let P = boot(ls);
  const a = P.store.addProfile({ area: 'cinema', engine: { version: '1.0.0' } });
  P.store.addProfile({ area: 'literature', engine: { version: '1.0.0' } });
  const b = P.store.addProfile({ area: 'cinema', engine: { version: '1.1.0' } });
  P = boot(ls);
  assert.deepEqual(P.store.profiles('cinema').map((p) => p.id), [a.id, b.id]);
  assert.equal(P.store.latestProfile('cinema').engine.version, '1.1.0');
  assert.equal(P.store.profiles().length, 3);
  const copy = P.store.profiles('cinema')[0]; copy.engine.version = 'tampered';
  assert.equal(P.store.profiles('cinema')[0].engine.version, '1.0.0', 'callers get copies');
});

test('reflections can be added, edited with history, filtered and deleted', () => {
  const P = boot(storage());
  const r = P.store.addReflection({ area: 'c', item: 's1', text: '  the light on the wall  ' });
  assert.equal(r.text, 'the light on the wall');
  assert.throws(() => P.store.addReflection({ area: 'c', text: '   ' }));
  const e = P.store.editReflection(r.id, 'the hard light on the wall');
  assert.equal(e.revisions[0].text, 'the light on the wall');
  P.store.addReflection({ area: 'literature', text: 'restraint' });
  assert.equal(P.store.reflections({ area: 'cinema' }).length, 1);
  assert.equal(P.store.reflections({ item: 's1' })[0].text, 'the hard light on the wall');
  assert.ok(P.store.deleteReflection(r.id));
  assert.equal(P.store.reflections({ area: 'cinema' }).length, 0);
});

test('resetting an area also clears the profiles and reflections derived from it', () => {
  const P = boot(storage());
  P.store.addProfile({ area: 'cinema' }); P.store.addProfile({ area: 'literature' });
  P.store.addReflection({ area: 'cinema', text: 'x' }); P.store.addReflection({ area: 'literature', text: 'y' });
  P.store.resetArea('cinema');
  assert.equal(P.store.profiles('cinema').length, 0); assert.equal(P.store.profiles('literature').length, 1);
  assert.equal(P.store.reflections({ area: 'literature' }).length, 1); assert.equal(P.store.reflections().length, 1);
});
