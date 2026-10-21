// Run: node --test tests/*.test.js
// Tests the taste engine: statistical accuracy, determinism, simulated users with contrasting tastes,
// and the guards against unsupported conclusions.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const S = require(path.join(ROOT, 'js', 'taste', 'stats.js'));
const A = require(path.join(ROOT, 'js', 'taste', 'analyse.js'));
const P = require(path.join(ROOT, 'js', 'taste', 'profile.js'));
const U = require('./fixtures/simulated-users.js');

const AT = '2026-10-21T00:00:00.000Z';
function profileOf(name) {
  const r = U.run(name);
  const result = A.analyse({ judgments: r.judgments, library: r.library, history: r.history });
  return { ...r, result, profile: P.build(result, { judgments: r.judgments, history: r.history, generatedAt: AT }) };
}
const feats = (list) => list.filter((f) => !f.explainedBy).map((f) => f.feature);
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

/* ---------- statistics against published reference values ---------- */
test('Fisher exact test matches reference values', () => {
  near(S.fisherExact(3, 1, 1, 3), 0.4857, 1e-4, "Fisher's tea-tasting table");
  near(S.fisherExact(8, 1, 2, 5), 0.03497, 1e-5, 'R fisher.test(matrix(c(8,2,1,5),2))');
  near(S.fisherExact(10, 0, 0, 10), 2 / 184756, 1e-12, 'perfect separation, 2 / C(20,10)');
  assert.equal(S.fisherExact(5, 5, 5, 5), 1);
});
test('Wilson interval, Benjamini–Hochberg and chi-square tail match reference values', () => {
  const [lo, hi] = S.wilson(8, 10);
  near(lo, 0.4902, 1e-4, 'Wilson lower'); near(hi, 0.9433, 1e-4, 'Wilson upper');
  assert.deepEqual(S.wilson(0, 0), [0, 1]);
  assert.deepEqual(S.benjaminiHochberg([0.01, 0.04, 0.03, 0.005]).map((x) => S.round(x, 6)), [0.02, 0.04, 0.04, 0.02]);
  near(S.chi2p1(3.841459), 0.05, 1e-5, 'chi-square 1 df at 3.84');
  near(S.erfc(1), 0.1572992, 1e-6, 'erfc(1)');
});
test('Cochran–Mantel–Haenszel matches a worked example and finds no association when a confounder explains it', () => {
  near(S.cmh([[10, 2, 3, 10], [8, 3, 2, 9]]).chi2, 12.84, 0.01, 'CMH chi-square');
  // Within each stratum the feature makes no difference: 50% liked with and without it.
  assert.ok(S.cmh([[4, 4, 2, 2], [1, 1, 3, 3]]).p > 0.9);
});
test('normalised entropy is 0 for one category and 1 for an even spread', () => {
  assert.equal(S.normalisedEntropy({ a: 5 }, 3), 0);
  near(S.normalisedEntropy({ a: 2, b: 2, c: 2 }, 3), 1, 1e-12, 'even');
});

/* ---------- calculations reported in findings are the true counts ---------- */
test('finding statistics agree with a direct count of the judgments', () => {
  const { result, judgments, library } = profileOf('warm-low-key');
  for (const f of result.findings) {
    const ids = Object.keys(judgments).filter((id) => library.items[id].features.includes(f.feature));
    const liked = ids.filter((id) => judgments[id] === 'like').length;
    assert.equal(f.stats.exposed, ids.length, f.feature);
    assert.equal(f.stats.likedWhenPresent, liked, f.feature);
    assert.equal(f.evidence.supporting.length + f.evidence.contradicting.length, ids.length, f.feature);
    near(f.stats.rateWhenPresent, liked / ids.length, 0.001, f.feature);
    const L = Object.values(judgments).filter((k) => k === 'like').length, n = Object.keys(judgments).length;
    near(f.stats.p, S.fisherExact(liked, ids.length - liked, L - liked, n - L - (ids.length - liked)), 1e-4, f.feature);
  }
});

test('the engine is deterministic: the same input gives byte-identical output', () => {
  const a = JSON.stringify(profileOf('bright-symmetrical').profile), b = JSON.stringify(profileOf('bright-symmetrical').profile);
  assert.equal(a, b);
});

test('the engine never modifies its inputs', () => {
  const r = U.run('warm-low-key');
  const before = JSON.stringify([r.judgments, r.library, r.history]);
  A.analyse({ judgments: r.judgments, library: r.library, history: r.history });
  assert.equal(JSON.stringify([r.judgments, r.library, r.history]), before);
});

/* ---------- simulated users ---------- */
test('warm, low-key cinematography: low key and warm colour are found, and their combination', () => {
  const { result, profile } = profileOf('warm-low-key');
  const liked = feats(result.findings.filter((f) => f.direction === 'liked' && f.strength === 'well supported'));
  assert.ok(liked.includes('key:low'), liked);
  // Warmth holds across stills; across films it is marginal for this seed, so the work-level check grades it emerging.
  const warm = result.findings.find((f) => f.feature === 'temperature:warm');
  assert.ok(warm && warm.direction === 'liked' && ['well supported', 'emerging'].includes(warm.strength));
  assert.ok(result.combinations.some((c) => c.features.map((f) => f.feature).sort().join() === 'key:low,temperature:warm' && c.direction === 'liked'));
  assert.equal(profile.evidenceLevel, 'established');
  assert.match(profile.signature.summary, /low-key/); assert.match(profile.signature.summary, /warm/);
});

test('bright, symmetrical compositions: symmetry is liked and low key is disliked', () => {
  const { result, profile } = profileOf('bright-symmetrical');
  const ws = result.findings.filter((f) => f.strength === 'well supported');
  assert.ok(ws.some((f) => f.feature === 'composition:symmetrical' && f.direction === 'liked'));
  assert.ok(ws.some((f) => f.feature === 'key:low' && f.direction === 'disliked'));
  assert.match(profile.signature.summary, /symmetrical/);
  assert.doesNotMatch(profile.signature.summary, /leaning towards[^.]*low-key/);
});

test('eclectic taste: no pattern is claimed and likes are reported as broadly spread', () => {
  const { result, profile } = profileOf('eclectic');
  assert.equal(result.findings.filter((f) => f.strength !== 'tentative').length, 0);
  assert.equal(profile.evidenceLevel, 'no-pattern');
  assert.equal(result.spread.reading, 'broad');
  assert.match(profile.signature.summary, /No characteristic stands out/);
});

test('restrained prose: restrained register is found, with plain observable features explained by it', () => {
  const { result, profile } = profileOf('restrained-prose');
  const top = result.findings[0];
  assert.equal(top.feature, 'register:restrained'); assert.equal(top.direction, 'liked'); assert.equal(top.strength, 'well supported');
  assert.ok(result.findings.some((f) => f.feature === 'sentenceLength:long' && f.direction === 'disliked'));
  assert.match(profile.signature.summary, /restrained prose/);
});

test('lyrical or experimental prose: restrained prose is disliked and lyrical / experimental registers are liked', () => {
  const { result } = profileOf('lyrical-experimental-prose');
  assert.ok(result.findings.some((f) => f.feature === 'register:restrained' && f.direction === 'disliked' && f.strength === 'well supported'));
  const liked = result.findings.filter((f) => f.direction === 'liked').map((f) => f.feature);
  assert.ok(liked.includes('register:lyrical') && liked.includes('register:experimental'), liked);
});

test('insufficient and inconsistent evidence: nothing is concluded, and the reversals are reported', () => {
  const { result, profile } = profileOf('inconsistent-few');
  assert.equal(result.status, 'insufficient');
  assert.equal(result.findings.length, 0); assert.equal(result.combinations.length, 0);
  assert.equal(profile.preferred.length + profile.disliked.length, 0);
  assert.match(profile.signature.summary, /Not enough judgments/);
  assert.equal(result.consistency.changedJudgments.length, 2);
});

test('contrasting users get meaningfully different profiles', () => {
  const names = ['warm-low-key', 'bright-symmetrical', 'eclectic'];
  const sets = names.map((n) => new Set(profileOf(n).profile.signature.terms));
  const jaccard = (a, b) => { const i = [...a].filter((x) => b.has(x)).length, u = new Set([...a, ...b]).size; return u ? i / u : 0; };
  assert.ok(jaccard(sets[0], sets[1]) < 0.34, 'warm low-key vs bright symmetrical signatures overlap too much');
  assert.equal(sets[2].size, 0, 'eclectic user has no signature terms');
  // Opposite directions on key between the first two.
  const w = profileOf('warm-low-key').profile, b = profileOf('bright-symmetrical').profile;
  assert.ok(w.preferred.some((f) => f.feature === 'key:low') && b.disliked.some((f) => f.feature === 'key:low'));
  const r = profileOf('restrained-prose').profile, l = profileOf('lyrical-experimental-prose').profile;
  assert.ok(r.preferred.some((f) => f.feature === 'register:restrained') && l.disliked.some((f) => f.feature === 'register:restrained'));
});

/* ---------- guards against unsupported conclusions ---------- */
test('random judgments rarely produce a well-supported finding (false-discovery control)', () => {
  const lib = U.cinemaLibrary();
  let users = 0, falseWell = 0, falseEmerging = 0;
  for (let seed = 1000; seed < 1040; seed++) {
    const res = A.analyse({ judgments: U.judge(lib, () => 0.5, seed), library: lib });
    users++;
    if (res.findings.some((f) => f.strength === 'well supported')) falseWell++;
    if (res.findings.some((f) => f.strength !== 'tentative')) falseEmerging++;
  }
  assert.ok(falseWell / users <= 0.1, `${falseWell} of ${users} random users got a well-supported finding`);
  assert.ok(falseEmerging / users <= 0.2, `${falseEmerging} of ${users} random users got an emerging finding`);
});

test('below the minimum number of judgments nothing is reported; one-sided judgments are named as such', () => {
  const lib = U.cinemaLibrary(), ids = Object.keys(lib.items).sort();
  const few = Object.fromEntries(ids.slice(0, 7).map((id) => [id, 'like']));
  assert.equal(A.analyse({ judgments: few, library: lib }).status, 'insufficient');
  const allLiked = Object.fromEntries(ids.slice(0, 20).map((id) => [id, 'like']));
  const res = A.analyse({ judgments: allLiked, library: lib });
  assert.equal(res.status, 'one-sided'); assert.equal(res.findings.length, 0);
  assert.match(P.build(res, { judgments: allLiked }).signature.summary, /was liked/);
});

test('evidence drawn from a single work is never more than tentative', () => {
  const lib = U.cinemaLibrary(), ids = Object.keys(lib.items).sort();
  // Like only the three Lawrence of Arabia stills with daylight… plus everything from one other film; dislike the rest.
  const j = Object.fromEntries(ids.map((id) => [id, lib.items[id].work === 'lawrence-of-arabia' ? 'like' : 'dislike']));
  const res = A.analyse({ judgments: j, library: lib });
  for (const f of res.findings) if (f.direction === 'liked') assert.equal(f.strength, 'tentative', f.feature);
});

test('characteristics that always co-occur are reported together, not as separate findings', () => {
  const { result } = profileOf('warm-low-key');
  const all = result.findings.flatMap((f) => [f.feature, ...f.aliases.map((a) => a.feature)]);
  assert.equal(all.length, new Set(all).size);
});

test('skips and unknown items are not treated as judgments', () => {
  const lib = U.cinemaLibrary(), ids = Object.keys(lib.items).sort();
  const j = Object.fromEntries(ids.slice(0, 10).map((id, i) => [id, i % 2 ? 'like' : 'dislike']));
  const res = A.analyse({ judgments: { ...j, 'gone-still-01': 'like', [ids[20]]: 'skip' }, library: lib });
  assert.equal(res.counts.judged, 10); assert.equal(res.counts.notInLibrary, 1);
});

/* ---------- profiles and snapshots ---------- */
test('a profile carries evidence, confidence, terminology and limitations for every finding', () => {
  const { profile } = profileOf('warm-low-key');
  assert.equal(profile.schema, 'pallas.taste-profile/1');
  for (const f of [...profile.preferred, ...profile.disliked]) {
    assert.ok(['tentative', 'emerging', 'well supported'].includes(f.strength));
    assert.ok(f.evidence.supporting.length > 0, f.feature);
    assert.ok(Array.isArray(f.stats.interval) && f.stats.interval.length === 2);
    assert.ok(profile.terminology.some((t) => t.term === f.feature && t.definition), f.feature);
  }
  assert.ok(profile.limitations.length >= 3);
  assert.deepEqual(profile.interpretations, []);
  assert.equal(profile.basedOn.judgmentsDigest, P.digest(U.run('warm-low-key').judgments));
});

test('comparing two snapshots shows how a taste developed', () => {
  const r = U.run('warm-low-key');
  const ids = Object.keys(r.judgments).sort();
  const early = Object.fromEntries(ids.slice(0, 40).map((id) => [id, r.judgments[id]]));
  const p1 = P.build(A.analyse({ judgments: early, library: r.library }), { judgments: early, generatedAt: '2026-10-01T00:00:00Z' });
  const p2 = P.build(A.analyse({ judgments: r.judgments, library: r.library }), { judgments: r.judgments, generatedAt: AT });
  const d = P.compare(p1, p2);
  assert.equal(d.from, '2026-10-01T00:00:00Z'); assert.equal(d.to, AT);
  assert.ok(d.added.length + d.strengthened.length > 0);
  for (const k of ['added', 'removed', 'strengthened', 'weakened', 'unchanged']) assert.ok(Array.isArray(d[k]));
});

test('thresholds can be changed without code changes, and results record the thresholds used', () => {
  const r = U.run('warm-low-key');
  const strict = A.analyse({ judgments: r.judgments, library: r.library, options: { wellQ: 0.001 } });
  assert.equal(strict.options.wellQ, 0.001);
  assert.ok(strict.findings.filter((f) => f.strength === 'well supported').length < A.analyse({ judgments: r.judgments, library: r.library }).findings.filter((f) => f.strength === 'well supported').length);
});

/* ---------- added with engine 1.1.0 (stress-test findings) ---------- */
test('liking whole films is not mistaken for an aesthetic preference that rests on one film', () => {
  const lib = U.cinemaLibrary();
  // Likes every still of two films and nothing else.
  const j = Object.fromEntries(Object.keys(lib.items).sort().map((id) => [id, ['metropolis', 'the-godfather'].includes(lib.items[id].work) ? 'like' : 'dislike']));
  const res = A.analyse({ judgments: j, library: lib });
  for (const f of res.findings) if (f.direction === 'liked' && !f.explainedBy) assert.notEqual(f.strength, 'well supported', f.feature);
});

test('every emerging or well-supported finding reports leave-one-work-out and work-level statistics', () => {
  const { result } = profileOf('bright-symmetrical');
  for (const f of result.findings.filter((x) => x.strength !== 'tentative')) {
    assert.ok(f.stats.leaveOneWorkOutP < 0.05, f.feature);
    assert.ok(f.stats.workLevelP < (f.strength === 'well supported' ? 0.05 : 0.2), f.feature);
  }
});

test('grouped terms let a preference spread across rare values be found', () => {
  const lib = U.cinemaLibrary();
  assert.ok(lib.items['amelie-02'].features.includes('shotScale:close-range'));
  const j = U.judge(lib, (fs) => (fs.has('shotScale:close-range') ? 0.95 : 0.25), 5);
  const res = A.analyse({ judgments: j, library: lib });
  assert.ok(res.findings.some((f) => (f.feature === 'shotScale:close-range' || f.aliases.some((a) => a.feature === 'shotScale:close-range')) && f.direction === 'liked'));
});

test('tentative findings never reach the signature', () => {
  const lib = U.cinemaLibrary();
  for (let seed = 200; seed < 230; seed++) {
    const j = U.judge(lib, () => 0.5, seed);
    const res = A.analyse({ judgments: j, library: lib }), p = P.build(res, { judgments: j });
    const tentative = new Set(res.findings.filter((f) => f.strength === 'tentative').map((f) => f.feature));
    for (const t of p.signature.terms) assert.ok(!tentative.has(t), `${seed}: ${t}`);
  }
});
