// Writes example interpretations for review: docs/examples/interpretations/README.md plus one JSON file per person.
// Usage: node tools/example-interpretations.js
// Each person is simulated (tests/fixtures/personas.js). The interpretation is produced by js/taste/interpret.js from
// the engine's findings alone; beside it, every claim is re-checked against the person's judgments.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const A = require(path.join(ROOT, 'js', 'taste', 'analyse.js'));
const I = require(path.join(ROOT, 'js', 'taste', 'interpret.js'));
const { PEOPLE, build } = require(path.join(ROOT, 'tests', 'fixtures', 'personas.js'));
const { verify } = require(path.join(ROOT, 'tests', 'fixtures', 'verify-interpretation.js'));
const K = require(path.join(ROOT, 'library', 'vocab', 'qualities.json'));
const OUT = path.join(ROOT, 'docs', 'examples', 'interpretations');
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.json')) fs.unlinkSync(path.join(OUT, f));

let md = `# Example interpretations\n\nProduced by \`node tools/example-interpretations.js\` with interpretation layer ${I.VERSION} (\`js/taste/interpret.js\`), engine ${A.VERSION} and craft knowledge \`library/vocab/qualities.json\` version ${K.version}. Every person is simulated, following the hidden rule shown with seeded randomness. They work through the library in screen order, skip some works and change their mind about a few.\n\nThe interpretation is written only from the engine's findings. The descriptions of what a technique does come from the craft-knowledge file. The words about the person come from their own counts and works. Under each interpretation, **Checked** shows the result of re-deriving every claim from the person's judgments.\n\nLiterature people marked *synthetic* use a 60-passage test corpus; the last one shows what the real library supports today.\n\n| Person | Area | Judged | Summary | Claims checked |\n|---|---|---|---|---|\n`;
const body = [];
for (const pz of PEOPLE) {
  const { library, judgments, history, titleOf } = build(pz);
  const result = A.analyse({ judgments, library, history });
  const it = I.interpret({ result, library, judgments, knowledge: K, titleOf });
  const v = verify(it, { library, judgments });
  fs.writeFileSync(path.join(OUT, `${pz.name}.json`), JSON.stringify({ simulatedPerson: { name: pz.name, area: pz.area, hiddenRule: pz.hidden, seed: pz.seed }, interpretation: it, verification: v }, null, 2) + '\n');
  md += `| [${pz.title}](#${pz.name}) | ${pz.area}${pz.synthetic ? ' (synthetic)' : ''} | ${result.counts.judged} | ${it.summary} | ${v.ok ? `all ${v.claims} hold` : `${v.failures.length} of ${v.claims} fail`} |\n`;
  let s = `\n## ${pz.title}\n<a id="${pz.name}"></a>\n\n*Hidden rule: ${pz.hidden}*\n\n**${it.summary}**\n\n`;
  for (const sct of it.sections) s += `**${sct.title}**${sct.strength ? ` · ${sct.strength}` : ''}\n\n${sct.text}\n\n`;
  s += `*Checked:* ${v.ok ? `${v.claims} claim(s), ${v.examples} cited work(s); every count matches the judgments and every cited work was liked or disliked as stated.` : v.failures.join('; ')}\n`;
  body.push(s);
}
md += body.join('\n');
fs.writeFileSync(path.join(OUT, 'README.md'), md);
console.log(`wrote ${PEOPLE.length} interpretations to docs/examples/interpretations/`);
