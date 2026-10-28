// Pre-deploy check for the static site (there is no build step; Vercel serves the repository root as is).
// Site structure: / is the Cultural Capital About page (index.html), /works/ the works index (works/index.html),
// /works/pallas/ is Pallas (works/pallas/). The two root pages are optional: they are checked only if they exist.
// Usage: node tools/check-site.js [--tests]
// 1. every file the pages (and their stylesheets) reference exists   2. every JavaScript file parses
// 3. the library validators pass                                      4. the JSON data files parse
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'works', 'pallas');   // the Pallas app (served at /works/pallas/)
const errors = [];
const ok = (msg) => console.log('  ok     ' + msg);
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

// A reference is local unless it has a scheme or is protocol-relative; /_vercel/* is served by Vercel itself.
const external = (u) => /^[a-z][a-z0-9+.-]*:/i.test(u) || u.startsWith('//') || u.startsWith('/_vercel/');
// Root-absolute references (/x) resolve against the repository root, relative ones against the referring file's folder.
// A reference to a folder (ending in /) needs that folder's index.html.
const resolve = (from, u) => {
  const p = u.startsWith('/') ? path.join(ROOT, decodeURI(u)) : path.join(path.dirname(from), decodeURI(u));
  return u.endsWith('/') ? path.join(p, 'index.html') : p;
};
const strip = (u) => u.replace(/[?#].*$/, '');

// Folders .vercelignore keeps out of the deployment (anchored folder patterns like /docs/): a page must not reference them.
const ignored = fs.existsSync(path.join(ROOT, '.vercelignore')) ? fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith('/') && l.endsWith('/')) : [];
const notDeployed = (f) => ignored.find((d) => ('/' + rel(f) + '/').startsWith(d));
const exists = (from, r, f) => {
  if (!fs.existsSync(f)) { errors.push(`${rel(from)} references missing file ${r}`); return false; }
  const d = notDeployed(f);
  if (d) { errors.push(`${rel(from)} references ${r}, which .vercelignore keeps out of the deployment (${d})`); return false; }
  return true;
};

// Stylesheets: url(...) and @import, followed through linked and imported local stylesheets.
const seenCss = new Set();
function checkCss(file) {
  if (seenCss.has(file)) return 0;
  seenCss.add(file);
  const css = fs.readFileSync(file, 'utf8');
  const refs = [...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)|@import\s+['"]([^'"]+)['"]/g)].map((m) => strip(m[1] || m[2]).trim()).filter((u) => u && !u.startsWith('data:') && !external(u));
  let n = 0;
  for (const r of new Set(refs)) {
    const f = resolve(file, r);
    n++;
    if (exists(file, r, f) && f.endsWith('.css')) n += checkCss(f);
  }
  return n;
}

function checkPage(page) {
  const html = fs.readFileSync(page, 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"]*)"/g)].map((m) => strip(m[1])).filter((u) => u && !external(u));
  let css = 0;
  for (const r of new Set(refs)) {
    const f = resolve(page, r);
    if (exists(page, r, f) && f.endsWith('.css')) css += checkCss(f);
  }
  ok(`${new Set(refs).size} files referenced by ${rel(page)}, ${css} by its stylesheets`);
}

checkPage(path.join(APP, 'index.html'));
for (const p of [path.join(ROOT, 'index.html'), path.join(ROOT, 'works', 'index.html')]) if (fs.existsSync(p)) checkPage(p);

// Pallas's own stylesheet, in case it is ever no longer linked directly.
if (!seenCss.has(path.join(APP, 'styles.css'))) ok(`${checkCss(path.join(APP, 'styles.css'))} files referenced by works/pallas/styles.css`);

const js = [];
const SKIP = ['node_modules', '.git', 'design_handoff_pallas', 'library'];
const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) { if (!SKIP.includes(f.name) && !f.name.startsWith('Claude Design Handoffs')) walk(p); } else if (f.name.endsWith('.js')) js.push(p); } };
walk(ROOT);
for (const f of js) { try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { errors.push(`syntax error in ${rel(f)}: ${String(e.stderr).split('\n').slice(0, 4).join(' ')}`); } }
ok(`${js.length} JavaScript files parse`);

for (const f of ['stills.json', 'cinema-metadata.json', 'literature.json', 'excerpts.json', 'vocab/cinema.json', 'vocab/literature.json']) {
  try { JSON.parse(fs.readFileSync(path.join(APP, 'library', f), 'utf8')); } catch (e) { errors.push(`works/pallas/library/${f}: ${e.message}`); }
}
ok('library JSON parses');

// Still images referenced by the library exist.
const stills = JSON.parse(fs.readFileSync(path.join(APP, 'library', 'stills.json'), 'utf8')).stills;
for (const s of stills) {
  const f = path.join(APP, 'library', s.file);
  if (!fs.existsSync(f)) errors.push(`missing still image ${s.file}`);
  else if (notDeployed(f)) errors.push(`still image ${s.file} is kept out of the deployment by .vercelignore`);
}
ok(`${stills.length} still images present`);

for (const v of ['validate-literature.js', 'validate-cinema.js']) {
  try { execFileSync(process.execPath, [path.join(ROOT, 'tools', v)], { stdio: 'pipe' }); ok(v); } catch (e) { errors.push(`${v} failed: ${String(e.stdout)}`); }
}

// --tests also runs the automated test suite.
if (process.argv.includes('--tests')) {
  const files = fs.readdirSync(path.join(ROOT, 'tests')).filter((f) => f.endsWith('.test.js')).map((f) => path.join(ROOT, 'tests', f));
  const r = require('node:child_process').spawnSync(process.execPath, ['--test', ...files], { encoding: 'utf8' });
  const pass = (r.stdout.match(/^# pass (\d+)/m) || [])[1], fail = (r.stdout.match(/^# fail (\d+)/m) || [])[1];
  if (r.status !== 0) errors.push(`tests failed (${fail} failing):\n${r.stdout.split('\n').filter((l) => /^not ok/.test(l)).join('\n')}`);
  else ok(`${pass} tests pass`);
}

if (errors.length) { console.log('FAILED'); errors.forEach((e) => console.log('  ERROR  ' + e)); process.exit(1); }
console.log('site check passed');
