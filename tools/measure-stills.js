// Measures every still's pixels and writes the `measured` block of library/cinema-metadata.json.
// Usage: node tools/measure-stills.js [--raw]      (--raw prints the metric distribution for calibration)
//
// Deterministic and free: macOS `sips` converts each still to a 256-px bitmap, which is parsed here.
// Thresholds live in library/vocab/cinema.json, so changing a cut-point and re-running regenerates every value.
// Only `measured` is written; `observed` and `interpretation` blocks are never touched.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'works', 'pallas');   // the Pallas app (served at /works/pallas/)
const LIB = path.join(APP, 'library');
const OUT = path.join(LIB, 'cinema-metadata.json');
const CACHE = path.join(LIB, '.tmp', 'bmp');
const vocab = JSON.parse(fs.readFileSync(path.join(LIB, 'vocab', 'cinema.json'), 'utf8'));
const T = vocab.thresholds;
const stills = JSON.parse(fs.readFileSync(path.join(LIB, 'stills.json'), 'utf8')).stills;
const RAW = process.argv.includes('--raw');

function bitmap(file) {
  fs.mkdirSync(CACHE, { recursive: true });
  const out = path.join(CACHE, file.replace(/[\/]/g, '__') + '.bmp');
  if (!fs.existsSync(out)) execFileSync('sips', ['-s', 'format', 'bmp', '-Z', '256', path.join(LIB, file), '--out', out], { stdio: 'ignore' });
  const b = fs.readFileSync(out);
  const off = b.readUInt32LE(10), w = b.readInt32LE(18), h0 = b.readInt32LE(22), bpp = b.readUInt16LE(28);
  if (bpp !== 24 && bpp !== 32) throw new Error(`${file}: unsupported ${bpp}-bit bitmap`);
  const h = Math.abs(h0), Bpp = bpp / 8, stride = Math.ceil((w * Bpp) / 4) * 4;
  const px = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    const row = h0 > 0 ? h - 1 - y : y;   // positive height = bottom-up rows
    for (let x = 0; x < w; x++) {
      const i = off + row * stride + x * Bpp, j = (y * w + x) * 3;
      px[j] = b[i + 2] / 255; px[j + 1] = b[i + 1] / 255; px[j + 2] = b[i] / 255;
    }
  }
  return { w, h, px };
}

const L = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// Trim uniform near-black letterbox or pillarbox bars so they don't count as image content.
function trim({ w, h, px }) {
  const rowDark = (y) => { let s = 0; for (let x = 0; x < w; x++) { const j = (y * w + x) * 3; s += L(px[j], px[j + 1], px[j + 2]); } return s / w < 0.03; };
  const colDark = (x, y0, y1) => { let s = 0; for (let y = y0; y < y1; y++) { const j = (y * w + x) * 3; s += L(px[j], px[j + 1], px[j + 2]); } return s / (y1 - y0) < 0.03; };
  let y0 = 0, y1 = h, x0 = 0, x1 = w;
  while (y0 < h / 4 && rowDark(y0)) y0++;
  while (y1 > (3 * h) / 4 && rowDark(y1 - 1)) y1--;
  while (x0 < w / 4 && colDark(x0, y0, y1)) x0++;
  while (x1 > (3 * w) / 4 && colDark(x1 - 1, y0, y1)) x1--;
  const W = x1 - x0, H = y1 - y0, out = new Float32Array(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let c = 0; c < 3; c++) out[(y * W + x) * 3 + c] = px[((y + y0) * w + x + x0) * 3 + c];
  return { w: W, h: H, px: out, trimmed: { top: y0, bottom: h - y1, left: x0, right: w - x1 } };
}

function hsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let hdeg = 0;
  if (d > 1e-6) hdeg = mx === r ? 60 * (((g - b) / d) % 6) : mx === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  if (hdeg < 0) hdeg += 360;
  return [hdeg, mx ? d / mx : 0, mx];
}
const HUES = [['red', 345, 15], ['orange', 15, 40], ['yellow', 40, 70], ['green', 70, 160], ['teal', 160, 200], ['blue', 200, 255], ['purple', 255, 290], ['magenta', 290, 345]];
const hueFamily = (hdeg) => (HUES.find(([, a, b]) => (a > b ? hdeg >= a || hdeg < b : hdeg >= a && hdeg < b)) || HUES[0])[0];
const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
const r3 = (v) => Math.round(v * 1000) / 1000;

// Deterministic k-means palette: initial centres are pixels at fixed luminance quantiles.
function palette(px, n, k = 5) {
  const idx = [...Array(n).keys()].sort((a, b) => L(px[a * 3], px[a * 3 + 1], px[a * 3 + 2]) - L(px[b * 3], px[b * 3 + 1], px[b * 3 + 2]));
  let C = [...Array(k).keys()].map((i) => { const j = idx[Math.floor(((i + 0.5) / k) * n)] * 3; return [px[j], px[j + 1], px[j + 2]]; });
  const lab = new Uint8Array(n);
  for (let it = 0; it < 12; it++) {
    const S = C.map(() => [0, 0, 0, 0]);
    for (let p = 0; p < n; p++) {
      let best = 0, bd = Infinity;
      for (let c = 0; c < k; c++) { const d = (px[p * 3] - C[c][0]) ** 2 + (px[p * 3 + 1] - C[c][1]) ** 2 + (px[p * 3 + 2] - C[c][2]) ** 2; if (d < bd) { bd = d; best = c; } }
      lab[p] = best; S[best][0] += px[p * 3]; S[best][1] += px[p * 3 + 1]; S[best][2] += px[p * 3 + 2]; S[best][3]++;
    }
    C = C.map((c, i) => (S[i][3] ? [S[i][0] / S[i][3], S[i][1] / S[i][3], S[i][2] / S[i][3]] : c));
  }
  const share = C.map(() => 0); for (let p = 0; p < n; p++) share[lab[p]]++;
  return C.map((c, i) => ({ hex: hex(...c), share: r3(share[i] / n) })).filter((c) => c.share >= 0.02).sort((a, b) => b.share - a.share);
}

// Colour harmony from the hue families present (families in wheel order; distance counted round the wheel).
const WHEEL = HUES.map(([k]) => k);
function harmonyOf(shares) {
  const sig = Object.entries(shares).filter(([, v]) => v >= T.harmony.significant).sort((a, b) => b[1] - a[1]);
  if (!sig.length) return null;
  if (sig[0][1] >= T.harmony.singleAbove) return 'single-hue';
  const dist = (a, b) => { const d = Math.abs(WHEEL.indexOf(a) - WHEEL.indexOf(b)); return Math.min(d, WHEEL.length - d); };
  for (let i = 0; i < sig.length; i++) for (let j = i + 1; j < sig.length; j++) if (dist(sig[i][0], sig[j][0]) >= T.harmony.contrastDistance) return 'contrasting';
  return 'analogous';
}

function measure(file) {
  const img = trim(bitmap(file));
  const { w, h, px } = img, n = w * h;
  const lum = new Float32Array(n);
  let sumL = 0, satSum = 0, satN = 0, warm = 0, warmN = 0, colN = 0, hx = 0, hy = 0, hn = 0, vivid = 0;
  const hueCount = Object.fromEntries(HUES.map(([k]) => [k, 0]));
  for (let p = 0; p < n; p++) {
    const r = px[p * 3], g = px[p * 3 + 1], b = px[p * 3 + 2];
    const l = L(r, g, b); lum[p] = l; sumL += l;
    const [hd, s, v] = hsv(r, g, b);
    if (v > 0.08) { satSum += s; satN++; }
    if (l > 0.15 && l < 0.85) { warm += r - b; warmN++; }
    if (s > 0.2 && v > 0.15) { hueCount[hueFamily(hd)]++; colN++; }
    if (s > 0.55 && v > 0.3) vivid++;
    if (v > 0.12 && v * s > 0.04) { hx += Math.cos((hd * Math.PI) / 180); hy += Math.sin((hd * Math.PI) / 180); hn++; }
  }
  const sorted = Float32Array.from(lum).sort();
  const q = (f) => sorted[Math.min(n - 1, Math.floor(f * n))];
  const mean = sumL / n, median = q(0.5), p5 = q(0.05), p95 = q(0.95);
  const sat = satN ? satSum / satN : 0, temp = warmN ? warm / warmN : 0;
  // Circular standard deviation of hue: a toned print (sepia, cyanotype) has one tight hue.
  const hueR = hn ? Math.hypot(hx, hy) / hn : 1, hueSpread = hn ? (Math.sqrt(-2 * Math.log(Math.min(1, Math.max(1e-9, hueR)))) * 180) / Math.PI : 0;

  // Symmetry on a 64-px-wide luminance map.
  const sw = 64, sh = Math.max(1, Math.round((h / w) * 64));
  const small = new Float32Array(sw * sh);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    let s = 0, c = 0;
    for (let yy = Math.floor((y * h) / sh); yy < Math.floor(((y + 1) * h) / sh); yy++) for (let xx = Math.floor((x * w) / sw); xx < Math.floor(((x + 1) * w) / sw); xx++) { s += lum[yy * w + xx]; c++; }
    small[y * sw + x] = c ? s / c : 0;
  }
  // Baseline: the same pixels paired with a half-frame shift instead of a mirror, so 1 = mirrored, ~0 = no more alike than unrelated parts.
  let mirror = 0, base = 0;
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { mirror += Math.abs(small[y * sw + x] - small[y * sw + sw - 1 - x]); base += Math.abs(small[y * sw + x] - small[y * sw + ((x + sw / 2) % sw)]); }
  const symmetry = base ? 1 - mirror / base : 1;

  // Detail: mean Sobel gradient magnitude.
  let grad = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const a = (dx, dy) => lum[(y + dy) * w + x + dx];
    const gx = a(1, -1) + 2 * a(1, 0) + a(1, 1) - a(-1, -1) - 2 * a(-1, 0) - a(-1, 1);
    const gy = a(-1, 1) + 2 * a(0, 1) + a(1, 1) - a(-1, -1) - 2 * a(0, -1) - a(1, -1);
    grad += Math.hypot(gx, gy) / 4;
  }
  const detail = grad / ((w - 2) * (h - 2));

  const metrics = { meanLuminance: r3(mean), medianLuminance: r3(median), p5: r3(p5), p95: r3(p95), contrastRange: r3(p95 - p5), saturation: r3(sat), warmth: r3(temp), colouredShare: r3(colN / n), vividShare: r3(vivid / n), hueSpread: Math.round(hueSpread * 10) / 10, symmetry: r3(symmetry), detail: r3(detail) };
  const hueShares = Object.fromEntries(Object.entries(hueCount).map(([k, v]) => [k, colN ? r3(v / colN) : 0]));
  const toned = hueSpread < T.toned.hueSpreadBelow && sat < T.toned.saturationBelow && colN / n > 0.2;
  const monochrome = toned || sat < T.saturation.monochromeBelow || colN / n < 0.01;
  const values = {
    key: mean < T.key.lowBelow ? 'low' : mean > T.key.highAbove ? 'high' : 'mid',
    contrast: p95 - p5 < T.contrast.lowBelow ? 'low' : p95 - p5 > T.contrast.highAbove ? 'high' : 'medium',
    saturation: monochrome ? 'monochrome' : sat < T.saturation.mutedBelow ? 'muted' : sat > T.saturation.saturatedAbove ? 'saturated' : 'moderate',
    toned,
    temperature: monochrome && !toned ? 'neutral' : temp > T.temperature.warmAbove ? 'warm' : temp < T.temperature.coolBelow ? 'cool' : 'neutral',
    hue: monochrome ? [] : Object.entries(hueShares).filter(([, v]) => v >= T.hue.minShare).sort((a, b) => b[1] - a[1]).map(([k]) => k),
    harmony: monochrome ? null : harmonyOf(hueShares),
    accent: !monochrome && vivid / n >= T.accent.vividMin && vivid / n <= T.accent.vividMax && sat < T.accent.saturationBelow,
    symmetry: symmetry > T.symmetry.strongAbove ? 'strong' : symmetry < T.symmetry.weakBelow ? 'weak' : 'moderate',
    detail: detail < T.detail.smoothBelow ? 'smooth' : detail > T.detail.denseAbove ? 'dense' : 'moderate',
  };
  return { method: 'tools/measure-stills.js v3', analysedSize: [w, h], trimmed: img.trimmed, metrics, hueShares, palette: palette(px, n), values };
}

const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
const doc = existing || { version: 1, notes: '', vocabulary: 'library/vocab/cinema.json', stills: {} };
doc.notes = 'Per-still cinematography metadata, keyed by still id. measured: computed from the pixels by tools/measure-stills.js (regenerable). observed: what is visible in the image, in controlled vocabulary terms, recorded by a viewer of the image. interpretation: subjective readings, kept apart. Existing free-text notes in stills.json are supplementary and unchanged.';
doc.updated = new Date().toISOString().slice(0, 10);
const rows = [];
for (const s of stills) {
  const m = measure(s.file);
  const rec = doc.stills[s.id] || {};
  doc.stills[s.id] = { measured: m, observed: rec.observed || null, interpretation: rec.interpretation || null, ...(rec.review ? { review: rec.review } : {}) };
  rows.push([s.id, m.metrics, m.values]);
}
fs.writeFileSync(OUT, JSON.stringify(doc, null, 1) + '\n');
if (RAW) {
  const keys = Object.keys(rows[0][1]);
  for (const k of keys) { const v = rows.map((r) => r[1][k]).sort((a, b) => a - b); console.log(k.padEnd(16), 'min', v[0], 'p25', v[Math.floor(v.length * .25)], 'med', v[Math.floor(v.length / 2)], 'p75', v[Math.floor(v.length * .75)], 'max', v[v.length - 1]); }
}
const tally = {};
for (const [, , v] of rows) for (const [k, x] of Object.entries(v)) for (const y of [].concat(x)) { tally[k] = tally[k] || {}; tally[k][y] = (tally[k][y] || 0) + 1; }
console.log(`measured ${rows.length} stills`);
for (const [k, t] of Object.entries(tally)) console.log('  ' + k.padEnd(12), JSON.stringify(t));
