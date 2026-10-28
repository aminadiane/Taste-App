// Minimal static server for previewing the site. Root is resolved from this file, not the cwd.
// The repository root is the Cultural Capital site; Pallas lives in works/pallas/ (http://127.0.0.1:PORT/works/pallas/).
// A folder URL without its trailing slash redirects (301) to the slash form, as vercel.json's trailingSlash does.
// vercel.json's redirects are honoured too, for exact sources only (307, or 308 when permanent).
// Also backs the library review page (works/pallas/library/review.html):
// POST /works/pallas/library/remove and POST /works/pallas/library/restore.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || process.argv[2] || 8765);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };

const APP = path.join(ROOT, 'works', 'pallas');      // the Pallas app
const LIB = path.join(APP, 'library');
const LIB_URL = '/works/pallas/library/';           // where the review page's POST endpoints live
const LIBRARY_JSON = path.join(LIB, 'stills.json');
const REMOVED = path.join(LIB, 'removed');           // removed stills land here, never deleted
const REMOVED_JSON = path.join(REMOVED, 'removed.json');

const REDIRECTS = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).redirects || []; } catch { return []; } })();

const send = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)); };
const readJSON = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
const inLib = (rel) => { const f = path.normalize(path.join(LIB, rel)); if (!f.startsWith(LIB + path.sep)) throw new Error('bad path ' + rel); return f; };
const move = (from, to) => { if (!fs.existsSync(from)) return; fs.mkdirSync(path.dirname(to), { recursive: true }); fs.renameSync(from, to); };

// Remove stills by id: move their display copy and original into library/removed/, keep their records and film entry there.
function remove(ids) {
  const lib = readJSON(LIBRARY_JSON, null);
  const bin = readJSON(REMOVED_JSON, { films: {}, stills: [] });
  const want = new Set(ids), done = [];
  fs.mkdirSync(REMOVED, { recursive: true });
  for (const s of lib.stills.filter((s) => want.has(s.id))) {
    move(inLib(s.file), path.join(REMOVED, s.file));
    move(inLib(s.original), path.join(REMOVED, s.original));
    bin.stills.push({ ...s, removedAt: new Date().toISOString() });
    if (lib.films[s.film]) bin.films[s.film] = lib.films[s.film];
    done.push(s.id);
  }
  lib.stills = lib.stills.filter((s) => !want.has(s.id));
  const used = new Set(lib.stills.map((s) => s.film));
  for (const k of Object.keys(lib.films)) if (!used.has(k)) delete lib.films[k];
  writeJSON(LIBRARY_JSON, lib); writeJSON(REMOVED_JSON, bin);
  return { removed: done, remaining: lib.stills.length };
}

// Put removed stills back, files and records both.
function restore(ids) {
  const lib = readJSON(LIBRARY_JSON, null);
  const bin = readJSON(REMOVED_JSON, { films: {}, stills: [] });
  const want = new Set(ids), done = [];
  for (const s of bin.stills.filter((s) => want.has(s.id))) {
    move(path.join(REMOVED, s.file), inLib(s.file));
    move(path.join(REMOVED, s.original), inLib(s.original));
    const { removedAt, ...rec } = s;
    if (!lib.stills.some((x) => x.id === rec.id)) lib.stills.push(rec);
    if (!lib.films[s.film] && bin.films[s.film]) lib.films[s.film] = bin.films[s.film];
    done.push(s.id);
  }
  bin.stills = bin.stills.filter((s) => !want.has(s.id));
  writeJSON(LIBRARY_JSON, lib); writeJSON(REMOVED_JSON, bin);
  return { restored: done, remaining: lib.stills.length };
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && (url.pathname === LIB_URL + 'remove' || url.pathname === LIB_URL + 'restore')) {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy(); });
    req.on('end', () => {
      try {
        const { ids } = JSON.parse(body || '{}');
        if (!Array.isArray(ids) || !ids.every((i) => typeof i === 'string')) return send(res, 400, { error: 'ids must be an array of still ids' });
        send(res, 200, url.pathname.endsWith('remove') ? remove(ids) : restore(ids));
      } catch (e) { send(res, 500, { error: String(e.message || e) }); }
    });
    return;
  }
  const redirect = REDIRECTS.find((r) => r.source === url.pathname);
  if (redirect) {
    res.writeHead(redirect.statusCode || (redirect.permanent === false ? 307 : 308), { location: redirect.destination });
    return res.end();
  }
  let p = decodeURIComponent(url.pathname);
  if (!p.endsWith('/')) {
    const dir = path.normalize(path.join(ROOT, p));
    if (dir.startsWith(ROOT) && fs.statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
      res.writeHead(301, { location: url.pathname + '/' + url.search });
      return res.end();
    }
  }
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => console.log('serving ' + ROOT + ' on http://127.0.0.1:' + PORT));
