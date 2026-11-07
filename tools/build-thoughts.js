// Builds the Thoughts section from the essay files in thoughts/essays/.
//
//   node tools/build-thoughts.js           (or: npm run thoughts)   writes the pages
//   node tools/build-thoughts.js --check                         fails if a page is out of date (used by check-site.js)
//
// Each essay is one Markdown file, thoughts/essays/<slug>.md, and is published at /thoughts/<slug>/.
// It starts with a details block, then the text:
//
//   ---
//   title: What the Bronx Can Teach Us About the Future of AI
//   description: Why AI capital should flow through the people who already hold a community’s trust.
//   date: 2026-10                 (year-month: sorts the essays, newest first, and shows as OCT 2026)
//   number: N 002                 (the home page's top rule; works and essays share the numbering)
//   label: ESSAY · CULTURE & AI
//   author: AMINA DIANÉ
//   read: 7 MIN READ              (optional: worked out from the word count when left out)
//   ---
//
//   Paragraphs are separated by a blank line.
//
//   ---                           (a line of three dashes is a small centred divider)
//
//   > A line starting with > is a large cobalt pull quote, placed exactly there.
//
// The text is used exactly as written: no wording is changed. Bold markers (**) are removed, as is any HTML.
//
// What it writes:
//   thoughts/index.html           the Thoughts page, every essay newest first
//   thoughts/<slug>/index.html    one article page per essay
//   index.html                    the essay sections of the home page, between <!-- thoughts:start --> and
//                                 <!-- thoughts:end --> (above Pallas); everything else in index.html is left alone
// Article folders it wrote earlier for an essay that no longer exists are removed.
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const THOUGHTS = path.join(ROOT, 'thoughts');
const ESSAYS = path.join(THOUGHTS, 'essays');
const HOME = path.join(ROOT, 'index.html');
const MARK = '<meta name="generator" content="tools/build-thoughts.js">';
const START = '<!-- thoughts:start (written by tools/build-thoughts.js from thoughts/essays/; edit the essay files, not this) -->';
const END = '<!-- thoughts:end -->';
const WORDS_PER_MINUTE = 238;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const REQUIRED = ['title', 'description', 'date', 'number', 'label', 'author'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Plain text only: bold markers go, and so does any HTML tag.
const plain = (s) => s.replace(/\*\*/g, '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// ---------- Reading an essay file ----------

function parse(file) {
  const name = path.basename(file);
  const slug = name.replace(/\.md$/, '');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`${name}: the file name becomes the web address, so use lowercase letters, numbers and dashes only (like my-new-essay.md)`);
  const src = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error(`${name}: the file must start with the details block between two --- lines`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    if (!line.trim()) continue;
    const kv = line.match(/^([a-z]+):\s*(.*)$/i);
    if (!kv) throw new Error(`${name}: this details line needs the form "name: value": ${line}`);
    meta[kv[1].toLowerCase()] = kv[2].trim();
  }
  for (const k of REQUIRED) if (!meta[k]) throw new Error(`${name}: the details block is missing "${k}:"`);
  const d = meta.date.match(/^(\d{4})-(\d{2})$/);
  if (!d || +d[2] < 1 || +d[2] > 12) throw new Error(`${name}: date must be year-month, like 2026-10`);

  // Blocks: paragraphs, dividers (---) and pull quotes (>), separated by blank lines.
  const blocks = [];
  for (const chunk of src.slice(m[0].length).split(/\n\s*\n/)) {
    const t = chunk.trim();
    if (!t) continue;
    if (/^-{3,}$/.test(t)) blocks.push({ type: 'divider' });
    else if (t.startsWith('>')) blocks.push({ type: 'quote', text: plain(t.split('\n').map((l) => l.replace(/^>\s?/, '')).join(' ')) });
    else blocks.push({ type: 'p', text: plain(t) });
  }
  if (!blocks.some((b) => b.type === 'p')) throw new Error(`${name}: the essay has no text`);
  const words = blocks.filter((b) => b.type === 'p').reduce((n, b) => n + b.text.split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w)).length, 0);
  return {
    slug, file: name, blocks, words,
    title: meta.title, description: meta.description, number: meta.number, label: meta.label, author: meta.author,
    sort: meta.date, date: `${MONTHS[+d[2] - 1]} ${d[1]}`,
    read: meta.read || `${Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))} MIN READ`,
    url: `/thoughts/${slug}/`,
  };
}

function load() {
  const files = fs.existsSync(ESSAYS) ? fs.readdirSync(ESSAYS).filter((f) => f.endsWith('.md')).sort() : [];
  const essays = files.map((f) => parse(path.join(ESSAYS, f)));
  // Newest first; essays from the same month keep the order of their file names.
  return essays.sort((a, b) => (a.sort < b.sort ? 1 : a.sort > b.sort ? -1 : 0));
}

// ---------- The shared page frame (as on Home and About) ----------

function nav(cls) {
  return `<nav class="cc-nav ${cls}" aria-label="Site">
        <a class="cc-textlink" href="/#works">Works</a>
        <a class="cc-textlink is-active" href="/thoughts/" aria-current="page">Thoughts</a>
        <a class="cc-textlink" href="/about/">About</a>
        <a class="cc-textlink" href="/contact/">Contact</a>
      </nav>`;
}

function page({ title, description, body }) {
  return `<!DOCTYPE html>
<html lang="en" data-page="thoughts">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="color-scheme" content="light">
${MARK}
<link rel="stylesheet" href="/ds/styles.css">
<link rel="stylesheet" href="/site/site.css">
</head>
<body>
<div class="cc-page">

  <header class="cc-header">
    <div class="cc-header__row">
      <div></div>
      <a class="cc-header__home" href="/"><div class="cc-brand">cultural capital</div></a>
      ${nav('cc-nav--wide')}
    </div>
    ${nav('cc-nav--narrow').replace(/\n {6}/g, '\n    ')}
  </header>

${body}

  <footer class="cc-footer thoughts-footer">
    <div class="cc-footer__rule">
      <div class="cc-footer__mark">cultural capital</div>
      <div class="cc-footer__links">
        <a class="cc-textlink" href="/thoughts/">Thoughts</a>
        <a class="cc-textlink" href="/about/">About</a>
        <a class="cc-textlink" href="/contact/">Contact</a>
        <span class="cc-label cc-label--secondary">culturalcapital.world — © 2026</span>
      </div>
    </div>
  </footer>

</div>
<script src="/site/site.js"></script>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
`;
}

// ---------- The three renderings ----------

function thoughtsPage(essays) {
  const rows = essays.map((e) => `      <li class="thoughts-list__item">
        <a class="thoughts-row" href="${e.url}">
          <div class="thoughts-row__date"><span class="cc-label cc-label--secondary">${esc(e.date)}</span></div>
          <div class="thoughts-row__main">
            <h2 class="thoughts-row__title">${esc(e.title)}</h2>
            <p class="thoughts-row__text">${esc(e.description)}</p>
          </div>
        </a>
      </li>`).join('\n');
  return page({
    title: 'Thoughts — Cultural Capital',
    description: 'Essays and research from Cultural Capital.',
    body: `  <main class="thoughts-main">
    <div class="thoughts-hero">
      <h1 class="thoughts-hero__title">thoughts</h1>
      <div class="thoughts-hero__kicker"><span class="cc-label cc-label--inherit">ESSAYS · RESEARCH</span></div>
    </div>

    <ol class="thoughts-list">
${rows}
    </ol>
  </main>`,
  });
}

function articlePage(e) {
  const body = e.blocks.map((b) => {
    if (b.type === 'divider') return '        <hr class="essay__divider" aria-hidden="true">';
    if (b.type === 'quote') return `        <blockquote class="essay__pull">${esc(b.text)}</blockquote>`;
    return `        <p>${esc(b.text)}</p>`;
  }).join('\n');
  const byline = [e.author, e.date, e.read].map((x) => `<span class="cc-label cc-label--inherit">${esc(x)}</span>`).join('<span class="essay__dot" aria-hidden="true">·</span>');
  return page({
    title: `${e.title} — Cultural Capital`,
    description: e.description,
    body: `  <main class="essay-main">
    <div class="essay-top">
      <a class="cc-textlink" href="/thoughts/">All thoughts</a>
    </div>

    <article class="essay">
      <div class="essay__head">
        <div class="essay__kicker"><span class="cc-label cc-label--inherit">${esc(e.label)}</span></div>
        <h1 class="essay__title">${esc(e.title)}</h1>
        <p class="essay__dek">${esc(e.description)}</p>
        <div class="essay__byline">${byline}</div>
      </div>

      <div class="essay__body">
${body}
      </div>

      <div class="essay__end">
        <a class="cc-textlink" href="/thoughts/">All thoughts</a>
      </div>
    </article>
  </main>`,
  });
}

function homeSections(essays) {
  return essays.map((e) => `  <section class="home-essay" id="${e.slug}">
    <div class="home-works__rule">
      <span class="cc-label">${esc(e.number)}</span>
      <span class="cc-label cc-label--secondary">${esc(e.date)}</span>
    </div>

    <div class="home-essay__body">
      <a class="home-essay__title" href="${e.url}" aria-label="Read ${esc(e.title)}">${esc(e.title)}</a>

      <div class="home-essay__copy">
        <div class="home-works__kicker"><span class="cc-label cc-label--inherit">${esc(e.label)}</span></div>
        <p class="home-works__text">${esc(e.description)}</p>
        <div class="home-essay__links">
          <a class="cc-textlink cc-textlink--enter is-active" href="${e.url}">Read essay</a>
          <a class="cc-textlink cc-textlink--enter" href="/thoughts/">All thoughts</a>
        </div>
      </div>
    </div>
  </section>`).join('\n\n');
}

// ---------- Writing ----------

// Every file the build produces, as { file: contents }, given the current home page.
function outputs(essays, homeHtml) {
  const out = {};
  out[path.join(THOUGHTS, 'index.html')] = thoughtsPage(essays);
  for (const e of essays) out[path.join(THOUGHTS, e.slug, 'index.html')] = articlePage(e);
  const a = homeHtml.indexOf(START.slice(0, 20)), b = homeHtml.indexOf(END);
  if (a < 0 || b < a) throw new Error('index.html has lost its <!-- thoughts:start --> / <!-- thoughts:end --> markers; put them back just above the Pallas section (<section class="home-works" id="works">)');
  const inner = essays.length ? `\n${homeSections(essays)}\n\n  ` : '\n  ';
  out[HOME] = homeHtml.slice(0, a) + START + inner + homeHtml.slice(b);
  return out;
}

// Article folders written earlier by this script whose essay file is gone.
function stale(essays) {
  if (!fs.existsSync(THOUGHTS)) return [];
  const live = new Set(essays.map((e) => e.slug).concat('essays'));
  return fs.readdirSync(THOUGHTS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !live.has(d.name))
    .map((d) => path.join(THOUGHTS, d.name, 'index.html'))
    .filter((f) => fs.existsSync(f) && fs.readFileSync(f, 'utf8').includes(MARK));
}

function build({ check = false } = {}) {
  const essays = load();
  const out = outputs(essays, fs.readFileSync(HOME, 'utf8'));
  const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');
  const changed = Object.keys(out).filter((f) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== out[f]);
  const old = stale(essays);
  if (check) return { essays, outOfDate: changed.map(rel).concat(old.map(rel)) };
  for (const f of changed) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, out[f]); }
  for (const f of old) { fs.unlinkSync(f); if (!fs.readdirSync(path.dirname(f)).length) fs.rmdirSync(path.dirname(f)); }
  return { essays, written: changed.map(rel), removed: old.map(rel) };
}

module.exports = { parse, load, build, articlePage, thoughtsPage, homeSections, ESSAYS };

if (require.main === module) {
  try {
    if (process.argv.includes('--check')) {
      const r = build({ check: true });
      if (r.outOfDate.length) { console.log('Out of date (run: npm run thoughts): ' + r.outOfDate.join(', ')); process.exit(1); }
      console.log(`Thoughts pages are up to date (${r.essays.length} essay${r.essays.length === 1 ? '' : 's'}).`);
    } else {
      const r = build();
      for (const e of r.essays) console.log(`  ${e.date}  ${e.title}  →  ${e.url}  (${e.read.toLowerCase()})`);
      for (const f of r.written) console.log('  wrote    ' + f);
      for (const f of r.removed) console.log('  removed  ' + f);
      console.log(r.written.length || r.removed.length ? 'Done.' : 'Nothing to change: everything was already up to date.');
    }
  } catch (e) {
    console.error('Could not build the Thoughts pages: ' + e.message);
    process.exit(1);
  }
}
