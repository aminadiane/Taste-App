/* pallas — persistent progress. One versioned, append-only event log in localStorage['pallas.v1'].
   The current judgment of an item is its latest event that has not been undone. Nothing is ever deleted
   except by an explicit reset or delete. Cinema and literature keep independent cursors and sessions. */
window.Pallas = window.Pallas || {};
(() => {
  'use strict';
  const KEY = 'pallas.v1';
  const LEGACY = 'pallas.votes';
  const AREAS = ['cinema', 'literature'];
  const ALIAS = { c: 'cinema', l: 'literature', cinema: 'cinema', literature: 'literature' };
  const JUDGMENTS = new Set(['like', 'dislike', 'skip']);

  const now = () => new Date().toISOString();
  const uuid = () => (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  const area = (a) => { const v = ALIAS[a]; if (!v) throw new Error('unknown area ' + a); return v; };

  // Storage that never throws: private mode or a full quota degrades to memory for this visit.
  let persistent = true;
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { persistent = false; return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch { persistent = false; return false; } },
    remove(k) { try { localStorage.removeItem(k); } catch { /* nothing to remove */ } },
  };

  function blank() {
    return {
      schema: 1,
      owner: { anonId: uuid(), createdAt: now(), accountId: null },
      events: [],
      sessions: [],
      cursors: { cinema: null, literature: null },
      lastActive: { cinema: null, literature: null },
      profiles: [],
      encountered: {},
      reflections: [],
    };
  }

  // Bring a stored document up to the current shape without losing anything.
  function normalise(doc) {
    const b = blank();
    if (!doc || typeof doc !== 'object' || doc.schema !== 1) return null;
    return {
      ...b, ...doc,
      owner: { ...b.owner, ...(doc.owner || {}) },
      events: Array.isArray(doc.events) ? doc.events : [],
      sessions: Array.isArray(doc.sessions) ? doc.sessions : [],
      cursors: { ...b.cursors, ...(doc.cursors || {}) },
      lastActive: { ...b.lastActive, ...(doc.lastActive || {}) },
      profiles: Array.isArray(doc.profiles) ? doc.profiles : [],
      encountered: doc.encountered && typeof doc.encountered === 'object' ? doc.encountered : {},
      reflections: Array.isArray(doc.reflections) ? doc.reflections : [],
    };
  }

  function load() {
    const raw = ls.get(KEY);
    if (raw) {
      try { const d = normalise(JSON.parse(raw)); if (d) return { doc: d, fresh: false }; } catch { /* unreadable: keep it, start a new doc */ }
      ls.set(KEY + '.unreadable.' + Date.now(), raw);   // never silently discard a user's data
    }
    return { doc: blank(), fresh: true };
  }

  let { doc, fresh } = load();
  const save = () => ls.set(KEY, JSON.stringify(doc));

  // One-time migration of the earlier vote map. The legacy key is left in place, read-only.
  if (fresh) {
    try {
      const old = JSON.parse(ls.get(LEGACY) || 'null');
      if (old && typeof old === 'object') {
        const t = now();
        for (const [k, a] of [['c', 'cinema'], ['l', 'literature']]) {
          for (const [item, kind] of Object.entries(old[k] || {})) {
            if (kind === 'like' || kind === 'dislike') doc.events.push({ id: uuid(), t, area: a, item, work: null, kind, session: null, migrated: true });
          }
        }
      }
    } catch { /* malformed legacy data: nothing to migrate */ }
    save();
  }

  /* ---------- derived state ---------- */
  // Latest effective event per item in an area, or undefined.
  function current(a) {
    const undone = new Set(doc.events.filter((e) => e.kind === 'undo').map((e) => e.undoes));
    const map = new Map();
    for (const e of doc.events) {
      if (e.area !== a || !JUDGMENTS.has(e.kind) || undone.has(e.id)) continue;
      map.set(e.item, e);
    }
    return map;
  }

  function openSession(a) {
    let s = doc.sessions.filter((x) => x.area === a && !x.endedAt).pop();
    if (!s) { s = { id: uuid(), area: a, startedAt: now() }; doc.sessions.push(s); }
    return s;
  }

  function record(a, item, kind, work, extra) {
    a = area(a);
    const s = openSession(a);
    const e = { id: uuid(), t: now(), area: a, item, work: work || null, kind, session: s.id, ...(extra || {}) };
    doc.events.push(e);
    doc.lastActive[a] = e.t;
    save();
    return e;
  }

  /* ---------- the API ---------- */
  const store = {
    get persistent() { return persistent; },
    get anonId() { return doc.owner.anonId; },

    // Judgments
    judge(a, item, kind, work) {
      if (kind !== 'like' && kind !== 'dislike') throw new Error('judge: like or dislike');
      return record(a, item, kind, work);
    },
    skip(a, item, work) { return record(a, item, 'skip', work); },
    // Reverse the most recent effective judgment in an area. Returns the undone event, or null.
    undo(a) {
      a = area(a);
      const undone = new Set(doc.events.filter((e) => e.kind === 'undo').map((e) => e.undoes));
      const last = doc.events.filter((e) => e.area === a && JUDGMENTS.has(e.kind) && !undone.has(e.id)).pop();
      if (!last) return null;
      record(a, last.item, 'undo', last.work, { undoes: last.id });
      return last;
    },

    // Queries
    judgment(a, item) { const e = current(area(a)).get(item); return e ? e.kind : undefined; },
    list(a, kind) { return [...current(area(a)).values()].filter((e) => e.kind === kind).map((e) => e.item); },
    judgments(a) { const o = {}; for (const [k, e] of current(area(a))) o[k] = e.kind; return o; },
    // Evaluated = liked or disliked. A skip only hides an item for the rest of its session.
    isEvaluated(a, item) { const k = this.judgment(a, item); return k === 'like' || k === 'dislike'; },
    isHandled(a, item) {
      a = area(a);
      const e = current(a).get(item);
      if (!e) return false;
      if (e.kind !== 'skip') return true;
      const s = doc.sessions.filter((x) => x.area === a && !x.endedAt).pop();   // read only: never opens a session
      return !!s && e.session === s.id;
    },
    history(a) { a = area(a); return doc.events.filter((e) => e.area === a); },

    // Position within each area
    cursor(a) { return doc.cursors[area(a)]; },
    setCursor(a, item) { a = area(a); if (doc.cursors[a] === item) return; doc.cursors[a] = item; doc.lastActive[a] = now(); save(); },
    lastActive(a) { return doc.lastActive[area(a)]; },
    hasProgress(a) { return this.history(a).length > 0 || doc.cursors[area(a)] != null; },

    // Choose what to show: starting at index `from` (inclusive), the first item not yet handled; wraps around.
    // When every item is handled, returns `from` unchanged so the screen keeps working.
    nextOpen(a, ids, from) {
      const n = ids.length;
      if (!n) return 0;
      for (let k = 0; k < n; k++) { const i = (from + k) % n; if (!this.isHandled(a, ids[i])) return i; }
      return ((from % n) + n) % n;
    },
    // Where a returning visitor resumes: the saved cursor if it is still open, otherwise the next open item after it.
    resumeIndex(a, ids) {
      const c = this.cursor(a), at = c == null ? 0 : Math.max(0, ids.indexOf(c));
      return this.nextOpen(a, ids, at);
    },

    // Sessions: a new session ends the open one; history is untouched.
    newSession(a) {
      a = area(a);
      const open = doc.sessions.filter((x) => x.area === a && !x.endedAt).pop();
      if (open) open.endedAt = now();
      const s = { id: uuid(), area: a, startedAt: now() };
      doc.sessions.push(s);
      save();
      return s.id;
    },
    sessions(a) { a = area(a); return doc.sessions.filter((x) => x.area === a).map((x) => ({ ...x })); },

    // Reserved for Taste Profiles, taste development and the Journal.
    addProfile(p) { const s = { id: uuid(), createdAt: now(), basedOnEventCount: doc.events.length, ...p }; doc.profiles.push(s); save(); return s; },
    profiles() { return doc.profiles.map((p) => ({ ...p })); },
    encounter(techniqueId) { const e = doc.encountered[techniqueId]; if (e) e.count++; else doc.encountered[techniqueId] = { first: now(), count: 1 }; save(); },
    addReflection(r) { const x = { id: uuid(), t: now(), ...r }; doc.reflections.push(x); save(); return x; },

    // User control
    exportData() { return JSON.parse(JSON.stringify(doc)); },
    resetArea(a) {
      a = area(a);
      doc.events = doc.events.filter((e) => e.area !== a);
      doc.sessions = doc.sessions.filter((s) => s.area !== a);
      doc.cursors[a] = null; doc.lastActive[a] = null;
      save();
    },
    deleteAll() { ls.remove(KEY); ls.remove(LEGACY); doc = blank(); },   // nothing is written back until the next action
  };

  Pallas.store = store;

  // The interface the screens and the drawer already use ('c' / 'l' areas).
  Pallas.votes = {
    get: (a, id) => { const k = store.judgment(a, id); return k === 'skip' ? undefined : k; },
    set: (a, id, kind, work) => store.judge(a, id, kind, work),
    list: (a, kind) => store.list(a, kind),
    all: (a) => { const o = store.judgments(a); for (const k of Object.keys(o)) if (o[k] === 'skip') delete o[k]; return o; },
  };
})();
