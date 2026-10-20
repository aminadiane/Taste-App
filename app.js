/* pallas — routing and the film screen. No build step; serve the folder and open index.html. */
window.Pallas = window.Pallas || {};
(() => {
  'use strict';

  const EASE = 'cubic-bezier(.2,.7,.1,1)';
  const LIBRARY_URL = 'library/stills.json';
  const LIBRARY_BASE = LIBRARY_URL.slice(0, LIBRARY_URL.lastIndexOf('/') + 1);

  const $ = (id) => document.getElementById(id);
  const home = $('home'), cinema = $('cinema'), lit = $('literature');
  const picture = $('picture'), stillsEl = $('stills'), noise = $('noise'), dot = $('dot'), osd = $('osd'), counter = $('counter');
  const pad = (n) => String(n).padStart(2, '0');
  const V = Pallas.votes, D = Pallas.drawer;

  /* ---------- the library ---------- */
  let library = { films: {}, stills: [] };
  let stillEls = [];   // one wrapper per still, library order
  let N = 0;

  function buildStills() {
    stillsEl.innerHTML = '';
    stillEls = library.stills.map((s) => {
      const wrap = document.createElement('div');
      wrap.className = 'tv__still';
      const img = document.createElement('img');
      img.className = 'tv__still-img';
      img.src = LIBRARY_BASE + s.file;
      img.alt = s.scene || '';
      img.draggable = false;
      const band = document.createElement('div');
      band.className = 'tv__band';
      wrap.append(img, band);
      stillsEl.appendChild(wrap);
      return wrap;
    });
    N = stillEls.length;
  }

  async function loadLibrary() {
    try {
      const res = await fetch(LIBRARY_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      if (Array.isArray(data.stills)) library = { films: data.films || {}, stills: data.stills };
    } catch { /* no library: the screen stays dark */ }
    buildStills();
    render();
  }

  const filmOf = (still) => library.films[still.film] || {};

  // DVD spine colours: a film's own `spine` if set, else derived from its first still's palette.
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16); const r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; return (.2126 * r + .7152 * g + .0722 * b) / 255; };
  function spineFor(slug) {
    const f = library.films[slug] || {};
    if (f.spine) return f.spine;
    const s = library.stills.find((x) => x.film === slug);
    const bg = (s && s.palette && s.palette[0]) || '#121212';
    return { bg, fg: lum(bg) > .5 ? '#141210' : '#efe9dc' };
  }

  /* ---------- the set: like / dislike ---------- */
  const state = { idx: 0, phase: 'idle', osd: '', prevIdx: null };
  let timers = [];
  let noiseOn = false;
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  // Picture-layer style outside the power-off: the like swipe and idle use this.
  function picStyle() {
    return { transform: 'none', filter: 'none', transition: `transform 420ms ${EASE}, filter 420ms ${EASE}` };
  }
  // Phases of the power-off, during which the sequence owns the picture layer and the dot.
  const POWER = new Set(['static', 'off', 'black', 'on']);
  let anims = [];                 // Web Animations handles of the running power-off
  const track = (a) => { anims.push(a); return a; };
  const cancelAnims = () => { anims.forEach((a) => { try { a.cancel(); } catch { /* already gone */ } }); anims = []; };

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
    const { idx, phase, osd: osdText, prevIdx } = state;
    if (!POWER.has(phase)) {
      const pic = picStyle();
      picture.style.transform = pic.transform;
      picture.style.filter = pic.filter;
      picture.style.transition = pic.transition;
    }

    noise.style.opacity = (phase === 'static' || phase === 'off') ? .95 : 0;
    noise.style.transition = 'opacity 90ms';

    osd.hidden = !osdText;
    osd.textContent = osdText;
    osd.classList.toggle('is-dislike', osdText === 'disliked');

    const swiping = phase === 'swipePrep' || phase === 'swipe';
    stillEls.forEach((el, i) => {
      const current = i === idx, outgoing = swiping && prevIdx === i;
      el.style.opacity = current || outgoing ? 1 : 0;
      el.style.pointerEvents = current ? 'auto' : 'none';
      el.style.transform = phase === 'swipePrep' ? (current ? 'translateY(107%)' : 'none') : phase === 'swipe' ? (current ? 'none' : 'translateY(-107%)') : 'none';
      el.style.transition = phase === 'swipe' ? 'transform 420ms cubic-bezier(.55,.05,.25,1)' : 'none';
      el.lastElementChild.style.opacity = swiping && current ? 1 : 0;
    });

    counter.textContent = N ? 'still ' + pad(idx + 1) + ' / ' + pad(N) : '';
    $('cq-like').textContent = `liked (${V.list('c', 'like').length})`;
    $('cq-dislike').textContent = `disliked (${V.list('c', 'dislike').length})`;

    void picture.offsetWidth;   // commit transition-less phases before the next one starts
  }

  const set = (patch) => { Object.assign(state, patch); render(); };

  function react(kind) {
    if (state.phase !== 'idle' || !N) return;
    V.set('c', library.stills[state.idx].id, kind);
    if (kind === 'like') {
      // channel change: the next still slides up from below, a black band between them, no static
      set({ osd: 'liked', phase: 'hold' });
      later(900, () => set({ prevIdx: state.idx, idx: (state.idx + 1) % N, phase: 'swipePrep', osd: '' }));
      later(940, () => set({ phase: 'swipe' }));
      later(1400, () => set({ phase: 'idle', prevIdx: null }));
    } else {
      powerOff();
    }
  }

  // Power off: "disliked", static, the picture collapses to a bright line then a dot, black, and the next still fades on.
  function powerOff() {
    const EASE_ON = 'cubic-bezier(.2,.7,.1,1)';
    let collapse = null;
    anims.forEach((a) => { if (a.playState === 'running') a.finish(); }); anims = [];   // a previous power-on still settling jumps to its end state; cancelled ones stay cancelled
    set({ osd: 'disliked', phase: 'hold' });
    later(900, () => { startNoise(); set({ phase: 'static', osd: '' }); });
    later(1450, () => {
      // one animation: first half to a full-width line, second half the line to a point
      collapse = track(picture.animate([
        { offset: 0, transform: 'scale(1,1)', filter: 'brightness(1)', easing: 'cubic-bezier(.6,0,.9,.3)' },
        { offset: .5, transform: 'scale(1,.006)', filter: 'brightness(2.6)', easing: 'cubic-bezier(.6,0,.9,.3)' },
        { offset: 1, transform: 'scale(0,.006)', filter: 'brightness(2.6)' },
      ], { duration: 340, fill: 'forwards' }));
      set({ phase: 'off' });
    });
    later(1620, () => { dot.style.transition = 'opacity 90ms'; dot.style.opacity = 1; });
    later(1790, () => {
      noiseOn = false;
      set({ phase: 'black' });
      picture.style.visibility = 'hidden';          // hide first, so cancelling cannot flash a full-size image
      if (collapse) { collapse.cancel(); anims = anims.filter((x) => x !== collapse); collapse = null; }
      picture.style.transition = 'none';
      picture.style.transform = 'none';
      picture.style.opacity = 0;
      picture.style.filter = 'brightness(1.8)';
      dot.style.transition = 'opacity 560ms ease-out';
      dot.style.opacity = 0;
    });
    later(2400, () => {
      set({ idx: (state.idx + 1) % N, phase: 'on' });   // advance while hidden
      // The end state is written inline first; the animations (no fill) play over it and leave nothing behind when they end.
      picture.style.opacity = 1;
      picture.style.filter = 'none';
      picture.style.visibility = 'visible';
      track(picture.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 520, easing: EASE_ON }));
      track(picture.animate([{ filter: 'brightness(1.8)' }, { filter: 'none' }], { duration: 700, easing: EASE_ON }));
    });
    later(3000, () => set({ phase: 'idle' }));
  }
  $('like').addEventListener('click', () => react('like'));
  $('dislike').addEventListener('click', () => react('dislike'));

  /* ---------- quick view: shelf of responded films, liked and disliked stills ---------- */
  const qv = { tab: 'like', sel: null };
  const h = D.h;
  const order = (ids) => { const pos = new Map(library.stills.map((s, i) => [s.id, i])); return ids.slice().sort((a, b) => pos.get(a) - pos.get(b)); };
  const stillById = (id) => library.stills.find((s) => s.id === id);

  function figure(id) {
    const s = stillById(id); if (!s) return null;
    const f = filmOf(s);
    const fig = h('figure', 'qv__still');
    const frame = h('div', 'qv__frame');
    const img = document.createElement('img'); img.src = LIBRARY_BASE + s.file; img.alt = s.scene || ''; img.draggable = false;
    frame.appendChild(img);
    fig.appendChild(frame);
    fig.appendChild(h('figcaption', 'qv__cap', `${f.title} — ${f.director}, ${f.year} — ${V.get('c', id) === 'like' ? 'liked' : 'disliked'}`));
    return fig;
  }

  function filmDrawer() {
    const wrap = h('div', 'qv');
    const voted = V.all('c');
    const liked = order(V.list('c', 'like')), disliked = order(V.list('c', 'dislike'));
    const responded = [...new Set(Object.keys(voted).map((id) => (stillById(id) || {}).film).filter(Boolean))]
      .sort((a, b) => D.sortKey(library.films[a].title).localeCompare(D.sortKey(library.films[b].title)));
    const tab = qv.tab;
    wrap.appendChild(D.tabs([
      { label: `shelf (${responded.length})`, active: tab === 'shelf', onClick: () => { qv.tab = 'shelf'; D.render(); } },
      { label: `liked (${liked.length})`, active: tab === 'like', onClick: () => { qv.tab = 'like'; D.render(); } },
      { label: `disliked (${disliked.length})`, active: tab === 'dislike', onClick: () => { qv.tab = 'dislike'; D.render(); } },
    ]));
    if (tab === 'shelf') {
      if (!responded.length) { wrap.appendChild(h('p', 'qv__empty', 'none yet')); return wrap; }
      const sel = responded.includes(qv.sel) ? qv.sel : responded[0];
      wrap.appendChild(D.shelf(responded.map((slug) => {
        const f = library.films[slug], c = spineFor(slug);
        const b = h('button', 'spine spine--dvd');
        b.type = 'button'; b.setAttribute('aria-label', f.title);
        b.style.background = c.bg;
        b.classList.toggle('is-selected', slug === sel);
        b.innerHTML = `<span class="spine__cap spine__cap--top"></span><span class="spine__cap spine__cap--bottom"></span>` +
          `<span class="spine__text"><span class="spine__title" style="color:${c.fg}">${f.title}</span><span class="spine__year" style="color:${c.fg}">${f.year}</span></span><span class="spine__gloss"></span>`;
        b.addEventListener('click', () => { qv.sel = slug; D.render(); });
        return b;
      })));
      order(Object.keys(voted)).filter((id) => stillById(id).film === sel).forEach((id) => wrap.appendChild(figure(id)));
      return wrap;
    }
    const items = tab === 'like' ? liked : disliked;
    if (!items.length) wrap.appendChild(h('p', 'qv__empty', 'none yet'));
    items.forEach((id) => { const fig = figure(id); if (fig) wrap.appendChild(fig); });
    return wrap;
  }
  const openQV = (tab) => { qv.tab = tab; D.show(filmDrawer); };
  $('cq-shelf').addEventListener('click', (e) => { e.preventDefault(); openQV('shelf'); });
  $('cq-like').addEventListener('click', (e) => { e.preventDefault(); openQV('like'); });
  $('cq-dislike').addEventListener('click', (e) => { e.preventDefault(); openQV('dislike'); });

  /* ---------- routing: '' home, #cinema film, #literature literature ---------- */
  function route() {
    const hash = location.hash;
    const isCinema = hash === '#cinema', isLit = hash === '#literature';
    home.hidden = isCinema || isLit;
    cinema.hidden = !isCinema;
    lit.hidden = !isLit;
    if (!isCinema) {
      clearTimers(); noiseOn = false; cancelAnims();
      state.phase = 'idle'; state.osd = ''; state.prevIdx = null;
      picture.style.visibility = ''; picture.style.opacity = ''; picture.style.filter = ''; picture.style.transform = ''; picture.style.transition = '';
      dot.style.transition = ''; dot.style.opacity = 0;
    }
    D.close();
    render();
    dispatchEvent(new CustomEvent('pallas:route', { detail: { isLit } }));
    window.scrollTo(0, 0);
  }
  addEventListener('hashchange', route);
  Pallas.film = { get library() { return library; } };
  route();
  loadLibrary();
})();
