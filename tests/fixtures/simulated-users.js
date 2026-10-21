// Simulated users with contrasting tastes, shared by tests/taste-engine.test.js and tools/example-profiles.js.
// Every choice comes from a written rule plus a seeded random number generator, so results are reproducible.
const path = require('node:path');
const ROOT = path.join(__dirname, '..', '..');
const F = require(path.join(ROOT, 'js', 'taste', 'features.js'));

// mulberry32: small, fast, deterministic PRNG.
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function cinemaLibrary() {
  return F.cinema(require(path.join(ROOT, 'library', 'stills.json')), require(path.join(ROOT, 'library', 'cinema-metadata.json')), require(path.join(ROOT, 'library', 'vocab', 'cinema.json')));
}

/* A synthetic literature corpus for testing only (the real library has five passages). Each passage gets a
   coherent bundle of features drawn from one of four prose families, with some variation, so tastes for
   restrained, lyrical and experimental prose can be told apart. Nothing here is shown to users. */
function syntheticLiterature(count = 36, seed = 7) {
  const vocab = require(path.join(ROOT, 'library', 'vocab', 'literature.json'));
  const R = rng(seed), pick = (xs) => xs[Math.floor(R() * xs.length)];
  const families = {
    restrained: { register: 'restrained', diction: ['plain', 'colloquial'], figuration: ['sparse', 'sparse', 'moderate'], sentenceLength: ['short', 'short', 'varied'], syntax: ['paratactic'], device: ['close-detail', 'withheld-identity', 'self-correction'] },
    lyrical: { register: 'lyrical', diction: ['formal', 'ornate'], figuration: ['rich', 'rich', 'moderate'], sentenceLength: ['long', 'long', 'varied'], syntax: ['hypotactic', 'cumulative'], device: ['repetition', 'polysyndeton', 'list'] },
    experimental: { register: 'experimental', diction: ['plain', 'ornate', 'colloquial'], figuration: ['moderate', 'rich'], sentenceLength: ['varied', 'long'], syntax: ['fragmented'], device: ['stream-of-consciousness', 'unmarked-speech', 'free-indirect'] },
    ornamental: { register: 'ornamental', diction: ['ornate'], figuration: ['rich'], sentenceLength: ['long'], syntax: ['hypotactic'], device: ['list', 'repetition'] },
  };
  const names = Object.keys(families), passages = [];
  for (let i = 0; i < count; i++) {
    const fam = names[i % names.length], f = families[fam];
    passages.push({
      id: `synthetic-${String(i + 1).padStart(2, '0')}`, book: `synthetic-book-${Math.floor(i / 2) + 1}`, family: fam,
      metadata: {
        features: {
          person: pick(['first', 'first', 'third', 'third', 'second']), tense: pick(['past', 'past', 'present', 'mixed']),
          narration: pick(['immediate', 'retrospective', 'retrospective', 'epistolary']), sentenceLength: pick(f.sentenceLength),
          syntax: pick(f.syntax), diction: pick(f.diction), figuration: pick(f.figuration), dialogue: pick(['none', 'none', 'marked', 'unmarked']),
          focus: pick(['action', 'interior', 'reflection', 'description']), pace: pick(['scene', 'summary', 'digressive']), device: [pick(f.device), pick(f.device)].filter((v, k, a) => a.indexOf(v) === k),
        },
        interpretation: { features: { register: f.register, tone: [pick(['tense', 'tender', 'melancholy', 'calm', 'reflective', 'uneasy', 'comic'])] } },
      },
    });
  }
  return { lib: F.literature({ passages }, vocab), passages };
}

// Judgments from a rule: rule(featureSet, item) → probability of a like. Every item is judged once, in id order.
function judge(library, rule, seed) {
  const R = rng(seed), out = {};
  for (const id of Object.keys(library.items).sort()) {
    const fs = new Set(library.items[id].features);
    out[id] = R() < rule(fs, library.items[id], id) ? 'like' : 'dislike';
  }
  return out;
}

// Store-shaped history for judgments, with optional re-votes, so the consistency summary can be exercised.
function historyFor(area, judgments, flips = []) {
  let t = Date.UTC(2026, 9, 21, 9, 0, 0);
  const ev = (item, kind) => ({ id: `e${t}`, t: new Date((t += 1000)).toISOString(), area, item, work: null, kind, session: 's1' });
  const h = Object.entries(judgments).map(([item, kind]) => ev(item, kind));
  for (const item of flips) { const k = judgments[item]; h.push(ev(item, k === 'like' ? 'dislike' : 'like')); h.push(ev(item, k)); }
  return h;
}

const has = (fs, ...keys) => keys.every((k) => fs.has(k));
const USERS = {
  'warm-low-key': {
    area: 'cinema', seed: 11,
    describe: 'Likes warm, low-key cinematography: dark frames with warm colour. Other low-key or warm images sometimes; little else.',
    rule: (fs) => (has(fs, 'key:low', 'temperature:warm') ? 0.95 : fs.has('key:low') ? 0.45 : fs.has('temperature:warm') ? 0.35 : 0.06),
    expect: { liked: ['key:low', 'temperature:warm'] },
  },
  'bright-symmetrical': {
    area: 'cinema', seed: 12,
    describe: 'Likes bright, symmetrical compositions: mid- or high-key frames arranged around the centre. Dislikes low-key images.',
    rule: (fs) => (fs.has('key:low') ? 0.05 : fs.has('composition:symmetrical') || fs.has('symmetry:strong') ? 0.95 : fs.has('composition:centred') ? 0.5 : 0.2),
    expect: { liked: ['composition:symmetrical'], disliked: ['key:low'] },
  },
  eclectic: {
    area: 'cinema', seed: 13,
    describe: 'Eclectic: likes about half of everything, with no relation to any characteristic.',
    rule: () => 0.5,
    expect: { noWellSupported: true },
  },
  'restrained-prose': {
    area: 'literature', seed: 21,
    describe: 'Prefers restrained prose: plain words, sparse figuration, short sentences.',
    rule: (fs) => (fs.has('register:restrained') ? 0.9 : fs.has('figuration:sparse') ? 0.4 : 0.08),
    expect: { liked: ['register:restrained'] },
  },
  'lyrical-experimental-prose': {
    area: 'literature', seed: 22,
    describe: 'Prefers lyrical or experimental prose: rich figuration, long or broken sentences.',
    rule: (fs) => (fs.has('register:lyrical') || fs.has('register:experimental') ? 0.9 : fs.has('figuration:rich') ? 0.35 : 0.08),
    expect: { disliked: ['register:restrained'] },
  },
  'inconsistent-few': {
    area: 'cinema', seed: 31,
    describe: 'Insufficient and inconsistent evidence: only six judgments, two of which were later reversed.',
    rule: () => 0.5, limit: 6, flips: 2,
    expect: { status: 'insufficient' },
  },
};

// Builds the judgments and history for a named user.
function run(name) {
  const u = USERS[name];
  const lib = u.area === 'cinema' ? cinemaLibrary() : syntheticLiterature().lib;
  let j = judge(lib, u.rule, u.seed);
  if (u.limit) j = Object.fromEntries(Object.entries(j).slice(0, u.limit));
  const flips = u.flips ? Object.keys(j).slice(0, u.flips) : [];
  return { user: u, library: lib, judgments: j, history: historyFor(lib.area, j, flips) };
}

/* A realistic history: the person works through the library in its own order (as the screens present it), judges the
   first `count` works, skips some, and changes their mind on a few. Returns the latest judgments and store-shaped events. */
function realistic(library, order, rule, seed, { count = 60, skipRate = 0.08, changeRate = 0.04 } = {}) {
  const R = rng(seed), events = [], judgments = {};
  let t = Date.UTC(2026, 9, 1, 19, 0, 0), session = 1;
  const ev = (item, kind) => events.push({ id: `e${events.length + 1}`, t: new Date((t += 9000 + Math.floor(R() * 20000))).toISOString(), area: library.area, item, work: library.items[item].work, kind, session: `s${session}` });
  let judgedCount = 0;
  for (const id of order) {
    if (judgedCount >= count) break;
    if (!library.items[id]) continue;
    if (judgedCount && judgedCount % 25 === 0) { session++; t += 86400000 * 2; }
    if (R() < skipRate) { ev(id, 'skip'); continue; }
    const kind = R() < rule(new Set(library.items[id].features), library.items[id], id) ? 'like' : 'dislike';
    ev(id, kind); judgments[id] = kind; judgedCount++;
  }
  // Second thoughts: a few earlier judgments reversed in a later session.
  session++; t += 86400000 * 3;
  for (const id of Object.keys(judgments).sort()) if (R() < changeRate) { const k = judgments[id] === 'like' ? 'dislike' : 'like'; ev(id, k); judgments[id] = k; }
  return { judgments, history: events };
}

module.exports = { rng, cinemaLibrary, syntheticLiterature, judge, historyFor, realistic, USERS, run };
