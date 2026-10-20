/* taste — home + cinema. No build step; open index.html. */
(() => {
  'use strict';

  const EASE = 'cubic-bezier(.2,.7,.1,1)';
  const STORE_PREFIX = 'taste:still:';
  const MAX_EDGE = 1600;
  const EMPTY_SLOTS = 6;            // when no library is available: blank slots to drop stills on
  const LIBRARY_URL = 'library/stills.json';
  const LIBRARY_BASE = LIBRARY_URL.slice(0, LIBRARY_URL.lastIndexOf('/') + 1);   // still paths are relative to the library file
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const $ = (id) => document.getElementById(id);
  const home = $('home');
  const cinema = $('cinema');
  const picture = $('picture');
  const noise = $('noise');
  const dot = $('dot');
  const osd = $('osd');
  const counter = $('counter');
  const caption = $('caption');
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- image slots: a library still, or a dropped one kept in localStorage ---------- */
  const store = {
    get(key) { try { return localStorage.getItem(STORE_PREFIX + key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(STORE_PREFIX + key, value); } catch { /* quota or private mode: shown, not kept */ } },
  };

  // Downscale to MAX_EDGE and re-encode so dropped stills fit the storage quota.
  function shrink(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * scale);
        c.height = Math.round(img.naturalHeight * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.86));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('not an image')); };
      img.src = url;
    });
  }

  function createSlot(id, placeholder, still) {
    const slot = document.createElement('div');
    slot.className = 'slot' + (still ? ' slot--library' : '');
    slot.setAttribute('aria-label', placeholder);
    slot.innerHTML =
      '<img class="slot__img" alt="" draggable="false" hidden>' +
      '<div class="slot__empty"><span class="slot__cap"></span></div>';
    slot.querySelector('.slot__cap').textContent = placeholder;
    const img = slot.querySelector('.slot__img');

    const show = (src, alt) => {
      img.src = src;
      img.alt = alt || '';
      img.hidden = false;
      slot.classList.add('is-filled');
      slot.setAttribute('aria-label', alt || placeholder.replace('drop ', ''));
    };
    if (still) show(LIBRARY_BASE + still.file, still.scene);   // the library frame, full frame letterboxed
    const saved = store.get(id);
    if (saved) show(saved);                            // a dropped still overrides it

    const accept = async (file) => {
      if (!file || !file.type.startsWith('image/')) return;
      try {
        const src = await shrink(file);
        show(src);
        store.set(id, src);
      } catch { /* not an image we can read */ }
    };

    // Clicking the glass does nothing; a still can still be dragged onto it.
    slot.addEventListener('dragenter', (e) => { e.preventDefault(); slot.classList.add('is-over'); });
    slot.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    slot.addEventListener('dragleave', (e) => { if (!slot.contains(e.relatedTarget)) slot.classList.remove('is-over'); });
    slot.addEventListener('drop', (e) => { e.preventDefault(); slot.classList.remove('is-over'); accept(e.dataTransfer.files[0]); });
    return slot;
  }

  /* ---------- the library ---------- */
  let library = { films: {}, stills: [] };
  let stills = [];        // the slot wrappers, in order
  let N = 0;

  function buildSlots() {
    picture.innerHTML = '';
    const entries = library.stills.length
      ? library.stills.map((s, i) => ({ id: s.id, placeholder: 'drop still ' + pad(i + 1), still: s }))
      : Array.from({ length: EMPTY_SLOTS }, (_, i) => ({ id: 'still-' + pad(i + 1), placeholder: 'drop still ' + pad(i + 1), still: null }));
    stills = entries.map((e) => {
      const wrap = document.createElement('div');
      wrap.className = 'tv__still';
      wrap.appendChild(createSlot(e.id, e.placeholder, e.still));
      picture.appendChild(wrap);
      return wrap;
    });
    N = stills.length;
  }

  // Credit line for the current still: film · year · director, plus attribution when the licence asks for it.
  function captionFor(i) {
    const s = library.stills[i];
    if (!s) return '';
    const f = library.films[s.film] || {};
    const parts = [f.title, f.year, f.director].filter(Boolean);
    const r = s.rights || {};
    if (/CC BY/i.test(r.license || '')) parts.push('still: ' + r.attribution + ', ' + r.license);
    else if (r.status === 'fair-use' || r.status === 'studio-release') parts.push('still: ' + r.attribution);   // credit the holder
    return parts.join(' · ');
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ---------- the deck: every still once, in a random order kept across reloads, before any comes back ---------- */
  const DECK_KEY = 'taste:deck';
  const deck = { order: [], pos: 0 };   // still ids in viewing order; pos is the one on screen
  let slotOf = new Map();               // still id -> slot index
  const saveDeck = () => { try { localStorage.setItem(DECK_KEY, JSON.stringify(deck)); } catch { /* private mode: order kept for this visit only */ } };

  // A fresh shuffle that never opens on the still that was just shown.
  function deal(ids, notFirst) {
    const o = shuffle(ids);
    if (o.length > 1 && o[0] === notFirst) { const j = 1 + Math.floor(Math.random() * (o.length - 1)); [o[0], o[j]] = [o[j], o[0]]; }
    return o;
  }

  // Pick up where the viewer left off; drop stills that were removed and slot new ones into the unseen part.
  function restoreDeck(ids) {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(DECK_KEY) || 'null'); } catch { /* unreadable: deal a new deck */ }
    const have = new Set(ids);
    if (saved && Array.isArray(saved.order) && Number.isInteger(saved.pos) && saved.pos >= 0) {
      const seen = saved.order.slice(0, saved.pos + 1).filter((id) => have.has(id));
      const rest = saved.order.slice(saved.pos + 1).filter((id) => have.has(id));
      const known = new Set(saved.order);
      for (const id of shuffle(ids.filter((x) => !known.has(x)))) rest.splice(Math.floor(Math.random() * (rest.length + 1)), 0, id);
      if (seen.length) { deck.order = seen.concat(rest); deck.pos = seen.length - 1; saveDeck(); return; }
      if (rest.length) { deck.order = rest; deck.pos = 0; saveDeck(); return; }
    }
    deck.order = deal(ids); deck.pos = 0; saveDeck();
  }
  const deckIdx = () => slotOf.get(deck.order[deck.pos]) ?? 0;

  // Next still: walk the deck; when every still has been shown, deal a new one.
  function nextIdx() {
    if (!deck.order.length) return N ? (state.idx + 1) % N : 0;   // blank drop slots: plain rotation
    if (deck.pos + 1 < deck.order.length) deck.pos++;
    else { deck.order = deal(deck.order, deck.order[deck.pos]); deck.pos = 0; }
    saveDeck();
    return deckIdx();
  }

  async function loadLibrary() {
    try {
      const res = await fetch(LIBRARY_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      if (Array.isArray(data.stills)) library = { films: data.films || {}, stills: data.stills };
    } catch { /* no library: keep the blank drop slots */ }
    buildSlots();
    if (library.stills.length) {
      slotOf = new Map(library.stills.map((s, i) => [s.id, i]));
      restoreDeck(library.stills.map((s) => s.id));
      state.idx = deckIdx();
    }
    render();
  }

  /* ---------- the set: like / dislike ---------- */
  const state = { idx: 0, phase: 'idle', osd: '' };
  let timers = [];
  let noiseOn = false;

  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  function picStyle(p) {
    switch (p) {
      case 'rollOut': return { transform: 'translateY(-70%) skewX(-4deg)', filter: 'brightness(1.3)', opacity: 1, transition: 'transform 230ms ease-in, filter 230ms ease-in' };
      case 'fuzz':    return { transform: 'none', filter: 'contrast(.85) brightness(1.1)', opacity: 1, transition: 'filter 80ms' };
      case 'rollIn':  return { transform: 'translateY(60%) skewX(6deg)', filter: 'brightness(1.6) blur(1px)', opacity: 1, transition: 'none' };
      case 'settle':  return { transform: 'none', filter: 'none', opacity: 1, transition: `transform 460ms ${EASE}, filter 520ms ${EASE}` };
      case 'off1':    return { transform: 'scale(1,.006)', filter: 'brightness(2.6)', opacity: 1, transition: 'transform 170ms cubic-bezier(.6,0,.9,.3), filter 170ms' };
      case 'off2':    return { transform: 'scale(0,.006)', filter: 'brightness(2.6)', opacity: 1, transition: 'transform 170ms cubic-bezier(.6,0,.9,.3)' };
      case 'black':   return { transform: 'scale(0,.006)', filter: 'brightness(2.6)', opacity: 1, transition: 'none' };
      case 'on':      return { transform: 'none', filter: 'none', opacity: 1, transition: `transform 520ms ${EASE}, filter 700ms ${EASE}` };
      default:        return { transform: 'none', filter: 'none', opacity: 1, transition: `transform 420ms ${EASE}, filter 420ms ${EASE}` };
    }
  }

  function drawNoise() {
    if (!noiseOn) return;
    const ctx = noise.getContext('2d'), w = noise.width, h = noise.height;
    const im = ctx.createImageData(w, h), d = im.data;
    const band = Math.random() * h, band2 = Math.random() * h;
    for (let y = 0; y < h; y++) {
      const boost = Math.abs(y - band) < 6 ? 70 : Math.abs(y - band2) < 3 ? -60 : 0;
      for (let x = 0; x < w; x++) {
        const v = Math.max(0, Math.min(255, Math.random() * 215 + boost)) | 0, i = (y * w + x) * 4;
        d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
      }
    }
    ctx.putImageData(im, 0, 0);
    requestAnimationFrame(drawNoise);
  }
  const startNoise = () => { if (!noiseOn) { noiseOn = true; drawNoise(); } };

  function render() {
    const { idx, phase, osd: osdText } = state;
    const pic = picStyle(phase);
    picture.style.transform = pic.transform;
    picture.style.filter = pic.filter;
    picture.style.opacity = pic.opacity;
    picture.style.transition = pic.transition;

    noise.style.opacity = phase === 'fuzz' ? .9 : 0;
    noise.style.transition = phase === 'settle' ? 'opacity 380ms ease-out' : 'opacity 90ms';

    dot.style.opacity = phase === 'off2' ? 1 : 0;
    dot.style.transition = phase === 'black' ? 'opacity 560ms ease-out' : 'opacity 90ms';

    osd.hidden = !osdText;
    osd.textContent = osdText;

    stills.forEach((el, i) => el.classList.toggle('is-current', i === idx));
    const shown = deck.order.length ? deck.pos : idx;   // position in this pass through the deck
    counter.textContent = N ? 'still ' + pad(shown + 1) + ' / ' + pad(N) : '';
    if (caption) caption.textContent = captionFor(idx);

    void picture.offsetWidth; // commit transition-less phases before the next one starts
  }

  const set = (patch) => { Object.assign(state, patch); render(); };
  const advance = (phase, extra) => set({ idx: nextIdx(), phase, ...(extra || {}) });

  function react(kind) {
    if (state.phase !== 'idle' || !N) return;
    const word = kind === 'like' ? 'liked' : 'disliked';
    if (reduceMotion.matches) {
      set({ osd: word, phase: 'hold' });
      later(900, () => advance('idle', { osd: '' }));
      return;
    }
    if (kind === 'like') {
      // "liked", then the picture rolls up and the next still rolls in from below. No static.
      set({ osd: word, phase: 'hold' });
      later(900, () => set({ phase: 'rollOut', osd: '' }));
      later(1130, () => advance('rollIn'));
      later(1170, () => set({ phase: 'settle' }));
      later(1670, () => set({ phase: 'idle' }));
    } else {
      // "disliked", then static, then the set switches off: a line, a dot, black, and the next still comes on.
      set({ osd: word, phase: 'hold' });
      later(900, () => { startNoise(); set({ phase: 'fuzz', osd: '' }); });
      later(1350, () => { noiseOn = false; set({ phase: 'off1' }); });
      later(1520, () => set({ phase: 'off2' }));
      later(1690, () => set({ phase: 'black' }));
      later(2300, () => advance('on'));
      later(2900, () => set({ phase: 'idle' }));
    }
  }

  // A quick click is shorter than the eye needs to see the key tip, so hold the pressed state for a moment.
  function press(button) {
    button.classList.add('is-pressed');
    later(180, () => button.classList.remove('is-pressed'));
  }
  $('like').addEventListener('click', () => { press($('like')); react('like'); });
  $('dislike').addEventListener('click', () => { press($('dislike')); react('dislike'); });

  /* ---------- routing: #cinema is the set, anything else is home ---------- */
  function route() {
    const isCinema = location.hash === '#cinema';
    home.hidden = isCinema;
    cinema.hidden = !isCinema;
    if (!isCinema) { clearTimers(); noiseOn = false; state.phase = 'idle'; state.osd = ''; }
    render();
    window.scrollTo(0, 0);
  }
  addEventListener('hashchange', route);
  buildSlots();   // blank slots until the library arrives
  route();
  loadLibrary();
})();
