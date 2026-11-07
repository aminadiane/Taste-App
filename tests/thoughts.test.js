// The Thoughts section (tools/build-thoughts.js, thoughts/essays/*.md):
// every article page shows its essay's text exactly, with no bold, and the built pages are up to date.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const T = require('../tools/build-thoughts.js');

const ROOT = path.join(__dirname, '..');
const essays = T.load();
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const norm = (s) => s.replace(/\s+/g, ' ').trim();

// The essay's text as written in its file: everything after the details block, without ** and without the pull quotes.
function sourceText(e) {
  const src = fs.readFileSync(path.join(T.ESSAYS, e.file), 'utf8').replace(/\r\n?/g, '\n');
  const body = src.replace(/^---\n[\s\S]*?\n---\n/, '');
  return body.split(/\n\s*\n/).map((c) => c.trim()).filter((c) => c && !/^-{3,}$/.test(c) && !c.startsWith('>')).map((c) => norm(c.replace(/\*\*/g, '')));
}
function pageParagraphs(html) {
  const body = html.slice(html.indexOf('<div class="essay__body">'), html.indexOf('<div class="essay__end">'));
  return [...body.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => decode(m[1]));
}

test('there is at least one essay, newest first', () => {
  assert.ok(essays.length >= 1);
  for (let i = 1; i < essays.length; i++) assert.ok(essays[i - 1].sort >= essays[i].sort);
});

for (const e of essays) {
  const file = path.join(ROOT, 'thoughts', e.slug, 'index.html');

  test(`${e.slug}: the article page shows the essay text exactly`, () => {
    const html = fs.readFileSync(file, 'utf8');
    assert.deepStrictEqual(pageParagraphs(html), sourceText(e));
  });

  test(`${e.slug}: no bold, no stray markdown`, () => {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /<(strong|b)[\s>]/);
    assert.ok(!html.includes('**'));
  });

  test(`${e.slug}: pull quotes and dividers come where the file puts them`, () => {
    const html = fs.readFileSync(file, 'utf8');
    const body = html.slice(html.indexOf('<div class="essay__body">'), html.indexOf('<div class="essay__end">'));
    const order = [...body.matchAll(/<(p|blockquote|hr)[ >]/g)].map((m) => m[1]);
    assert.deepStrictEqual(order, e.blocks.map((b) => ({ p: 'p', quote: 'blockquote', divider: 'hr' })[b.type]));
  });
}

test('the Bronx essay: title, byline and the three pull quotes before the right paragraphs', () => {
  const e = essays.find((x) => x.slug === 'what-the-bronx-can-teach-us-about-the-future-of-ai');
  assert.ok(e);
  assert.strictEqual(e.title, 'What the Bronx Can Teach Us About the Future of AI');
  assert.strictEqual(e.description, 'Why AI capital should flow through the people who already hold a community’s trust.');
  assert.deepStrictEqual([e.author, e.date, e.read, e.number, e.label], ['AMINA DIANÉ', 'OCT 2026', '7 MIN READ', 'N 002', 'ESSAY · CULTURE, AI & PHILANTHROPY']);
  const expected = [
    ['AI is not merely preparing people for the future of work; it is enabling them, at this very moment, to engineer entirely new systems and economic horizons from the ground up.', 'To this effect'],
    ['Cultural capital determines who is trusted, and trust determines what gets adopted.', 'Consider the following'],
    ['The people closest to a problem are usually best positioned to solve it.', 'In a neighborhood where economic capital is scarce'],
  ];
  const quotes = e.blocks.map((b, i) => [b, e.blocks[i + 1]]).filter(([b]) => b.type === 'quote');
  assert.strictEqual(quotes.length, 3);
  quotes.forEach(([q, next], i) => {
    assert.strictEqual(q.text, expected[i][0]);
    assert.ok(next.type === 'p' && next.text.startsWith(expected[i][1]), `quote ${i + 1} is followed by "${next.text.slice(0, 40)}"`);
  });
});

test('the home page lists every essay above Pallas, newest first', () => {
  const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const works = home.indexOf('id="works"');
  const at = essays.map((e) => home.indexOf(`id="${e.slug}"`));
  at.forEach((p) => assert.ok(p > 0 && p < works));
  for (let i = 1; i < at.length; i++) assert.ok(at[i - 1] < at[i]);
});

test('the built pages are up to date with the essay files (run: npm run build)', () => {
  assert.deepStrictEqual(T.build({ check: true }).outOfDate, []);
});

test('Thoughts sits between Works and About in every header and footer', () => {
  const pages = ['index.html', 'about/index.html', 'contact/index.html', 'thoughts/index.html', ...essays.map((e) => `thoughts/${e.slug}/index.html`)];
  for (const p of pages) {
    const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
    for (const nav of html.match(/<nav class="cc-nav[\s\S]*?<\/nav>/g)) {
      const links = [...nav.matchAll(/>(Works|Thoughts|About|Contact)</g)].map((m) => m[1]);
      assert.deepStrictEqual(links, ['Works', 'Thoughts', 'About', 'Contact'], p);
    }
    const footer = html.match(/<div class="cc-footer__links">[\s\S]*?<\/div>/);
    if (footer) assert.deepStrictEqual([...footer[0].matchAll(/>(Works|Thoughts|About|Contact)</g)].map((m) => m[1]), ['Thoughts', 'About', 'Contact'], p);
  }
});
