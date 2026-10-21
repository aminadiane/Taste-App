// Pre-deploy check for the static site (there is no build step; Vercel serves the repository root as is).
// Usage: node tools/check-site.js
// 1. every file index.html references exists   2. every JavaScript file parses
// 3. the library validators pass               4. the JSON data files parse
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ROOT = path.join(__dirname, '..');
const errors = [];
const ok = (msg) => console.log('  ok     ' + msg);

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"#?]+)(?:\?[^"]*)?"/g)].map((m) => m[1]).filter((u) => !/^(https?:)?\/\//.test(u) && !u.startsWith('mailto:'));
for (const r of new Set(refs)) if (!fs.existsSync(path.join(ROOT, r))) errors.push(`index.html references missing file ${r}`);
ok(`${new Set(refs).size} files referenced by index.html`);

// Assets referenced from CSS and scripts by literal path.
const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
const cssRefs = [...css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)].map((m) => m[1]).filter((u) => !u.startsWith('data:') && !/^https?:/.test(u));
for (const r of new Set(cssRefs)) if (!fs.existsSync(path.join(ROOT, r))) errors.push(`styles.css references missing file ${r}`);
ok(`${new Set(cssRefs).size} files referenced by styles.css`);

const js = [];
const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) { if (!['node_modules', '.git', 'design_handoff_pallas', 'library'].includes(f.name)) walk(p); } else if (f.name.endsWith('.js')) js.push(p); } };
walk(ROOT);
for (const f of js) { try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { errors.push(`syntax error in ${path.relative(ROOT, f)}: ${String(e.stderr).split('\n').slice(0, 4).join(' ')}`); } }
ok(`${js.length} JavaScript files parse`);

for (const f of ['library/stills.json', 'library/cinema-metadata.json', 'library/literature.json', 'library/excerpts.json', 'library/vocab/cinema.json', 'library/vocab/literature.json']) {
  try { JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); } catch (e) { errors.push(`${f}: ${e.message}`); }
}
ok('library JSON parses');

// Still images referenced by the library exist.
const stills = JSON.parse(fs.readFileSync(path.join(ROOT, 'library', 'stills.json'), 'utf8')).stills;
for (const s of stills) if (!fs.existsSync(path.join(ROOT, 'library', s.file))) errors.push(`missing still image ${s.file}`);
ok(`${stills.length} still images present`);

for (const v of ['validate-literature.js', 'validate-cinema.js']) {
  try { execFileSync(process.execPath, [path.join(ROOT, 'tools', v)], { stdio: 'pipe' }); ok(v); } catch (e) { errors.push(`${v} failed: ${String(e.stdout)}`); }
}

if (errors.length) { console.log('FAILED'); errors.forEach((e) => console.log('  ERROR  ' + e)); process.exit(1); }
console.log('site check passed');
