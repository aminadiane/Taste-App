/* pallas — the literature screen: a photographic paperback authored in a 660×520 space and scaled once.
   Dog-ear = like (right page), tear out = dislike (left page). Ported from the handoff prototype's logic class. */
window.Pallas = window.Pallas || {};
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const V = Pallas.votes, D = Pallas.drawer, store = Pallas.store, h = D.h;
  const pad = (n) => String(n).padStart(2, '0');
  const EASE = 'cubic-bezier(.45,.05,.2,1)';
  const STK = [[0, 0, -6], [12, -8, 4], [-6, 6, -1.5], [6, -3, 7]];
  const LIBRARY_URL = 'library/literature.json';
  const EXCERPTS_URL = 'library/excerpts.json';   // handoff stand-ins, used until library passages are ready

  let ENTRIES = [], SPINES = [], NB = 0;
  const S = { bFocus: 0, bOpen: false, bIdx: 0, bLeftIdx: 0, bRight: { kind: 'title', idx: 0 }, bLeftShown: false, bLeaf: null, bBusy: false,
    bCoverHover: false, bFlapHover: false, bFlapAnim: 'none', bFolded: false, bTearing: false, bTorn: false, bDragging: false, bPageHover: false };
  let ty = 0, sk = 0, scale = 1, tearRaf = 0, timers = [], active = false, leafFor = null, stackKey = '';
  // Touch: a finger has no hover, and a tap must never register a preference by accident. The last pointer type decides
  // how the pages respond (mouse behaviour is unchanged): see pageDown and rightTap below.
  let lastPointer = 'mouse', armTimer = 0, tearTimer = 0, rendered = false;
  /* Phones in portrait: one page at a time (docs/proposals/mobile-book.md, approved 2026-10-21). The book is unchanged;
     a camera (translate + scale on the stage) frames the passage page (focus 0) or the info page (focus 1). A horizontal
     swipe or a tap on the strip of the other page at the screen edge moves between them; on the passage page a
     downward pull tears the page out, since sideways swipes now move the view. Tablets, landscape and desktop keep the
     full spread exactly as before. */
  const FOCUS_MARGIN = 20;   // px of the other page left visible at the screen edge, which is also its tap target
  const focusMode = () => innerWidth < 600 && innerHeight > innerWidth;
  let camKey = null, suppressClick = false;
  function setFocus(f) { if (!focusMode() || !S.bOpen || S.bFocus === f) return; set({ bFocus: f }); }
  addEventListener('pointerdown', (e) => { lastPointer = e.pointerType || 'mouse'; }, true);
  const touchy = () => lastPointer === 'touch' || lastPointer === 'pen';
  const qv = { tab: 'like', sel: null };

  const el = {
    stage: $('stage'), inner: $('stage-inner'), book: $('book'), base: $('bk-base'), spread: $('bk-spread'),
    right: $('bk-right'), rclip: $('rp-clip'), rpage: $('R-page'), rshadow: $('r-shadow'),
    flap: $('flap'), flapPage: $('flap-page'), flapShade: $('flap-shade'), flapBack: $('flap-back'),
    left: $('bk-left'), leftPage: $('left-page'), ears: $('ears'), fore: $('bk-fore'),
    stub: $('bk-stub'), stubPage: $('stub-page'), torn: $('bk-torn'), piecePage: $('piece-page'), belowPage: $('below-page'), lshadow: $('l-shadow'),
    cover: $('bk-cover'), insideWrap: $('cover-back'), insidePage: $('inside-page'), leaf: $('leaf'), stack: $('stack'),
    controls: $('lit-controls'), prev: $('bk-prev'), next: $('bk-next'), open: $('bk-open'), tear: $('bk-tear'), fold: $('bk-fold'),
    closeWrap: $('lit-close'), closeLink: $('bk-close'), counter: $('lit-counter'), lqShelf: $('lq-shelf'), lqLike: $('lq-like'), lqDislike: $('lq-dislike'),
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
    await set({ bBusy: true, bOpen: true, bFocus: 0, bCoverHover: false, bLeaf: { front: page('title', 0), back: page('excerpt', start) }, bRight: { kind: 'info', idx: start } });
    await wait(380);
    await animateLeaf();
    await set({ bLeaf: null, bLeftShown: true, bLeftIdx: start, bIdx: start, bBusy: false });
  }
  async function closeBook() {
    if (!S.bOpen || S.bBusy) return;
    const cur = S.bIdx;
    await set({ bBusy: true, bFocus: 0, bFlapHover: false, bFolded: false, bFlapAnim: 'none', bPageHover: false, bLeaf: { front: page('title', 0), back: page('excerpt', cur) }, bLeftShown: false });
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
    await set({ bFocus: 0, bLeaf: { front: page('info', cur), back: page('excerpt', next) }, bRight: { kind: 'info', idx: next } });
    await animateLeaf();
    setTear(0, 0);
    await set({ bLeaf: null, bLeftIdx: next, bIdx: next, bFolded: false, bFlapHover: false, bFlapAnim: 'none', bTearing: false, bTorn: false, bPageHover: false });
  }
  async function browse(dir) {
    if (!canAct()) return;
    const cur = S.bIdx, next = (cur + dir + NB) % NB;
    await set({ bBusy: true, bFolded: false, bFlapHover: false, bFlapAnim: 'none', bPageHover: false });
    if (dir > 0) await turn();
    else {
      await set({ bFocus: 0, bLeaf: { front: page('info', next), back: page('excerpt', cur) }, bLeftIdx: next, bRight: { kind: 'info', idx: next } });
      await animateLeaf(true);
      await set({ bLeaf: null, bIdx: next });
    }
    set({ bBusy: false });
  }
  // On phones the view first slides to the page being acted on, so the fold or the tear is seen.
  const showPage = async (f) => { if (focusMode() && S.bFocus !== f) { await set({ bFocus: f }); await wait(500); } };
  async function dogEar() {
    if (!canAct()) return;
    V.set('l', ENTRIES[S.bIdx].id, 'like', workOf(S.bIdx));
    await set({ bBusy: true }); await showPage(1);
    await set({ bBusy: true, bFlapHover: false, bFlapAnim: 'fold', bFolded: true });
    await wait(1250);
    await turn(true);
    set({ bBusy: false });
  }
  async function tearOut() {
    if (!canAct()) return;
    V.set('l', ENTRIES[S.bIdx].id, 'dislike', workOf(S.bIdx));
    await set({ bBusy: true }); await showPage(0);
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
    if (S.bOpen && i >= 0) { setTear(0, 0); await set({ bLeaf: null, bIdx: i, bLeftIdx: i, bRight: { kind: 'info', idx: i }, bFolded: false, bTorn: false, bTearing: false }); }
    else render();
    if (D.isOpen() && active) D.render();
    return e;
  }
  Pallas.literature = { skip: skipPassage, undo: undoLast, canUndo: () => !!store.lastUndoable('literature'), get busy() { return S.bOpen && !canAct(); } };

  // Phones in portrait (focusMode): the passage page. A sideways swipe moves the view; a tap on the visible strip while
  // the info page is in view returns to the passage; a downward pull tears the page out (the tear runs top to bottom).
  function phonePageDown(e) {
    if (!canAct()) return;
    const sx = e.clientX, sy = e.clientY, sc = scale || 1;
    let rx = 0, ry = 0, axis = null;
    set({ bDragging: true });
    const move = (ev) => {
      rx = ev.clientX - sx; ry = ev.clientY - sy;
      if (!axis && Math.hypot(rx, ry) > 10) axis = Math.abs(rx) > Math.abs(ry) ? 'x' : 'y';
      if (axis === 'y' && S.bFocus === 0 && ry > 0) { cancelAnimationFrame(tearRaf); const p = Math.min(1, ry / sc / 200); setTear(250 + 230 * p, 2.2 + 1 * p); }
    };
    const up = (ev) => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      const cancelled = ev && ev.type === 'pointercancel';
      set({ bDragging: false });
      if (cancelled) { tearTo(0, 0, 320); return; }
      if (S.bFocus === 1) { if (!axis || (axis === 'x' && rx > 40)) setFocus(0); return; }
      if (axis === 'x') { if (rx < -40) setFocus(1); return; }
      if (axis === 'y' && ry / sc > 120) return tearOut();
      if (!axis) {   // a tap previews the tear, as on other touch screens
        set({ bPageHover: true }); tearTo(250, 2.2, 560);
        clearTimeout(tearTimer);
        tearTimer = setTimeout(() => { if (!S.bDragging && !S.bTearing) { set({ bPageHover: false }); tearTo(0, 0, 380); } }, 2200);
        return;
      }
      tearTo(0, 0, 320);
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  }
  // The info page on phones: a swipe to the right returns to the passage page.
  function phoneRightDown(e) {
    if (!focusMode() || !S.bOpen) return;
    const sx = e.clientX, sy = e.clientY;
    const up = (ev) => {
      removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      const rx = ev.clientX - sx, ry = ev.clientY - sy;
      if (ev.type !== 'pointercancel' && Math.abs(rx) > 40 && Math.abs(rx) > Math.abs(ry)) {
        suppressClick = true; setTimeout(() => { suppressClick = false; }, 450);
        if (rx > 0) setFocus(0);
      }
    };
    addEventListener('pointerup', up); addEventListener('pointercancel', up);
  }

  function pageDown(e) {
    if (focusMode()) return phonePageDown(e);
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
    if (suppressClick) return;                                         // the end of a swipe, not a tap
    if (focusMode() && S.bOpen && S.bFocus === 0) return setFocus(1);  // the strip at the screen edge: go to the info page
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
    const narrow = vw < 1100;
    const phone = focusMode();
    const extra = !phone && tornAll.length && narrow ? 190 : 0;
    // Phones in landscape have little height: the corner bars and controls then need about 110 px rather than 230.
    const chrome = vh < 520 && vw > vh ? 110 : 230;
    if (phone) {
      // the page fills the width, unless the height (corner bars, controls: about 190 px) is the limit
      const sOpen = Math.min(1.3, (vw - 2 * FOCUS_MARGIN) / 330, (vh - 190) / 520);
      const sClosed = Math.min(sOpen * .82, (vw * .64) / 330);
      const isOpen = S.bOpen;
      scale = isOpen ? sOpen : sClosed;
      // book space → stage: open, the focused page's left edge sits at the stage's left; closed, the cover is centred
      const tx = isOpen ? -330 * sOpen * S.bFocus : 165 * sOpen - 330 * sClosed;
      const ty0 = isOpen ? 0 : (520 * sOpen - 520 * sClosed) / 2;
      const key = (isOpen ? 'open' : 'closed') + S.bFocus;
      const opening = camKey !== null && camKey.startsWith('open') !== isOpen;
      el.inner.style.transition = camKey !== null && camKey !== key ? `transform ${opening ? 1150 : 480}ms ${EASE}` : 'none';
      camKey = key;
      el.stage.style.width = 330 * sOpen + 'px';
      el.stage.style.height = 520 * sOpen + 'px';
      el.inner.style.transform = `translate(${tx}px,${ty0}px) scale(${scale})`;
      el.controls.style.width = Math.max(330 * sOpen, vw - 32) + 'px';   // the controls use the screen width, not the page's
      el.controls.style.marginRight = '0px';
    } else {
      camKey = null;
      el.inner.style.transition = '';
      // The floor keeps the book from shrinking without limit; on the smallest phones it may go below .42 so that the
      // spread (and the torn stack beside it) is never wider than the screen.
      scale = Math.max(vw < 420 ? .3 : .42, Math.min(1.3, (vw - 48) / (narrow ? 700 + extra : 1000), (vh - chrome) / 540));
      el.stage.style.width = (660 + extra) * scale + 'px';
      el.stage.style.height = 520 * scale + 'px';
      el.inner.style.transform = `scale(${scale})`;
      el.controls.style.width = 660 * scale + 'px';
      el.controls.style.marginRight = extra * scale + 'px';
    }

    const open = S.bOpen;
    // The first render places the book without animating it, so it does not slide into place when the page loads.
    if (!rendered) { el.book.style.transition = 'none'; el.base.style.transition = 'none'; }
    el.book.style.transform = open ? 'translateX(0px) rotateY(0deg)' : 'translateX(-165px) rotateY(22deg)';
    el.base.style.left = open ? '0px' : '330px';
    el.base.style.width = open ? '660px' : '330px';
    el.base.style.opacity = open ? 0 : 1;
    if (!rendered) { void el.book.offsetWidth; el.book.style.transition = ''; el.base.style.transition = ''; rendered = true; }
    el.spread.style.opacity = open ? 1 : 0;
    el.spread.style.transition = open ? 'opacity 500ms ease 650ms' : 'opacity 200ms ease';

    // right page and its dog-ear flap
    el.right.style.cursor = canAct() ? 'pointer' : 'default';
    const rp = page(S.bRight.kind, S.bRight.idx);
    mount(el.rpage, rp.kind, 'right', rp.entry, rp.folio);
    const flapOn = S.bLeftShown && (S.bFlapHover || S.bFolded || S.bFlapAnim !== 'none');
    const sz = S.bFolded ? 118 : 236;
    const T = S.bFlapAnim === 'fold' ? '780ms cubic-bezier(.3,.1,.15,1)' : '560ms cubic-bezier(.2,.7,.1,1)';
    el.rclip.style.clipPath = flapOn ? `polygon(0px 0px,${330 - sz}px 0px,330px ${sz}px,330px 520px,0px 520px)` : 'polygon(0px 0px,330px 0px,330px 0px,330px 520px,0px 520px)';
    el.rclip.style.transition = S.bFlapAnim === 'none' ? 'none' : `clip-path ${T}`;
    el.flap.hidden = !S.bLeftShown;
    el.flap.style.width = el.flap.style.height = sz + 'px';
    el.flap.style.transform = S.bFolded ? 'rotate3d(1,1,0,-180deg)' : S.bFlapHover ? 'rotate3d(1,1,0,-158deg)' : 'rotate3d(1,1,0,0deg)';
    el.flap.style.transition = S.bFlapAnim === 'none' ? 'none' : `transform ${T}, width ${T}, height ${T}`;
    mount(el.flapPage, rp.kind, 'right', rp.entry, rp.folio);
    el.flapShade.style.opacity = S.bFlapHover ? 1 : 0;
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

    // the torn stack beside the book: the last four torn pages
    const torn = tornAll.slice(-4);
    el.stack.hidden = !torn.length || phone;   // on phones in portrait the torn pages stay in the drawer ("torn out")
    const key = torn.join(',');
    if (key !== stackKey) {
      stackKey = key;
      el.stack.innerHTML = torn.map((i, k) => `<div class="stack__page" style="transform:translate(${STK[k][0]}px,${STK[k][1]}px) rotate(${STK[k][2]}deg) scale(.34)"><div class="stack__mask">${pageHTML('excerpt', 'left', ENTRIES[i], 2 * i + 2)}<div class="stack__core"></div></div></div>`).join('');
    }

    // controls and corner bars
    const dim = S.bBusy || !S.bLeftShown;
    el.prev.hidden = el.next.hidden = el.tear.hidden = el.fold.hidden = !open;
    el.open.hidden = open;
    el.prev.style.opacity = el.next.style.opacity = dim ? .4 : 1;
    el.closeLink.style.opacity = S.bBusy ? .4 : 1;
    const tearActive = S.bTearing || S.bDragging || S.bPageHover;
    styleAct(el.tear, dim, tearActive && !S.bBusy ? 'var(--ref-cola)' : null);
    styleAct(el.fold, dim, S.bFlapHover && !S.bBusy ? 'var(--ref-cobalt)' : null);
    el.closeWrap.hidden = !open;
    el.counter.hidden = !open;
    el.counter.textContent = 'excerpt ' + pad(S.bIdx + 1) + ' / ' + pad(NB);
    el.lqLike.textContent = `dog-eared (${lLike.length})`;
    el.lqDislike.textContent = `torn out (${tornAll.length})`;
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
    ]));
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
      const mask = h('div', 'qv__page-mask');
      if (torn) mask.classList.add('is-torn');
      if (folded) mask.classList.add('is-folded');
      mask.innerHTML = pageHTML('excerpt', 'left', ENTRIES[i], 2 * i + 2) + (torn ? '<div class="qv__page-core"></div>' : '');
      inner.appendChild(mask);
      if (folded) { const f = h('div', 'qv__fold'); f.innerHTML = '<div class="qv__fold-tri"></div>'; inner.appendChild(f); }
      box.appendChild(inner); fig.appendChild(box);
      fig.appendChild(h('figcaption', 'qv__cap qv__cap--center', `${ENTRIES[i].title} — ${folded ? 'dog-eared' : 'torn out'}`));
      wrap.appendChild(fig);
    });
    return wrap;
  }
  const openQV = (tab) => { qv.tab = tab; D.show(litDrawer); };

  /* ---------- wiring ---------- */
  el.cover.addEventListener('click', openBook);
  el.cover.addEventListener('mouseenter', () => { if (!S.bOpen) set({ bCoverHover: true }); });
  el.cover.addEventListener('mouseleave', () => set({ bCoverHover: false }));
  el.right.addEventListener('click', rightTap);
  el.right.addEventListener('pointerdown', phoneRightDown);
  // Browsers without overflow:clip can still scroll an overflow:hidden box (for example while the view slides); undo it.
  const litScreen = el.stage.closest('.lit');
  litScreen.addEventListener('scroll', () => { if (litScreen.scrollLeft) litScreen.scrollLeft = 0; });
  // Hover previews are for a mouse; touch browsers also fire emulated mouse events after a tap, which would leave them stuck.
  el.right.addEventListener('mouseenter', () => { if (!touchy() && canAct()) set({ bFlapHover: true, bFlapAnim: 'hover' }); });
  el.right.addEventListener('mouseleave', () => { if (!touchy() && !S.bFolded) set({ bFlapHover: false, bFlapAnim: 'hover' }); });
  el.torn.addEventListener('pointerdown', pageDown);
  el.torn.addEventListener('mouseenter', () => { if (!touchy() && canAct()) { set({ bPageHover: true }); tearTo(250, 2.2, 560); } });
  el.torn.addEventListener('mouseleave', () => { if (!touchy() && !S.bDragging && !S.bTearing) { set({ bPageHover: false }); tearTo(0, 0, 380); } });
  addEventListener('pointerdown', (e) => { if (armTimer && touchy() && !el.right.contains(e.target)) { clearTimeout(armTimer); disarmRight(); } });
  el.ears.addEventListener('click', () => openQV('like'));
  el.stack.addEventListener('click', () => openQV('dislike'));
  const link = (a, fn) => a.addEventListener('click', (e) => { e.preventDefault(); fn(); });
  link(el.open, openBook); link(el.tear, tearOut); link(el.fold, dogEar);
  link(el.prev, () => browse(-1)); link(el.next, () => browse(1)); link(el.closeLink, closeBook);
  link(el.lqShelf, () => openQV('shelf')); link(el.lqLike, () => openQV('like')); link(el.lqDislike, () => openQV('dislike'));
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
  })();
})();
