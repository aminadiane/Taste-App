// Stress test for the taste engine: many seeded simulated users per scenario, measuring how often the engine
// claims something false and how often it recovers a real preference.
// Usage: node tools/stress-engine.js [--seeds 100] [--json out.json]
// Deterministic for a given seed count. Writes nothing unless --json is given.
const path = require('node:path');
const fs = require('node:fs');
const ROOT = path.join(__dirname, '..');
const A = require(path.join(ROOT, 'js', 'taste', 'analyse.js'));
const U = require(path.join(ROOT, 'tests', 'fixtures', 'simulated-users.js'));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const SEEDS = Number(arg('--seeds', 100));

const cinema = U.cinemaLibrary();
const lit = U.syntheticLiterature(60, 7).lib;
const ids = (lib) => Object.keys(lib.items).sort();
const works = (lib) => [...new Set(Object.values(lib.items).map((i) => i.work))].sort();
const sub = (j, n, R) => { const k = Object.keys(j).sort(); for (let i = k.length - 1; i > 0; i--) { const r = Math.floor(R() * (i + 1)); [k[i], k[r]] = [k[r], k[i]]; } return Object.fromEntries(k.slice(0, n).map((x) => [x, j[x]])); };

// Each scenario returns judgments for a seed, and optionally the features that are genuinely driving the choices.
const SCENARIOS = [
  { name: 'random, likes half', kind: 'null', lib: cinema, make: (s) => U.judge(cinema, () => 0.5, s) },
  { name: 'random, likes 20%', kind: 'null', lib: cinema, make: (s) => U.judge(cinema, () => 0.2, s) },
  { name: 'random, likes 85%', kind: 'null', lib: cinema, make: (s) => U.judge(cinema, () => 0.85, s) },
  { name: 'random, 12 judgments', kind: 'null', lib: cinema, make: (s) => sub(U.judge(cinema, () => 0.5, s), 12, U.rng(s + 7)) },
  { name: 'random, 25 judgments', kind: 'null', lib: cinema, make: (s) => sub(U.judge(cinema, () => 0.5, s), 25, U.rng(s + 7)) },
  { name: 'random literature (60 synthetic)', kind: 'null', lib: lit, make: (s) => U.judge(lit, () => 0.5, s) },
  {
    // Likes whole films, chosen at random: a preference for particular films, with no aesthetic rule behind it.
    name: 'likes 8 random films', kind: 'film-loyal', lib: cinema,
    make: (s) => { const R = U.rng(s), w = works(cinema), liked = new Set(); while (liked.size < 8) liked.add(w[Math.floor(R() * w.length)]); return U.judge(cinema, (fs, it) => (liked.has(it.work) ? 0.9 : 0.1), s + 1); },
  },
  {
    name: 'likes 3 random films', kind: 'film-loyal', lib: cinema,
    make: (s) => { const R = U.rng(s), w = works(cinema), liked = new Set(); while (liked.size < 3) liked.add(w[Math.floor(R() * w.length)]); return U.judge(cinema, (fs, it) => (liked.has(it.work) ? 0.95 : 0.15), s + 1); },
  },
  { name: 'warm low-key (strong rule)', kind: 'true', lib: cinema, truth: ['key:low', 'temperature:warm'], make: (s) => U.judge(cinema, U.USERS['warm-low-key'].rule, s) },
  { name: 'bright symmetrical (strong rule)', kind: 'true', lib: cinema, truth: ['composition:symmetrical', 'key:low'], make: (s) => U.judge(cinema, U.USERS['bright-symmetrical'].rule, s) },
  { name: 'hard light (moderate rule)', kind: 'true', lib: cinema, truth: ['lightQuality:hard'], make: (s) => U.judge(cinema, (fs) => (fs.has('lightQuality:hard') ? 0.75 : 0.3), s) },
  { name: 'black and white (strong rule)', kind: 'true', lib: cinema, truth: ['saturation:monochrome'], make: (s) => U.judge(cinema, (fs) => (fs.has('saturation:monochrome') ? 0.85 : 0.15), s) },
  { name: 'close shots (rare feature)', kind: 'true', lib: cinema, truth: ['shotScale:close-range', 'shotScale:close-up', 'shotScale:extreme-close-up', 'shotScale:medium-close'], make: (s) => U.judge(cinema, (fs) => (fs.has('shotScale:close-up') || fs.has('shotScale:extreme-close-up') || fs.has('shotScale:medium-close') ? 0.9 : 0.3), s) },
  { name: 'warm low-key, only 20 judgments', kind: 'true', lib: cinema, truth: ['key:low', 'temperature:warm'], make: (s) => sub(U.judge(cinema, U.USERS['warm-low-key'].rule, s), 20, U.rng(s + 3)) },
  { name: 'restrained prose (60 synthetic)', kind: 'true', lib: lit, truth: ['register:restrained'], make: (s) => U.judge(lit, U.USERS['restrained-prose'].rule, s) },
  {
    // Inconsistent: follows the warm low-key rule only 40% of the time, otherwise random.
    name: 'inconsistent warm low-key', kind: 'true', lib: cinema, truth: ['key:low', 'temperature:warm'],
    make: (s) => { const R = U.rng(s + 99); return U.judge(cinema, (fs, it) => (R() < 0.4 ? U.USERS['warm-low-key'].rule(fs, it) : 0.5), s); },
  },
];

const unexplained = (res, lvls) => res.findings.filter((f) => !f.explainedBy && !f.inseparableFrom && lvls.includes(f.strength));
function runScenario(sc) {
  const out = { name: sc.name, kind: sc.kind, users: 0, anyWell: 0, anyEmerging: 0, recovered: 0, falseWell: 0, reportedWell: 0, combosWell: 0, ms: 0 };
  for (let s = 1; s <= SEEDS; s++) {
    const j = sc.make(1000 * s + 17);
    const t = Date.now();
    const res = A.analyse({ judgments: j, library: sc.lib });
    out.ms += Date.now() - t; out.users++;
    const well = unexplained(res, ['well supported']), em = unexplained(res, ['well supported', 'emerging']);
    if (well.length) out.anyWell++;
    if (em.length) out.anyEmerging++;
    out.combosWell += res.combinations.filter((c) => c.strength === 'well supported').length ? 1 : 0;
    if (sc.truth) {
      // Recovered: a truth feature is well supported in the expected direction (the second bright-symmetrical truth is a dislike).
      if (well.some((f) => sc.truth.includes(f.feature))) out.recovered++;
      // Correlates of the true rule are legitimate; count as false only well-supported findings unrelated to any truth feature
      // by co-occurrence (none of the truth features' items overlap it by more than half).
      const truthItems = new Set(sc.truth.flatMap((t) => ids(sc.lib).filter((id) => sc.lib.items[id].features.includes(t))));
      for (const f of well) {
        out.reportedWell++;
        if (sc.truth.includes(f.feature)) continue;
        // Legitimate: another value of a truth dimension (the mirror image, e.g. mid-key disliked when low-key is liked),
        // or a characteristic that mostly co-occurs with the truth (liked) or mostly with its absence (disliked).
        const dims = new Set(sc.truth.filter((t) => sc.lib.terms[t]).map((t) => sc.lib.terms[t].dimension));
        if (dims.has(f.dimension)) continue;
        const its = ids(sc.lib).filter((id) => sc.lib.items[id].features.includes(f.feature));
        const overlap = its.filter((id) => truthItems.has(id)).length / its.length;
        if (f.direction === 'liked' ? overlap < 0.5 : overlap > 0.5) out.falseWell++;
      }
    } else { out.reportedWell += well.length; out.falseWell += well.length; }
  }
  return out;
}

const rows = SCENARIOS.map(runScenario);
const pc = (a, b) => (b ? Math.round((100 * a) / b) + '%' : '—');
console.log(`taste engine ${A.VERSION}: ${SEEDS} simulated users per scenario\n`);
console.log('scenario'.padEnd(36), 'kind'.padEnd(11), 'any well'.padStart(9), 'any emerg'.padStart(10), 'recovered'.padStart(10), 'false/well'.padStart(11), 'combo'.padStart(7), 'ms/user'.padStart(8));
for (const r of rows) console.log(r.name.padEnd(36), r.kind.padEnd(11), pc(r.anyWell, r.users).padStart(9), pc(r.anyEmerging, r.users).padStart(10), (r.kind === 'true' ? pc(r.recovered, r.users) : '').padStart(10), `${r.falseWell}/${r.reportedWell}`.padStart(11), pc(r.combosWell, r.users).padStart(7), (r.ms / r.users).toFixed(0).padStart(8));
const out = arg('--json');
if (out) fs.writeFileSync(out, JSON.stringify({ engine: A.VERSION, seeds: SEEDS, rows }, null, 2) + '\n');
