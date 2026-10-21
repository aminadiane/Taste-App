// Simulated people for example profiles, interpretations and their tests. Each follows a hidden rule with seeded
// randomness and works through the library as the screens present it (see simulated-users.js `realistic`).
const has = (fs, k) => fs.has(k);
const hardLow = (fs) => (has(fs, 'lightQuality:hard') && has(fs, 'key:low') ? 0.9 : has(fs, 'lightQuality:hard') || has(fs, 'key:low') ? 0.5 : 0.12);
const PEOPLE = [
  { name: 'chiaroscuro', area: 'cinema', seed: 41, count: 75, title: 'Chiaroscuro', hidden: 'Likes hard light in low-key frames (90%); low key or hard light alone sometimes (50%); anything else rarely (12%).', truth: ['lightQuality:hard', 'key:low'], rule: hardLow },
  { name: 'colour-and-design', area: 'cinema', seed: 42, count: 80, title: 'Colour and design', hidden: 'Likes saturated colour or symmetrical composition in colour images (85%); dislikes black and white (10%); otherwise 35%.', truth: ['saturation:saturated', 'composition:symmetrical', 'saturation:monochrome'],
    rule: (fs) => (has(fs, 'saturation:monochrome') ? 0.1 : has(fs, 'saturation:saturated') || has(fs, 'composition:symmetrical') ? 0.85 : 0.35) },
  { name: 'landscapes', area: 'cinema', seed: 43, count: 70, title: 'Landscapes', hidden: 'Likes distant exterior shots (85%); dislikes close shots (5%); otherwise 30%.', truth: ['shotScale:distant', 'setting:exterior', 'shotScale:close-range'],
    rule: (fs) => (has(fs, 'shotScale:distant') && has(fs, 'setting:exterior') ? 0.85 : has(fs, 'shotScale:close-range') ? 0.05 : 0.3) },
  { name: 'faces', area: 'cinema', seed: 44, count: 85, title: 'Faces', hidden: 'Likes close shots or shallow focus (85%); dislikes extreme wide shots (10%); otherwise 25%.', truth: ['shotScale:close-range', 'focus:shallow', 'shotScale:extreme-wide'],
    rule: (fs) => (has(fs, 'shotScale:close-range') || has(fs, 'focus:shallow') ? 0.85 : has(fs, 'shotScale:extreme-wide') ? 0.1 : 0.25) },
  { name: 'animation', area: 'cinema', seed: 45, count: 89, title: 'Animation', hidden: 'Likes hand-drawn animation (95%); anything else 30%.', truth: ['medium:animation'], rule: (fs) => (has(fs, 'medium:animation') ? 0.95 : 0.3) },
  { name: 'veiled-light', area: 'cinema', seed: 48, count: 89, title: 'Light in the air', hidden: 'Likes frames with smoke, mist, dust or rain, or with shaped light such as beams, pools or glare (85%); otherwise 20%.', truth: ['atmospherics:veiled', 'lightPattern:shaped'],
    rule: (fs) => (has(fs, 'atmospherics:veiled') || has(fs, 'lightPattern:shaped') ? 0.85 : 0.2) },
  { name: 'two-strands', area: 'cinema', seed: 49, count: 89, title: 'Two strands', hidden: 'Two unrelated tastes: hard light in low-key frames (90%) and hand-drawn animation (90%); everything else 15%.', truth: ['lightQuality:hard', 'medium:animation'],
    rule: (fs) => ((has(fs, 'lightQuality:hard') && has(fs, 'key:low')) || has(fs, 'medium:animation') ? 0.9 : 0.15) },
  { name: 'stillness', area: 'cinema', seed: 50, count: 89, title: 'Stillness and space', hidden: 'Likes still frames with empty space or a single figure (85%); dislikes implied motion and dense frames (10%); otherwise 35%.', truth: ['motion:still', 'composition:negative-space', 'motion:implied', 'composition:dense'],
    rule: (fs) => (has(fs, 'motion:still') && (has(fs, 'composition:negative-space') || has(fs, 'figures:single')) ? 0.85 : has(fs, 'motion:implied') || has(fs, 'composition:dense') ? 0.1 : 0.35) },
  { name: 'momentum', area: 'cinema', seed: 52, count: 89, title: 'Momentum', hidden: 'Likes movement: implied motion, blur or diagonal compositions (80%); otherwise 20%.', truth: ['motion:implied', 'motion:blur', 'composition:diagonal'],
    rule: (fs) => (has(fs, 'motion:implied') || has(fs, 'motion:blur') || has(fs, 'composition:diagonal') ? 0.8 : 0.2) },
  { name: 'eclectic', area: 'cinema', seed: 46, count: 70, title: 'Eclectic', hidden: 'Likes about 55% of everything, unrelated to any characteristic.', truth: [], rule: () => 0.55 },
  { name: 'just-started', area: 'cinema', seed: 47, count: 11, title: 'Just started', hidden: 'Same taste as Chiaroscuro, but has judged only 11 stills.', truth: ['lightQuality:hard', 'key:low'], rule: hardLow },
  { name: 'restrained-reader', area: 'literature', synthetic: true, seed: 51, count: 50, title: 'Restrained reader', hidden: 'Likes restrained prose (90%); sparse figuration elsewhere 40%; otherwise 10%.', truth: ['register:restrained'],
    rule: (fs) => (has(fs, 'register:restrained') ? 0.9 : has(fs, 'figuration:sparse') ? 0.4 : 0.1) },
  { name: 'lyrical-reader', area: 'literature', synthetic: true, seed: 52, count: 50, title: 'Lyrical and experimental reader', hidden: 'Likes lyrical or experimental prose (90%); rich figuration elsewhere 35%; otherwise 8%.', truth: ['register:lyrical', 'register:experimental', 'register:restrained'],
    rule: (fs) => (has(fs, 'register:lyrical') || has(fs, 'register:experimental') ? 0.9 : has(fs, 'figuration:rich') ? 0.35 : 0.08) },
  { name: 'real-literature-today', area: 'literature', real: true, seed: 53, count: 5, title: 'Literature today (real library)', hidden: 'Has judged the five live passages; likes the three narrated in the first person in the past tense.', truth: [],
    rule: (fs) => (has(fs, 'person:first') && has(fs, 'tense:past') ? 1 : 0) },
];

// Builds everything needed to analyse and describe one person.
function build(pz) {
  const path = require('node:path'), ROOT = path.join(__dirname, '..', '..');
  const U = require('./simulated-users.js'), F = require(path.join(ROOT, 'js', 'taste', 'features.js'));
  const stillsDoc = require(path.join(ROOT, 'library', 'stills.json'));
  let lib, order, titleOf;
  if (pz.area === 'cinema') {
    lib = U.cinemaLibrary(); order = stillsDoc.stills.map((s) => s.id);
    titleOf = (id) => { const s = stillsDoc.stills.find((x) => x.id === id); return `${stillsDoc.films[s.film].title}: ${s.scene.replace(/\s*\([^)]*\)/g, '').split(/[,:;]/)[0].trim()}`; };
  } else if (pz.real) {
    const doc = require(path.join(ROOT, 'library', 'literature.json'));
    lib = F.literature(doc, require(path.join(ROOT, 'library', 'vocab', 'literature.json')));
    order = doc.passages.filter((p) => p.status === 'ready').map((p) => p.id);
    titleOf = (id) => doc.books[doc.passages.find((p) => p.id === id).book].title;
  } else {
    const syn = U.syntheticLiterature(60, 7); lib = syn.lib; order = Object.keys(lib.items).sort();
    titleOf = (id) => `${id} (${syn.passages.find((p) => p.id === id).family})`;
  }
  const { judgments, history } = U.realistic(lib, order, pz.rule, pz.seed, { count: pz.count, skipRate: pz.real ? 0 : 0.08, changeRate: pz.real ? 0 : 0.04 });
  return { library: lib, judgments, history, titleOf };
}

module.exports = { PEOPLE, build };
