// Run: node --test tests/*.test.js
// The mobile section of styles.css must never change desktop: every rule in it sits inside an @media or @supports
// block whose condition a desktop browser with a mouse does not match (or that yields the desktop value, as dvh does).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

test('every rule in the mobile section is gated by a media or feature query', () => {
  const start = css.indexOf('Mobile and touch (2026-10-21)');
  assert.ok(start > 0, 'mobile section marker missing');
  const body = css.slice(css.indexOf('*/', start) + 2).replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0, i = 0;
  const ungated = [];
  while (i < body.length) {
    const ch = body[i];
    if (ch === '{') { depth++; i++; continue; }
    if (ch === '}') { depth--; i++; continue; }
    if (depth === 0 && /\S/.test(ch)) {
      const end = body.indexOf('{', i), selector = body.slice(i, end).trim();
      if (!/^@(media|supports)\b/.test(selector)) ungated.push(selector);
      i = end; continue;
    }
    i++;
  }
  assert.deepEqual(ungated, []);
});

test('the gating queries are ones desktop browsers do not match', () => {
  const start = css.indexOf('Mobile and touch (2026-10-21)');
  const queries = [...css.slice(start).matchAll(/@media\s*([^{]+)\{/g)].map((m) => m[1].trim());
  const allowed = [/^\(pointer:coarse\)$/, /^\(hover:none\)$/, /^\(max-width:\d+px\)$/, /^\(max-height:\d+px\) and \(orientation:landscape\)$/];
  for (const q of queries) assert.ok(allowed.some((r) => r.test(q)), `unexpected query ${q}`);
});
