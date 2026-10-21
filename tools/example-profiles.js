// Writes readable example Taste Profiles for review: docs/examples/taste-profiles/README.md plus one JSON file per person.
// Usage: node tools/example-profiles.js
// The people are simulated: each follows a hidden rule (shown in the report) with seeded randomness, works through the
// library in its own order, skips some works and changes their mind on a few. Deterministic.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const A = require(path.join(ROOT, 'js', 'taste', 'analyse.js'));
const P = require(path.join(ROOT, 'js', 'taste', 'profile.js'));
const F = require(path.join(ROOT, 'js', 'taste', 'features.js'));
const U = require(path.join(ROOT, 'tests', 'fixtures', 'simulated-users.js'));
const OUT = path.join(ROOT, 'docs', 'examples', 'taste-profiles');
const AT = '2026-10-21T00:00:00.000Z';

const stillsDoc = require(path.join(ROOT, 'library', 'stills.json'));
const cinema = U.cinemaLibrary();
const cinemaOrder = stillsDoc.stills.map((s) => s.id);
const stillTitle = (id) => { const s = stillsDoc.stills.find((x) => x.id === id), f = stillsDoc.films[s.film]; return `${f.title}: ${s.scene.replace(/\s*\([^)]*\)/g, '').split(/[,:;]/)[0].trim()}`; };
const synth = U.syntheticLiterature(60, 7), lit = synth.lib;
const litOrder = Object.keys(lit.items).sort();
const synthTitle = (id) => { const p = synth.passages.find((x) => x.id === id); return `${id} (${p.family})`; };
const realLitDoc = require(path.join(ROOT, 'library', 'literature.json'));
const realLit = F.literature(realLitDoc, require(path.join(ROOT, 'library', 'vocab', 'literature.json')));
const realTitle = (id) => { const p = realLitDoc.passages.find((x) => x.id === id); return realLitDoc.books[p.book].title; };
const has = (fs, k) => fs.has(k);

const PEOPLE = [
  { name: 'chiaroscuro', area: 'cinema', seed: 41, count: 75, title: 'Chiaroscuro', hidden: 'Likes hard light in low-key frames (90%); low key or hard light alone sometimes (50%); anything else rarely (12%).', truth: ['lightQuality:hard', 'key:low'],
    rule: (fs) => (has(fs, 'lightQuality:hard') && has(fs, 'key:low') ? 0.9 : has(fs, 'lightQuality:hard') || has(fs, 'key:low') ? 0.5 : 0.12) },
  { name: 'colour-and-design', area: 'cinema', seed: 42, count: 80, title: 'Colour and design', hidden: 'Likes saturated colour or symmetrical composition in colour images (85%); dislikes black and white (10%); otherwise 35%.', truth: ['saturation:saturated', 'composition:symmetrical', 'saturation:monochrome'],
    rule: (fs) => (has(fs, 'saturation:monochrome') ? 0.1 : has(fs, 'saturation:saturated') || has(fs, 'composition:symmetrical') ? 0.85 : 0.35) },
  { name: 'landscapes', area: 'cinema', seed: 43, count: 70, title: 'Landscapes', hidden: 'Likes distant exterior shots (85%); dislikes close shots (5%); otherwise 30%.', truth: ['shotScale:distant', 'setting:exterior', 'shotScale:close-range'],
    rule: (fs) => (has(fs, 'shotScale:distant') && has(fs, 'setting:exterior') ? 0.85 : has(fs, 'shotScale:close-range') ? 0.05 : 0.3) },
  { name: 'faces', area: 'cinema', seed: 44, count: 85, title: 'Faces', hidden: 'Likes close shots or shallow focus (85%); dislikes extreme wide shots (10%); otherwise 25%.', truth: ['shotScale:close-range', 'focus:shallow', 'shotScale:extreme-wide'],
    rule: (fs) => (has(fs, 'shotScale:close-range') || has(fs, 'focus:shallow') ? 0.85 : has(fs, 'shotScale:extreme-wide') ? 0.1 : 0.25) },
  { name: 'animation', area: 'cinema', seed: 45, count: 89, title: 'Animation', hidden: 'Likes hand-drawn animation (95%); anything else 30%.', truth: ['medium:animation'],
    rule: (fs) => (has(fs, 'medium:animation') ? 0.95 : 0.3) },
  { name: 'eclectic', area: 'cinema', seed: 46, count: 70, title: 'Eclectic', hidden: 'Likes about 55% of everything, unrelated to any characteristic.', truth: [],
    rule: () => 0.55 },
  { name: 'just-started', area: 'cinema', seed: 47, count: 11, title: 'Just started', hidden: 'Same taste as Chiaroscuro, but has judged only 11 stills.', truth: ['lightQuality:hard', 'key:low'],
    rule: (fs) => (has(fs, 'lightQuality:hard') && has(fs, 'key:low') ? 0.9 : has(fs, 'lightQuality:hard') || has(fs, 'key:low') ? 0.5 : 0.12) },
  { name: 'restrained-reader', area: 'literature', synthetic: true, seed: 51, count: 50, title: 'Restrained reader', hidden: 'Likes restrained prose (90%); sparse figuration elsewhere 40%; otherwise 10%.', truth: ['register:restrained'],
    rule: (fs) => (has(fs, 'register:restrained') ? 0.9 : has(fs, 'figuration:sparse') ? 0.4 : 0.1) },
  { name: 'lyrical-reader', area: 'literature', synthetic: true, seed: 52, count: 50, title: 'Lyrical and experimental reader', hidden: 'Likes lyrical or experimental prose (90%); rich figuration elsewhere 35%; otherwise 8%.', truth: ['register:lyrical', 'register:experimental'],
    rule: (fs) => (has(fs, 'register:lyrical') || has(fs, 'register:experimental') ? 0.9 : has(fs, 'figuration:rich') ? 0.35 : 0.08) },
  { name: 'real-literature-today', area: 'literature', real: true, seed: 53, count: 5, title: 'Literature today (real library)', hidden: 'Has judged the five passages that are live today; likes the three narrated in the first person in the past tense.', truth: [],
    rule: (fs) => (has(fs, 'person:first') && has(fs, 'tense:past') ? 1 : 0) },
];

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.json')) fs.unlinkSync(path.join(OUT, f));   // regenerate cleanly
const pc = (x) => Math.round(x * 100) + '%';
let md = `# Example Taste Profiles\n\nGenerated by \`node tools/example-profiles.js\` with engine ${A.VERSION} on ${AT.slice(0, 10)}. Every person here is simulated. Each follows a hidden rule, shown under "Hidden rule", with seeded randomness. They work through the library in the order the screens present it, skip some works and change their mind about a few. Everything else on this page is calculated by the engine from their judgments; nothing is written by hand or by a language model.\n\nThe **draft interpretation** is the engine's templated reading (\`profile.narrative()\`), offered as a proposal for the voice of a future results screen. Literature people marked *synthetic* use a 60-passage test corpus, because only five real passages are live. The last person shows what the real literature library can support today.\n\n| Person | Area | Judged | Evidence level | Hidden rule recovered |\n|---|---|---|---|---|\n`;
const sections = [];
for (const pz of PEOPLE) {
  const lib = pz.area === 'cinema' ? cinema : pz.real ? realLit : lit;
  const order = pz.area === 'cinema' ? cinemaOrder : pz.real ? realLitDoc.passages.filter((p) => p.status === 'ready').map((p) => p.id) : litOrder;
  const titleOf = pz.area === 'cinema' ? stillTitle : pz.real ? realTitle : synthTitle;
  const { judgments, history } = U.realistic(lib, order, pz.rule, pz.seed, { count: pz.count, skipRate: pz.real ? 0 : 0.08, changeRate: pz.real ? 0 : 0.04 });
  const result = A.analyse({ judgments, library: lib, history });
  const profile = P.build(result, { judgments, history, generatedAt: AT });
  const reading = P.narrative(profile, { titleOf, workOf: (id) => (lib.items[id] || {}).work });
  fs.writeFileSync(path.join(OUT, `${pz.name}.json`), JSON.stringify({ simulatedPerson: { name: pz.name, area: pz.area, hiddenRule: pz.hidden, seed: pz.seed, library: pz.real ? 'real literature library (5 live passages)' : pz.synthetic ? 'synthetic test corpus (60 passages)' : 'real cinema library (89 stills)' }, draftInterpretation: reading, profile }, null, 2) + '\n');

  const main = (l) => l.filter((f) => !f.explainedBy && f.strength !== 'tentative');
  const found = pz.truth.filter((t) => [...main(profile.preferred), ...main(profile.disliked)].some((f) => f.feature === t || f.aliases.includes(t)));
  const recovered = pz.truth.length ? `${found.length} of ${pz.truth.length}` : 'nothing to recover';
  md += `| [${pz.title}](#${pz.name}) | ${pz.area}${pz.synthetic ? ' (synthetic)' : ''} | ${profile.basedOn.judged} | ${profile.evidenceLevel} | ${recovered} |\n`;

  let s = `\n## ${pz.title}\n<a id="${pz.name}"></a>\n\n**Hidden rule:** ${pz.hidden}\n\n`;
  s += `**Judged:** ${profile.basedOn.judged} ${pz.area === 'cinema' ? 'stills' : 'passages'} from ${profile.basedOn.works} ${pz.area === 'cinema' ? 'films' : 'books'}, ${profile.basedOn.likes} liked. ${history.filter((e) => e.kind === 'skip').length} skipped, and ${result.consistency.changedJudgments.length} judgment(s) changed later. **Evidence level:** ${profile.evidenceLevel}.\n\n`;
  s += `**Signature:** ${profile.signature.summary}\n\n**Draft interpretation:**\n\n${reading.map((p) => '> ' + p).join('\n>\n')}\n\n`;
  const table = (list, head) => {
    const rows = list.filter((f) => f.strength !== 'tentative' || !f.explainedBy).slice(0, 8);
    if (!rows.length) return `*${head}: none.*\n\n`;
    let t = `**${head}**\n\n| Characteristic | Basis | Strength | Liked when present | Rest | q | Across films/books (p) | Examples |\n|---|---|---|---|---|---|---|---|\n`;
    const lb = (k) => (lib.terms[k] || {}).label || k;
    for (const f of rows) t += `| ${f.label}${f.explainedBy ? ` (accounted for by ${lb(f.explainedBy)})` : f.inseparableFrom ? ` (goes together with ${lb(f.inseparableFrom)})` : ''} | ${f.basis}${f.subjective ? ', subjective' : ''} | ${f.strength} | ${f.stats.likedWhenPresent}/${f.stats.exposed} (${pc(f.stats.rateWhenPresent)}) | ${pc(f.stats.rateWhenAbsent)} | ${f.stats.q} | ${f.stats.workLevelP ?? '—'} | ${[...new Map(f.evidence.supporting.map((id) => [(lib.items[id] || {}).work, id])).values()].slice(0, 2).map(titleOf).join('; ')} |\n`;
    return t + '\n';
  };
  s += table(profile.preferred, 'Liked characteristics') + table(profile.disliked, 'Disliked characteristics');
  const combos = profile.combinations.slice(0, 4);
  s += combos.length ? `**Combinations**\n\n${combos.map((c) => `- ${c.labels.join(' + ')}: ${c.stats.likedWhenPresent}/${c.stats.exposed} liked (${c.strength}; alone ${pc(c.stats.rateFirstAlone)} and ${pc(c.stats.rateSecondAlone)}). Examples: ${c.evidence.supporting.slice(0, 2).map(titleOf).join('; ')}.`).join('\n')}\n\n` : '*Combinations: none.*\n\n';
  s += `**Compared with the hidden rule:** ${pz.truth.length ? `${found.length ? 'found ' + found.map((t) => (lib.terms[t] || {}).label || t).join(', ') : 'none found'}${found.length < pz.truth.length ? '; not found: ' + pz.truth.filter((t) => !found.includes(t)).map((t) => (lib.terms[t] || {}).label || t).join(', ') : ''}.` : 'there is no rule to find, so any confident finding would be an error.'}\n\n`;
  s += `**Limitations stated in the profile:** ${profile.limitations.join(' ')}\n`;
  sections.push(s);
}
md += sections.join('\n');
md += `\n## How to read the strength labels\n\n- **Well supported:** survives correction for testing every characteristic, holds across at least two films or books, and holds when the stills of any one film are left out and when each film counts once.\n- **Emerging:** probably real, but still weak. It appears in the signature as "early signs".\n- **Tentative:** listed for completeness only, never used in the signature. It often arises by chance (see \`docs/engine-stress-report.md\`).\n`;
fs.writeFileSync(path.join(OUT, 'README.md'), md);
console.log(`wrote ${PEOPLE.length} example profiles to docs/examples/taste-profiles/`);
