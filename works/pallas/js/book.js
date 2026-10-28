/* pallas — the literature screen: a photographic paperback authored in a 660×520 space and scaled once.
   Dog-ear = like (right page), tear out = dislike (left page). Ported from the handoff prototype's logic class. */
window.Pallas = window.Pallas || {};
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const V = Pallas.votes, D = Pallas.drawer, store = Pallas.store, SH = Pallas.shelf, h = D.h;
  const EASE = 'cubic-bezier(.45,.05,.2,1)';
  const EASE2 = 'cubic-bezier(.2,.7,.1,1)';
  const LIBRARY_URL = 'library/literature.json';
  const EXCERPTS_URL = 'library/excerpts.json';   // handoff stand-ins, used until library passages are ready

  let ENTRIES = [], SPINES = [], NB = 0;
  const S = { bSide: 'left', bScrub: null, bFlapDrag: null, bOpen: false, bIdx: 0, bLeftIdx: 0, bRight: { kind: 'title', idx: 0 }, bLeftShown: false, bLeaf: null, bBusy: false,
    bCoverHover: false, bFlapHover: false, bFlapAnim: 'none', bFolded: false, bTearing: false, bTorn: false, bDragging: false, bPageHover: false, hintPhase: null };
  let ty = 0, sk = 0, scale = 1, tearRaf = 0, timers = [], active = false, leafFor = null;
  // Touch: a finger has no hover, and a tap must never register a preference by accident. The last pointer type decides
  // how the pages respond (mouse behaviour is unchanged): see pageDown and rightTap below.
  let lastPointer = 'mouse', armTimer = 0, tearTimer = 0, rendered = false, hintPlayed = false;
  /* Phones (viewport narrower than 640px, handoff update 2): the open book shows one page at a time. The book is
     unchanged; the stage is clipped and translated to frame the passage page (side `left`) or the notes page (side
     `right`). A scrub bar under the book, a tap on the page's outer edge, and the buttons move between pages. Swiping
     left tears the passage out and swiping right dog-ears the notes page (both approved 2026-10-27); a downward pull on
     the passage page also tears it, as approved on 2026-10-21. Taps on the pages do not vote on phones. */
  const EDGE_TAP = 24;   // book px at the page's outer edge where a tap moves to the other page
  const phone = () => innerWidth < 640;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let camKey = null, suppressClick = false;
  addEventListener('pointerdown', (e) => { lastPointer = e.pointerType || 'mouse'; }, true);
  const touchy = () => lastPointer === 'touch' || lastPointer === 'pen';
  const qv = { tab: 'like', sel: null };

  const el = {
    stage: $('stage'), inner: $('stage-inner'), book: $('book'), base: $('bk-base'), spread: $('bk-spread'),
    right: $('bk-right'), rclip: $('rp-clip'), rpage: $('R-page'), rshadow: $('r-shadow'),
    flap: $('flap'), flapPage: $('flap-page'), flapShade: $('flap-shade'), flapBack: $('flap-back'),
    left: $('bk-left'), leftPage: $('left-page'), ears: $('ears'), fore: $('bk-fore'),
    stub: $('bk-stub'), stubPage: $('stub-page'), torn: $('bk-torn'), piecePage: $('piece-page'), belowPage: $('below-page'), lshadow: $('l-shadow'),
    cover: $('bk-cover'), insideWrap: $('cover-back'), insidePage: $('inside-page'), leaf: $('leaf'),
    controls: $('lit-controls'), prev: $('bk-prev'), next: $('bk-next'), open: $('bk-open'), tear: $('bk-tear'), fold: $('bk-fold'),
    closeWrap: $('lit-close'), closeLink: $('bk-close'),
    phoneBox: $('lit-phone'), scrub: $('scrub'), scrubThumb: $('scrub-thumb'), phTear: $('ph-tear'), phFold: $('ph-fold'), phPrev: $('ph-prev'), phNext: $('ph-next'), hintL: $('hint-l'), hintR: $('hint-r'),
  };

  /* ---------- BookPage (330×520): title / excerpt / info / blank / inside ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function pageHTML(kind, side, entry, folio) {
    const tex = side === 'left' ? 'page-left.jpg' : 'page-right.jpg';
    let inner = '';
    if (kind === 'title') {
      inner = '<div class="pg__title"><div class="pg__title-name">Pallas</div><div class="pg__title-rule"></div><div class="pg__title-sub">Build your taste in literature</div></div><div class="pg__title-imprint">Cultural Capital</div>';
    } else if (kind === 'excerpt' && entry) {
      inner = `<div class="pg__ex"><div class="pg__num">${esc(entry.num)}</div><div class="pg__body"${entry.fs ? ` style="font-size:${entry.fs}px"` : ''}>${(entry.excerpt || []).map((t, i) => `<p style="text-indent:${i ? '1.3em' : '0'}">${esc(t)}</p>`).join('')}</div></div><div class="pg__folio pg__folio--ex">${esc(folio)}</div>`;
    } else if (kind === 'info' && entry) {
      inner = `<div class="pg__info"><div class="pg__info-title">${esc(entry.title)}</div><div class="pg__info-byline">${esc(entry.byline)}</div><div class="pg__info-rule"></div><div class="pg__info-sections"${entry.infoFs ? ` style="--fit:${entry.infoFs}"` : ''}>` +
        `<div class="pg__sec"><div class="pg__sec-h">the author</div><p>${esc(entry.author)}</p></div>` +
        `<div class="pg__sec"><div class="pg__sec-h">the work</div><p>${esc(entry.work)}</p></div>` +
        `<div class="pg__sec"><div class="pg__sec-h">techniques</div>${(entry.techniques || []).map((t) => `<p class="pg__tech"><em>${esc(t.name)}.</em> ${esc(t.text)}</p>`).join('')}</div>` +
        `</div></div><div class="pg__folio pg__folio--info">${esc(folio)}</div>`;
    }
    return `<div class="pg" lang="en"><div class="pg__tex" style="background-image:url(assets/${tex})"></div><div class="pg__ink">${inner}</div></div>`;
  }
  const pageKeys = new WeakMap();
  function mount(container, kind, side, entry, folio) {
    const key = [kind, side, entry ? entry.id : '', folio].join('|');
    if (pageKeys.get(container) === key) return;
    pageKeys.set(container, key);
    container.innerHTML = pageHTML(kind, side, entry, folio);
  }
  const page = (kind, idx) => ({ kind, entry: ENTRIES[idx], folio: kind === 'excerpt' ? 2 * idx + 2 : kind === 'info' ? 2 * idx + 3 : '' });

  /* ---------- votes by entry id, listed in entry order ---------- */
  const idxOf = (id) => ENTRIES.findIndex((e) => e.id === id);
  const listL = (kind) => V.list('l', kind).map(idxOf).filter((i) => i >= 0).sort((a, b) => a - b);

  /* ---------- small async helpers ---------- */
  const set = (patch) => {
    Object.assign(S, patch);
    if ('bIdx' in patch && S.bOpen && NB) store.setCursor('literature', ENTRIES[S.bIdx].id);   // closing resets bIdx; that is not a move
    render();
    return Promise.resolve();
  };
  const entryIds = () => ENTRIES.map((e) => e.id);
  const wait = (ms) => new Promise((res) => timers.push(setTimeout(res, ms)));
  const frame = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
  const canAct = () => S.bOpen && S.bLeftShown && !S.bBusy;
  const workOf = (i) => ENTRIES[i].book || ENTRIES[i].id;   // the book a passage comes from (stand-ins: the passage itself)
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- the turning leaf: two hinged segments over the right page ---------- */
  function buildLeaf(front, back) {
    el.leaf.innerHTML =
      '<div class="leaf__seg1">' +
        '<div class="leaf__face leaf__face--front"><div class="leaf__pg" id="lf1"></div><div class="leaf__shade" id="f1"></div></div>' +
        '<div class="leaf__face leaf__face--back"><div class="leaf__pg leaf__pg--b1" id="lb1"></div><div class="leaf__shade leaf__shade--back" id="b1"></div></div>' +
      '</div>' +
      '<div class="leaf__seg2" id="seg2">' +
        '<div class="leaf__face leaf__face--front leaf__face--r"><div class="leaf__pg leaf__pg--f2" id="lf2"></div><div class="leaf__shade" id="f2"></div></div>' +
        '<div class="leaf__face leaf__face--back leaf__face--l"><div class="leaf__pg" id="lb2"></div><div class="leaf__shade leaf__shade--back" id="b2"></div></div>' +
      '</div>';
    mount($('lf1'), front.kind, 'right', front.entry, front.folio);
    mount($('lf2'), front.kind, 'right', front.entry, front.folio);
    mount($('lb1'), back.kind, 'left', back.entry, back.folio);
    mount($('lb2'), back.kind, 'left', back.entry, back.folio);
    el.leaf.style.transform = 'translateZ(2px) rotateY(0deg)';
    el.leaf.hidden = false;
  }
  async function animateLeaf(back) {
    await frame();
    if (el.leaf.hidden) return;
    const o = { duration: 1100, fill: 'forwards', direction: back ? 'reverse' : 'normal' };
    const overlays = [
      el.rshadow.animate([{ opacity: 0 }, { opacity: 1, offset: .25 }, { opacity: 0, offset: .6 }, { opacity: 0 }], o),
      S.bLeftShown ? el.lshadow.animate([{ opacity: 0 }, { opacity: 0, offset: .5 }, { opacity: .85, offset: .86 }, { opacity: 0 }], o) : null,
    ].filter(Boolean);
    const anims = [
      el.leaf.animate([{ transform: 'translateZ(2px) rotateY(0deg)' }, { transform: 'translateZ(2px) rotateY(-180deg)' }], { ...o, easing: 'cubic-bezier(.42,.06,.22,1)' }),
      $('seg2').animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-16deg)', offset: .2 }, { transform: 'rotateY(20deg)', offset: .62 }, { transform: 'rotateY(0deg)' }], { ...o, easing: 'ease-in-out' }),
      ...['f1', 'f2'].map((k) => $(k).animate([{ opacity: 0 }, { opacity: .14, offset: .45 }, { opacity: .3 }], o)),
      ...['b1', 'b2'].map((k) => $(k).animate([{ opacity: .3 }, { opacity: .1, offset: .55 }, { opacity: 0 }], o)),
      ...overlays,
    ];
    await Promise.all(anims.map((a) => a.finished.catch(() => {})));
    overlays.forEach((a) => a.cancel());
  }

  /* ---------- the tear line: --ty (how far down, px) and --sk (skew, deg) on the book group ---------- */
  function setTear(y, k) {
    ty = y; sk = k;
    el.book.style.setProperty('--ty', y.toFixed(2) + 'px');
    el.book.style.setProperty('--sk', k.toFixed(3) + 'deg');
  }
  function tearTo(y, k, ms, easeFn) {
    cancelAnimationFrame(tearRaf);
    const t0 = performance.now(), fy = ty, fs = sk;
    const ease = easeFn || ((t) => 1 - Math.pow(1 - t, 3));
    return new Promise((res) => {
      const step = (now) => {
        const t = Math.min(1, (now - t0) / ms), e = ease(t);
        setTear(fy + (y - fy) * e, fs + (k - fs) * e);
        if (t < 1) tearRaf = requestAnimationFrame(step); else res();
      };
      tearRaf = requestAnimationFrame(step);
    });
  }

  /* ---------- actions ---------- */
  async function openBook() {
    if (S.bOpen || S.bBusy) return;
    const start = store.resumeIndex('literature', entryIds());   // the next passage not yet evaluated, from where the reader left off
    await set({ bBusy: true, bOpen: true, bSide: 'left', bCoverHover: false, bLeaf: { front: page('title', 0), back: page('excerpt', start) }, bRight: { kind: 'info', idx: start } });
    await wait(380);
    await animateLeaf();
    await set({ bLeaf: null, bLeftShown: true, bLeftIdx: start, bIdx: start, bBusy: false });
    if (phone()) playSwipeHint();
  }
  async function closeBook() {
    if (!S.bOpen || S.bBusy) return;
    const cur = S.bIdx;
    await set({ bBusy: true, bSide: 'left', bFlapHover: false, bFolded: false, bFlapAnim: 'none', bFlapDrag: null, bPageHover: false, bLeaf: { front: page('title', 0), back: page('excerpt', cur) }, bLeftShown: false });
    await animateLeaf(true);
    await set({ bLeaf: null, bRight: { kind: 'title', idx: 0 } });
    await wait(120);
    await set({ bOpen: false });
    await wait(1200);
    setTear(0, 0);
    await set({ bBusy: false, bIdx: 0, bLeftIdx: 0, bTearing: false, bTorn: false });
  }
  // After a vote the book turns to the next passage not yet evaluated; Next / Previous browse in order.
  async function turn(afterVote) {
    const cur = S.bIdx, next = afterVote ? store.nextOpen('literature', entryIds(), (cur + 1) % NB) : (cur + 1) % NB;
    await set({ bSide: 'left', bLeaf: { front: page('info', cur), back: page('excerpt', next) }, bRight: { kind: 'info', idx: next } });
    await animateLeaf();
    setTear(0, 0);
    await set({ bLeaf: null, bLeftIdx: next, bIdx: next, bFolded: false, bFlapHover: false, bFlapAnim: 'none', bFlapDrag: null, bTearing: false, bTorn: false, bPageHover: false });
  }
  async function browse(dir) {
    if (!canAct()) return;
    const cur = S.bIdx, next = (cur + dir + NB) % NB;
    await set({ bBusy: true, bFolded: false, bFlapHover: false, bFlapAnim: 'none', bFlapDrag: null, bPageHover: false });
    if (dir > 0) await turn();
    else {
      await set({ bSide: 'left', bLeaf: { front: page('info', next), back: page('excerpt', cur) }, bLeftIdx: next, bRight: { kind: 'info', idx: next } });
      await animateLeaf(true);
      await set({ bLeaf: null, bIdx: next });
    }
    set({ bBusy: false });
  }
  async function dogEar() {
    if (!canAct()) return;
    V.set('l', ENTRIES[S.bIdx].id, 'like', workOf(S.bIdx));
    SH.respond('l', workOf(S.bIdx), 'like');
    await set({ bBusy: true, bFlapHover: false, bFlapDrag: null, bFlapAnim: 'fold', bFolded: true });
    await wait(1250);
    await turn(true);
    set({ bBusy: false });
  }
  async function tearOut() {
    if (!canAct()) return;
    V.set('l', ENTRIES[S.bIdx].id, 'dislike', workOf(S.bIdx));
    SH.respond('l', workOf(S.bIdx), 'dislike');
    await set({ bBusy: true, bFlapHover: false, bTearing: true, bDragging: false });
    if (ty < 200) await tearTo(250, 2.2, 420);
    await wait(140);
    await tearTo(520, 3.4, 520, (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const T = (x, y, ry, rz) => `translateZ(1px) translate(${x}px,${y}px) rotateY(${ry}deg) rotateZ(${rz}deg)`;
    const a = el.torn.animate([
      { transform: T(0, 0, 0, 0), opacity: 1, offset: 0, easing: 'cubic-bezier(.3,.6,.4,1)' },
      { transform: T(-6, -3, 14, -3), opacity: 1, offset: .25, easing: 'cubic-bezier(.55,0,.85,.45)' },
      { transform: T(-640, 380, 36, -38), opacity: 0, offset: 1 },
    ], { duration: 1150, fill: 'forwards' });
    await a.finished.catch(() => {});
    await set({ bTorn: true, bDragging: false });
    a.cancel();
    await wait(380);
    await turn(true);
    set({ bBusy: false });
  }
  // The buttons on phones first slide to the page being acted on, so the fold or the tear is seen.
  function tearFromButton() {
    if (!canAct()) return;
    if (phone() && S.bSide !== 'left') { set({ bSide: 'left' }); setTimeout(tearOut, 540); } else tearOut();
  }
  function foldFromButton() {
    if (!canAct()) return;
    if (phone() && S.bSide !== 'right') { set({ bSide: 'right' }); setTimeout(dogEar, 540); } else dogEar();
  }
  /* ---------- skip and undo: data handling only. Controls wait for approved designs; connect them to
     Pallas.literature.skip() and .undo(). Skip turns the page like Next, recording that the passage was passed over
     (it returns in a later session). Undo reverses the latest dog-ear, tear-out or skip and opens that passage again;
     no undo transition is designed yet, so it cuts straight to the spread. Both are refused while a sequence runs. */
  async function skipPassage() {
    if (!canAct() || !NB) return null;
    const e = store.skip('literature', ENTRIES[S.bIdx].id, workOf(S.bIdx));
    await set({ bBusy: true, bFolded: false, bFlapHover: false, bFlapAnim: 'none', bPageHover: false });
    await turn(true);
    set({ bBusy: false });
    return e;
  }
  async function undoLast() {
    if ((S.bOpen && !canAct()) || !NB) return null;
    const e = store.undo('literature');
    if (!e) return null;
    const i = idxOf(e.item);
    if (S.bOpen && i >= 0) { setTear(0, 0); await set({ bSide: 'left', bLeaf: null, bIdx: i, bLeftIdx: i, bRight: { kind: 'info', idx: i }, bFolded: false, bTorn: false, bTearing: false }); }
    else render();
    if (D.isOpen() && active) D.render();
    SH.render();
    return e;
  }
  Pallas.literature = { skip: skipPassage, undo: undoLast, canUndo: () => !!store.lastUndoable('literature'), get busy() { return S.bOpen && !canAct(); } };

  /* ---------- phones: swipes on either page, the scrub bar, the edge tap ---------- */
  function phoneSwipe(e) {
    if (!canAct()) return;
    const sx = e.clientX, sy = e.clientY, sc = scale || 1;
    let dx = 0, dy = 0, axis = null, slideAt = 0;
    const startSide = S.bSide;
    const move = (ev) => {
      dx = (ev.clientX - sx) / sc; dy = (ev.clientY - sy) / sc;
      if (!axis && Math.hypot(dx, dy) > 10) {   // the axis locks after 10px
        axis = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'x' : 'r') : (dy > 0 && startSide === 'left' ? 'y' : 'none');
        if (axis === 'x') set({ bDragging: true, bSide: 'left' });                       // tear out: from the notes page, slide to the passage first
        if (axis === 'y') set({ bDragging: true });                                       // the downward pull (approved 2026-10-21)
        if (axis === 'r') { slideAt = startSide === 'right' ? -1e9 : performance.now(); set({ bSide: 'right', bFlapAnim: 'hover', bFlapDrag: 0 }); }   // dog-ear
      }
      if (axis === 'r') set({ bFlapDrag: clamp(dx / 140, 0, 1) });
      if (axis === 'x') { cancelAnimationFrame(tearRaf); const p = clamp(-dx / 160, 0, 1); setTear(250 * Math.min(1, p * 3) + 230 * p, 2.2 * Math.min(1, p * 3) + p); }
      if (axis === 'y') { cancelAnimationFrame(tearRaf); const p = Math.min(1, dy / 200); setTear(250 + 230 * p, 2.2 + p); }
    };
    const up = (ev) => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      const cancelled = ev && ev.type === 'pointercancel';
      if (cancelled) {
        if (axis === 'r') { set({ bFlapDrag: null, bFlapHover: false }); if (startSide !== 'right') set({ bSide: 'left' }); }
        else { set({ bDragging: false }); tearTo(0, 0, 320); }
        return;
      }
      if (axis === 'x' && dx < -60) tearOut();
      else if (axis === 'y' && dy > 120) tearOut();
      else if (axis === 'r' && dx > 70) { set({ bFlapDrag: null, bFlapHover: true }); setTimeout(dogEar, Math.max(0, 560 - (performance.now() - slideAt))); }
      else if (axis === 'r') { set({ bFlapDrag: null, bFlapHover: false }); if (startSide !== 'right') setTimeout(() => set({ bSide: 'left' }), 260); }
      else if (axis === 'x' || axis === 'y') { set({ bDragging: false }); tearTo(0, 0, 320); }
      else if (!axis) {
        // a tap: only the page's outer edge does anything, and it moves to the other page
        const r = el.stage.getBoundingClientRect(), px = (ev.clientX - r.left) / sc;   // x within the framed page, in book px
        if (startSide === 'left' && px > 330 - EDGE_TAP) set({ bSide: 'right' });
        else if (startSide === 'right' && px < EDGE_TAP) set({ bSide: 'left' });
      }
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  }
  function scrubDown(e) {
    if (S.bBusy || !S.bLeftShown) return;
    const r = el.scrub.getBoundingClientRect();
    const at = (x) => clamp((x - r.left) / r.width * 2 - .5, 0, 1);
    set({ bScrub: at(e.clientX) });
    const move = (ev) => set({ bScrub: at(ev.clientX) });
    const up = () => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      const p = S.bScrub == null ? 0 : S.bScrub;
      set({ bScrub: null, bSide: p > .5 ? 'right' : 'left' });   // snaps to the nearer side
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  }
  // One-time hint after the first passage appears: the page nudges left while `or swipe left` holds, then right; then
  // both captions fade and collapse. Seen once per user (store preference); not played under reduced motion.
  async function playSwipeHint() {
    if (hintPlayed) return;
    hintPlayed = true;
    if (store.pref('hint.swipe') || reduced()) { set({ hintPhase: 'done' }); return; }
    store.setPref('hint.swipe', true);
    await wait(500);
    if (!S.bOpen || !phone()) { set({ hintPhase: 'done' }); return; }
    set({ hintPhase: 'left' });
    await el.stage.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-26px) rotate(-1.2deg)', offset: .45, easing: EASE }, { transform: 'translateX(0)' }], { duration: 900, easing: EASE }).finished.catch(() => {});
    await wait(250);
    set({ hintPhase: 'right' });
    await el.stage.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(26px) rotate(1.2deg)', offset: .45, easing: EASE }, { transform: 'translateX(0)' }], { duration: 900, easing: EASE }).finished.catch(() => {});
    await wait(700);
    set({ hintPhase: 'done' });
  }

  function pageDown(e) {
    if (phone()) return phoneSwipe(e);
    if (!canAct()) return;
    const sx = e.clientX, sy = e.clientY, sc = scale || 1;
    let dx = 0, dy = 0, moved = false;
    set({ bDragging: true });
    const move = (ev) => {
      dx = (ev.clientX - sx) / sc; dy = (ev.clientY - sy) / sc;
      if (Math.abs(dx) > 6) moved = true;
      if (moved) { cancelAnimationFrame(tearRaf); const p = Math.max(0, Math.min(1, -dx / 160)); setTear(250 + 230 * p, 2.2 + 1 * p); }
    };
    const touch = e.pointerType === 'touch' || e.pointerType === 'pen';
    // A finger must pull the page clearly sideways (100 book px, about 47 screen px on a phone), not slip.
    const tore = () => (touch ? dx < -100 && Math.abs(dy) < Math.abs(dx) : dx < -60);
    const up = (ev) => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      const cancelled = ev && ev.type === 'pointercancel';
      if (!cancelled && (tore() || (!moved && !touch))) tearOut();   // a mouse click tears, as approved; a finger must drag
      else if (touch && !moved && !cancelled) {
        // A tap on the page previews the tear (as hovering does with a mouse); dragging the page to the left tears it.
        set({ bDragging: false, bPageHover: true }); tearTo(250, 2.2, 560);
        clearTimeout(tearTimer);
        tearTimer = setTimeout(() => { if (!S.bDragging && !S.bTearing) { set({ bPageHover: false }); tearTo(0, 0, 380); } }, 2200);
      } else { set({ bDragging: false }); tearTo(S.bPageHover && !touch ? 250 : 0, S.bPageHover && !touch ? 2.2 : 0, 320); }
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  }

  // The right page: a mouse click dog-ears it, as approved. A first tap with a finger lifts the corner (the preview a
  // mouse gets on hover); a second tap within a few seconds folds it. A tap anywhere else lowers the corner again.
  function rightTap() {
    if (suppressClick || phone()) return;                               // phones: swipes vote, taps do not
    if (!touchy()) return dogEar();
    if (!canAct()) return;
    if (S.bFlapHover && armTimer) { clearTimeout(armTimer); armTimer = 0; return dogEar(); }
    set({ bFlapHover: true, bFlapAnim: 'hover' });
    clearTimeout(armTimer);
    armTimer = setTimeout(disarmRight, 3200);
  }
  function disarmRight() {
    armTimer = 0;
    if (!S.bFolded && S.bFlapHover) set({ bFlapHover: false, bFlapAnim: 'hover' });
  }

  /* ---------- render: state → the DOM ---------- */
  const styleAct = (a, dim, hot) => { a.style.opacity = dim ? .35 : 1; a.style.color = hot || ''; a.style.transform = hot ? 'translateY(-2px)' : 'none'; };
  function render() {
    if (!NB) return;
    const vw = innerWidth, vh = innerHeight;
    const tornAll = listL('dislike'), lLike = listL('like');
    const isPhone = phone();
    const open = S.bOpen;
    const railW = SH.railWidth();
    if (isPhone) {
      // one page at a time: the stage is as wide as a page and clipped; the camera slides between cover, passage and notes
      const sc = Math.min(1.6, (vw - 16) / 330, (vh - 230) / 520);
      scale = sc;
      const side = open ? S.bSide : 'cover';
      const scrubP = S.bScrub != null ? S.bScrub : side === 'right' ? 1 : 0;
      const shift = side === 'cover' ? 165 : 330 * scrubP;
      const key = 'phone' + side;
      el.inner.style.transition = S.bScrub != null ? 'none' : camKey !== null ? `transform 520ms ${EASE2}` : 'none';
      camKey = key;
      el.stage.classList.add('is-phone');
      el.stage.style.width = 330 * sc + 'px';
      el.stage.style.height = 520 * sc + 'px';
      el.inner.style.transform = `translateX(${-shift * sc}px) scale(${sc})`;
      el.controls.style.width = el.phoneBox.style.width = 330 * sc + 'px';
      el.controls.style.marginRight = '';
      el.scrubThumb.style.left = (scrubP * 50) + '%';
      el.scrubThumb.style.transition = S.bScrub != null ? 'none' : `left 520ms ${EASE2}`;
      el.scrub.setAttribute('aria-valuenow', String(Math.round(scrubP * 100)));
    } else {
      camKey = null;
      el.inner.style.transition = '';
      el.stage.classList.remove('is-phone');
      // Phones in landscape have little height: the corner bars and controls then need about 110 px rather than 230.
      const chrome = vh < 520 && vw > vh ? 110 : 230;
      const narrow = vw - railW < 1100;
      scale = Math.max(.42, Math.min(1.3, (vw - railW - 48) / (narrow ? 700 : 1000), (vh - chrome) / 540));
      el.stage.style.width = 660 * scale + 'px';
      el.stage.style.height = 520 * scale + 'px';
      el.inner.style.transform = `scale(${scale})`;
      el.controls.style.width = 660 * scale + 'px';
      el.controls.style.marginRight = '';
    }

    // The first render places the book without animating it, so it does not slide into place when the page loads.
    if (!rendered) { el.book.style.transition = 'none'; el.base.style.transition = 'none'; }
    el.book.style.transform = open ? 'translateX(0px) rotateY(0deg)' : 'translateX(-165px) rotateY(22deg)';
    el.base.style.left = open ? '0px' : '330px';
    el.base.style.width = open ? '660px' : '330px';
    el.base.style.opacity = open ? 0 : 1;
    if (!rendered) { void el.book.offsetWidth; el.book.style.transition = ''; el.base.style.transition = ''; rendered = true; }
    el.spread.style.opacity = open ? 1 : 0;
    el.spread.style.transition = open ? 'opacity 500ms ease 650ms' : 'opacity 200ms ease';
    // While the book is closed the page hit areas under the cover take no clicks, so the cover opens on a click anywhere.
    el.right.style.pointerEvents = el.torn.style.pointerEvents = open ? '' : 'none';
    el.right.style.touchAction = el.torn.style.touchAction = isPhone ? 'none' : '';

    // right page and its dog-ear flap
    el.right.style.cursor = canAct() ? 'pointer' : 'default';
    const rp = page(S.bRight.kind, S.bRight.idx);
    mount(el.rpage, rp.kind, 'right', rp.entry, rp.folio);
    const drag = S.bFlapDrag;
    const flapOn = S.bLeftShown && (drag != null || S.bFlapHover || S.bFolded || S.bFlapAnim !== 'none');
    const sz = S.bFolded ? 118 : 236;
    const T = S.bFlapAnim === 'fold' ? '780ms cubic-bezier(.3,.1,.15,1)' : '560ms cubic-bezier(.2,.7,.1,1)';
    el.rclip.style.clipPath = flapOn ? `polygon(0px 0px,${330 - sz}px 0px,330px ${sz}px,330px 520px,0px 520px)` : 'polygon(0px 0px,330px 0px,330px 0px,330px 520px,0px 520px)';
    el.rclip.style.transition = S.bFlapAnim === 'none' ? 'none' : `clip-path ${T}`;
    el.flap.hidden = !S.bLeftShown;
    el.flap.style.width = el.flap.style.height = sz + 'px';
    el.flap.style.transform = S.bFolded ? 'rotate3d(1,1,0,-180deg)' : drag != null ? `rotate3d(1,1,0,${(-158 * drag).toFixed(1)}deg)` : S.bFlapHover ? 'rotate3d(1,1,0,-158deg)' : 'rotate3d(1,1,0,0deg)';
    el.flap.style.transition = drag != null ? 'transform 90ms linear' : S.bFlapAnim === 'none' ? 'none' : `transform ${T}, width ${T}, height ${T}`;
    mount(el.flapPage, rp.kind, 'right', rp.entry, rp.folio);
    el.flapShade.style.opacity = drag != null ? drag : S.bFlapHover ? 1 : 0;
    el.flapBack.style.filter = S.bFolded ? 'drop-shadow(-2px 3px 2.4px rgba(60,40,10,.36))' : 'drop-shadow(-7px 10px 9px rgba(50,30,5,.34)) drop-shadow(-1px 2px 1.5px rgba(50,30,5,.25))';

    // left page, dog-ear markers, fore-edge
    const leftVis = S.bLeftShown ? 'visible' : 'hidden';
    el.left.style.visibility = leftVis;
    mount(el.leftPage, 'blank', 'left', null, '');
    el.ears.hidden = !(lLike.length > 0 && S.bLeftShown);
    el.ears.innerHTML = lLike.slice(-4).map((_, k) => `<span class="ear" style="top:${2 + k * 9}px"></span>`).join('');
    el.fore.hidden = open;

    // the excerpt page: a bound stub plus the piece that tears away
    const L = page('excerpt', S.bLeftIdx);
    el.stub.style.visibility = leftVis;
    mount(el.stubPage, 'excerpt', 'left', L.entry, L.folio);
    el.torn.style.visibility = S.bLeftShown && !S.bTorn ? 'visible' : 'hidden';
    el.torn.style.cursor = S.bDragging ? 'grabbing' : 'grab';
    mount(el.piecePage, 'excerpt', 'left', L.entry, L.folio);
    mount(el.belowPage, 'excerpt', 'left', L.entry, L.folio);

    // cover
    el.cover.style.transform = open ? 'rotateY(-180deg) translateZ(3px)' : S.bCoverHover ? 'rotateY(-14deg) translateZ(3px)' : 'rotateY(0deg) translateZ(3px)';
    el.cover.style.transition = open ? `transform 1150ms ${EASE}` : 'transform 420ms cubic-bezier(.2,.7,.1,1)';
    el.cover.style.cursor = open ? 'default' : 'pointer';
    el.cover.style.visibility = S.bLeftShown ? 'hidden' : 'visible';
    el.insideWrap.style.visibility = open && !S.bLeftShown ? 'visible' : 'hidden';
    mount(el.insidePage, 'inside', 'left', null, '');

    // the leaf exists only while a page turns
    if (S.bLeaf) { if (leafFor !== S.bLeaf) { leafFor = S.bLeaf; buildLeaf(S.bLeaf.front, S.bLeaf.back); } }
    else if (leafFor) { leafFor = null; el.leaf.getAnimations({ subtree: true }).forEach((a) => a.cancel()); el.leaf.hidden = true; el.leaf.innerHTML = ''; }   // the prototype rebuilt the leaf each turn; drop finished fill-forward animations

    // controls and corner bars
    const dim = S.bBusy || !S.bLeftShown;
    const phoneOpen = isPhone && open;
    el.phoneBox.hidden = !phoneOpen;
    el.controls.hidden = phoneOpen;
    el.prev.hidden = el.next.hidden = el.tear.hidden = el.fold.hidden = !open;
    el.open.hidden = open;
    el.prev.style.opacity = el.next.style.opacity = el.phPrev.style.opacity = el.phNext.style.opacity = dim ? .4 : 1;
    el.closeLink.style.opacity = S.bBusy ? .4 : 1;
    const tearActive = S.bTearing || S.bDragging || S.bPageHover;
    styleAct(el.tear, dim, tearActive && !S.bBusy ? 'var(--ref-cola)' : null);
    styleAct(el.fold, dim, S.bFlapHover && !S.bBusy ? 'var(--ref-cobalt)' : null);
    styleAct(el.phTear, dim, tearActive && !S.bBusy ? 'var(--ref-cola)' : null);
    styleAct(el.phFold, dim, S.bFlapHover && !S.bBusy ? 'var(--ref-cobalt)' : null);
    const hp = S.hintPhase;
    const hint = hp === 'done' ? { l: 0, r: 0, h: '0px' } : hp === 'left' ? { l: 1, r: .3, h: '20px' } : hp === 'right' ? { l: .3, r: 1, h: '20px' } : { l: 1, r: 1, h: '20px' };
    el.hintL.style.opacity = hint.l; el.hintR.style.opacity = hint.r;
    el.hintL.style.maxHeight = el.hintR.style.maxHeight = hint.h;
    el.closeWrap.hidden = !open;
  }

  /* ---------- quick view: paperback shelf, dog-eared and torn-out pages laid flat ---------- */
  function litDrawer() {
    const wrap = h('div', 'qv');
    const votes = V.all('l');
    const lLike = listL('like'), lDis = listL('dislike');
    const responded = Object.keys(votes).map(idxOf).filter((i) => i >= 0)
      .sort((a, b) => D.sortKey(ENTRIES[a].title).localeCompare(D.sortKey(ENTRIES[b].title)));
    const kd = (i) => votes[ENTRIES[i].id];
    const tab = qv.tab;
    wrap.appendChild(D.tabs([
      { label: `shelf (${responded.length})`, active: tab === 'shelf', onClick: () => { qv.tab = 'shelf'; D.render(); } },
      { label: `dog-eared (${lLike.length})`, active: tab === 'like', onClick: () => { qv.tab = 'like'; D.render(); } },
      { label: `torn out (${lDis.length})`, active: tab === 'dislike', onClick: () => { qv.tab = 'dislike'; D.render(); } },
    ], Object.keys(votes).length ? { label: 'your taste in literature', href: '#taste?m=lit' } : null));
    let items;
    if (tab === 'shelf') {
      if (!responded.length) { wrap.appendChild(h('p', 'qv__empty', 'none yet')); return wrap; }
      const sel = responded.includes(qv.sel) ? qv.sel : responded[0];
      wrap.appendChild(D.shelf(responded.map((i) => {
        const e = ENTRIES[i], b = SPINES[i % SPINES.length];
        const btn = h('button', 'spine spine--book');
        btn.type = 'button'; btn.setAttribute('aria-label', e.title);
        btn.style.cssText = `width:${b.w}px;height:${b.h}px;background:${b.bg}`;
        btn.classList.toggle('is-selected', i === sel);
        btn.innerHTML = `<span class="spine__text spine__text--book"><span class="spine__btitle" style="color:${b.fg}">${esc(e.title)}</span><span class="spine__author" style="color:${b.fg}">${esc(e.byline.split(' — ')[0])}</span></span><span class="spine__paper"></span><span class="spine__shade"></span><span class="spine__crease"></span>`;
        btn.addEventListener('click', () => { qv.sel = i; D.render(); });
        return btn;
      })));
      items = sel === undefined ? [] : [sel];
    } else {
      items = tab === 'like' ? lLike : lDis;
      if (!items.length) wrap.appendChild(h('p', 'qv__empty', 'none yet'));
    }
    const ps = D.pageScale();
    items.forEach((i, k) => {
      const torn = kd(i) === 'dislike', folded = kd(i) === 'like';
      const fig = h('figure', 'qv__page');
      const box = h('div', 'qv__page-box');
      box.style.cssText = `width:${330 * ps}px;height:${520 * ps}px;transform:rotate(${k % 2 ? .7 : -.5}deg)`;
      const inner = h('div', 'qv__page-in'); inner.style.transform = `scale(${ps})`;
      inner.appendChild(flatPage(i, torn, folded));
      box.appendChild(inner); fig.appendChild(box);
      fig.appendChild(h('figcaption', 'qv__cap qv__cap--center', `${ENTRIES[i].title} — ${folded ? 'dog-eared' : 'torn out'}`));
      wrap.appendChild(fig);
    });
    return wrap;
  }
  // A passage page laid flat, torn or dog-eared as it was judged (shared with the taste profile screen).
  function flatPage(i, torn, folded) {
    const frag = document.createDocumentFragment();
    const mask = h('div', 'qv__page-mask');
    if (torn) mask.classList.add('is-torn');
    if (folded) mask.classList.add('is-folded');
    mask.innerHTML = pageHTML('excerpt', 'left', ENTRIES[i], 2 * i + 2) + (torn ? '<div class="qv__page-core"></div>' : '');
    frag.appendChild(mask);
    if (folded) { const f = h('div', 'qv__fold'); f.innerHTML = '<div class="qv__fold-tri"></div>'; frag.appendChild(f); }
    return frag;
  }
  const openQV = (tab) => { qv.tab = tab; D.show(litDrawer); };

  // The shelf lists books responded to (one passage per book today; a book counts as dog-eared if any passage was).
  const shelfProvider = {
    items: () => {
      const byBook = {};
      for (const [id, k] of Object.entries(V.all('l'))) {
        const i = idxOf(id); if (i < 0) continue;
        const w = workOf(i), b = byBook[w] || (byBook[w] = { i, liked: false });
        if (k === 'like') b.liked = true;
      }
      return Object.keys(byBook).map((w) => {
        const i = byBook[w].i, e = ENTRIES[i], b = SPINES[i % SPINES.length] || { bg: '#2f5a4a', fg: '#f3ecdc', w: 26, h: 296 };
        return { id: w, kind: 'book', title: e.title, meta: e.byline.split(' — ')[0].split(' ').pop(), bg: b.bg, fg: b.fg, w: b.w, h: b.h, vote: byBook[w].liked ? 'like' : 'dislike', entry: i };
      });
    },
    open: (id) => { if (id) { const it = shelfProvider.items().find((x) => x.id === id); if (it) qv.sel = it.entry; } openQV('shelf'); },
    source: () => el.stage,
    noun: ['book', 'books'], likeWord: 'dog-eared', dislikeWord: 'torn out',
  };

  /* ---------- wiring ---------- */
  el.cover.addEventListener('click', openBook);
  el.cover.addEventListener('mouseenter', () => { if (!S.bOpen) set({ bCoverHover: true }); });
  el.cover.addEventListener('mouseleave', () => set({ bCoverHover: false }));
  el.right.addEventListener('click', rightTap);
  el.right.addEventListener('pointerdown', (e) => { if (phone()) phoneSwipe(e); });
  // Browsers without overflow:clip can still scroll an overflow:hidden box (for example while the view slides); undo it.
  const litScreen = el.stage.closest('.lit');
  litScreen.addEventListener('scroll', () => { if (litScreen.scrollLeft) litScreen.scrollLeft = 0; });
  // Hover previews are for a mouse; touch browsers also fire emulated mouse events after a tap, which would leave them stuck.
  el.right.addEventListener('mouseenter', () => { if (!touchy() && !phone() && canAct()) set({ bFlapHover: true, bFlapAnim: 'hover' }); });
  el.right.addEventListener('mouseleave', () => { if (!touchy() && !S.bFolded && S.bFlapDrag == null) set({ bFlapHover: false, bFlapAnim: 'hover' }); });
  el.torn.addEventListener('pointerdown', pageDown);
  el.torn.addEventListener('mouseenter', () => { if (!touchy() && !phone() && canAct()) { set({ bPageHover: true }); tearTo(250, 2.2, 560); } });
  el.torn.addEventListener('mouseleave', () => { if (!touchy() && !S.bDragging && !S.bTearing) { set({ bPageHover: false }); tearTo(0, 0, 380); } });
  addEventListener('pointerdown', (e) => { if (armTimer && touchy() && !el.right.contains(e.target)) { clearTimeout(armTimer); disarmRight(); } });
  el.ears.addEventListener('click', () => openQV('like'));
  el.scrub.addEventListener('pointerdown', scrubDown);
  const link = (a, fn) => a.addEventListener('click', (e) => { e.preventDefault(); fn(); });
  link(el.open, openBook); link(el.tear, tearOut); link(el.fold, dogEar);
  link(el.prev, () => browse(-1)); link(el.next, () => browse(1)); link(el.closeLink, closeBook);
  link(el.phTear, tearFromButton); link(el.phFold, foldFromButton);
  link(el.phPrev, () => browse(-1)); link(el.phNext, () => browse(1));
  addEventListener('keydown', (e) => {
    if (!active || D.isOpen() || !S.bOpen) return;
    if (e.key === 'ArrowRight') browse(1); else if (e.key === 'ArrowLeft') browse(-1); else if (e.key === 'Escape') closeBook();
  });
  addEventListener('resize', render);
  addEventListener('pallas:route', (e) => { active = e.detail.isLit; if (active) render(); });

  // Ready passages from the literature library become the book's entries; until at least one is ready, the
  // handoff stand-ins in excerpts.json keep the book working. Entry ids are passage ids, so votes stay stable.
  function fromLibrary(lib) {
    const ready = (lib.passages || []).filter((p) => p.status === 'ready' && Array.isArray(p.text) && p.text.length && lib.books[p.book]);
    return ready.map((p, i) => {
      const b = lib.books[p.book], m = (p.metadata && p.metadata.observed) || {};
      return { id: p.id, book: p.book, num: String(i + 1), title: b.title, byline: `${b.author} — ${b.year}`,
        excerpt: p.text, author: (p.notes && p.notes.author) || '', work: (p.notes && p.notes.work) || '', techniques: m.techniques || [] };
    });
  }
  // A passage longer than the page was designed for keeps the approved layout: its type steps down just enough
  // to end above the folio. Every page lives in the same 330×520 space, so one measurement serves every view.
  async function fitExcerpts() {
    try { await document.fonts.ready; } catch { /* measure with whatever font is loaded */ }
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:-4000px;top:0;visibility:hidden;pointer-events:none';
    document.body.appendChild(box);
    const over = (el, folio) => el.lastElementChild.getBoundingClientRect().bottom > folio.getBoundingClientRect().top - 8;
    for (const entry of ENTRIES) {
      delete entry.fs; delete entry.infoFs;
      box.innerHTML = pageHTML('excerpt', 'left', entry, '00');
      const body = box.querySelector('.pg__body'), folio = box.querySelector('.pg__folio');
      if (body && folio && body.lastElementChild) {
        let fs = parseFloat(getComputedStyle(body).fontSize);
        while (over(body, folio) && fs > 10) { fs -= 0.25; body.style.fontSize = fs + 'px'; }
        if (body.style.fontSize) entry.fs = fs;
      }
      // the facing info page: notes scale together, as a fraction of their designed sizes
      box.innerHTML = pageHTML('info', 'right', entry, '00');
      const secs = box.querySelector('.pg__info-sections'), f2 = box.querySelector('.pg__folio');
      if (secs && f2 && secs.lastElementChild) {
        let k = 1;
        while (over(secs, f2) && k > 0.7) { k = Math.round((k - 0.02) * 100) / 100; secs.style.setProperty('--fit', k); }
        if (k < 1) entry.infoFs = k;
      }
    }
    box.remove();
  }
  let readyResolve;
  const ready = new Promise((res) => { readyResolve = res; });
  Pallas.book = { ready, entries: () => ENTRIES, indexOf: idxOf, flatPage, workOf };
  (async () => {
    try {
      const lib = await (await fetch(LIBRARY_URL, { cache: 'no-cache' })).json();
      ENTRIES = fromLibrary(lib); SPINES = lib.spines || [];
    } catch { /* no library: fall back below */ }
    if (!ENTRIES.length) {
      try {
        const data = await (await fetch(EXCERPTS_URL, { cache: 'no-cache' })).json();
        ENTRIES = data.entries || []; SPINES = data.spines || SPINES;
      } catch { /* no content: the book stays closed with nothing to show */ }
    }
    NB = ENTRIES.length;
    await fitExcerpts();
    setTear(0, 0);
    render();
    SH.register('l', shelfProvider);
    readyResolve(ENTRIES);
  })();
})();
