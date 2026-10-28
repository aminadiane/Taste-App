// Run: node --test tests/*.test.js
// The interpretation layer: supported by the judgments, specific, different between people, silent without evidence,
// and separate from the statistics.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'works', 'pallas');   // the Pallas app (served at /works/pallas/)
const A = require(path.join(APP, 'js', 'taste', 'analyse.js'));
const I = require(path.join(APP, 'js', 'taste', 'interpret.js'));
const K = require(path.join(APP, 'library', 'vocab', 'qualities.json'));
const U = require('./fixtures/simulated-users.js');
const { PEOPLE, build } = require('./fixtures/personas.js');
const { verify } = require('./fixtures/verify-interpretation.js');

const cache = new Map();
function run(name) {
  if (cache.has(name)) return cache.get(name);
  const pz = PEOPLE.find((p) => p.name === name), b = build(pz);
  const result = A.analyse({ judgments: b.judgments, library: b.library, history: b.history });
  const it = I.interpret({ result, library: b.library, judgments: b.judgments, knowledge: K, titleOf: b.titleOf });
  const out = { pz, ...b, result, it };
  cache.set(name, out);
  return out;
}
const CLAIMING = new Set(['theme', 'finding', 'condition', 'strands', 'aversion']);
const claims = (it) => it.sections.filter((s) => CLAIMING.has(s.kind));
const featuresOf = (it) => new Set(claims(it).flatMap((s) => s.claims.flatMap((c) => [...(c.check.features || []).map((f) => f.feature), ...[c.check.a, c.check.b].filter((x) => typeof x === 'string')])));

test('there are at least ten simulated people, with contrasting and eclectic tastes', () => {
  assert.ok(PEOPLE.length >= 10);
  assert.ok(PEOPLE.some((p) => p.name === 'eclectic') && PEOPLE.some((p) => p.name === 'two-strands'));
});

test('every claim in every interpretation is supported by the person\'s own judgments', () => {
  for (const p of PEOPLE) {
    const { it, library, judgments } = run(p.name);
    const v = verify(it, { library, judgments });
    assert.ok(v.ok, `${p.name}: ${v.failures.join('; ')}`);
  }
});

test('nothing is interpreted for eclectic, too-short or insufficient histories', () => {
  for (const name of ['eclectic', 'just-started', 'real-literature-today']) assert.equal(claims(run(name).it).length, 0, name);
});

test('random likes rarely produce an interpretation', () => {
  const lib = U.cinemaLibrary();
  let withClaims = 0;
  for (let seed = 500; seed < 530; seed++) {
    const j = U.judge(lib, () => 0.5, seed);
    const it = I.interpret({ result: A.analyse({ judgments: j, library: lib }), library: lib, judgments: j, knowledge: K });
    if (claims(it).some((s) => s.strength === 'well supported')) withClaims++;
  }
  assert.ok(withClaims <= 3, `${withClaims} of 30 random people got a well-supported interpretation`);
});

test('interpretations are specific: real tastes are illustrated with works from several films, with counts', () => {
  for (const p of PEOPLE.filter((x) => x.truth.length && x.count >= 50)) {
    const { it, library } = run(p.name);
    // The leading section: a liked theme or finding, or an aversion when the taste shows mainly in what is passed over.
    let lead = claims(it).filter((s) => s.kind === 'theme' || s.kind === 'finding');
    if (!lead.length) lead = claims(it).filter((s) => s.kind === 'aversion');
    assert.ok(lead.length, `${p.name}: no theme`);
    const ev = lead[0].claims[0].evidence, ex = lead[0].kind === 'aversion' ? ev.disliked : ev.liked;
    assert.ok(ex.length >= 2, `${p.name}: fewer than two examples`);
    assert.ok(new Set(ex.map((id) => library.items[id].work)).size === ex.length, `${p.name}: examples repeat a work`);
    assert.match(lead[0].text, /\d+ of \d+/, `${p.name}: no counts`);
  }
});

test('interpretations recover the hidden rule (or what stands for it) and differ between people', () => {
  const cinema = PEOPLE.filter((p) => p.area === 'cinema' && p.truth.length && p.count >= 50);
  for (const p of [...cinema, ...PEOPLE.filter((x) => x.synthetic)]) {
    const { it, library } = run(p.name);
    const f = featuresOf(it);
    const truth = p.truth.flatMap((t) => [t, ...Object.entries(library.terms).filter(([, v]) => v.group && v.group.includes(t)).map(([k]) => k)]);
    assert.ok(truth.some((t) => f.has(t)), `${p.name}: none of ${p.truth.join(', ')} in ${[...f].join(', ')}`);
  }
  const summaries = PEOPLE.map((p) => run(p.name).it.summary);
  assert.equal(new Set(summaries).size, summaries.length, 'two people got the same summary');
  const sets = cinema.map((p) => featuresOf(run(p.name).it));
  let total = 0, pairs = 0;
  for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) {
    const inter = [...sets[i]].filter((x) => sets[j].has(x)).length, union = new Set([...sets[i], ...sets[j]]).size;
    total += union ? inter / union : 0; pairs++;
  }
  assert.ok(total / pairs < 0.25, `average overlap of claimed characteristics between people is ${(total / pairs).toFixed(2)}`);
});

test('two unrelated tastes are described as two strands', () => {
  const { it } = run('two-strands');
  assert.ok(it.sections.some((s) => s.kind === 'strands'));
  assert.ok(it.sections.some((s) => s.id === 'theme-chiaroscuro') && it.sections.some((s) => s.id === 'theme-drawn-worlds'));
});

test('craft explanations come from the knowledge file, and every theme names its techniques with counts', () => {
  for (const p of PEOPLE) for (const s of run(p.name).it.sections.filter((x) => x.id.startsWith('theme-'))) {
    const q = K[p.area].find((x) => `theme-${x.id}` === s.id);
    assert.ok(q && s.text.includes(q.explains), `${p.name} ${s.id}`);
  }
});

test('language: no judgment of the person, no unfinished sentences, no artefacts', () => {
  const banned = /\b(should|better taste|sophisticated|unsophisticated|mistake|wrong|correct your|good taste|bad taste|you need)\b/i;
  for (const p of PEOPLE) {
    const text = I.toText(run(p.name).it);
    assert.doesNotMatch(text, banned, p.name);
    assert.doesNotMatch(text, /undefined|NaN|\[object|\(\)|\s,|,,|\.\./, p.name);
    for (const s of run(p.name).it.sections) assert.match(s.text, /[.?!]$/, `${p.name} ${s.id}`);
  }
});

test('the interpretation layer is separate: it never alters the statistics and works without the knowledge file', () => {
  const pz = PEOPLE.find((p) => p.name === 'chiaroscuro'), b = build(pz);
  const result = A.analyse({ judgments: b.judgments, library: b.library });
  const before = JSON.stringify(result);
  const it = I.interpret({ result, library: b.library, judgments: b.judgments, knowledge: null });
  assert.equal(JSON.stringify(result), before);
  assert.ok(claims(it).length > 0, 'still describes findings without craft knowledge');
  assert.ok(verify(it, b).ok);
  const again = I.interpret({ result, library: b.library, judgments: b.judgments, knowledge: K });
  assert.equal(JSON.stringify(again), JSON.stringify(I.interpret({ result, library: b.library, judgments: b.judgments, knowledge: K })), 'deterministic');
});
