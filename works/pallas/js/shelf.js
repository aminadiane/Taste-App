/* pallas — the shelf (handoff update 2): the desktop rail at 900px and up, its closed tab, the mobile mini shelf below
   900px, and the fly-in that carries each response's spine to its slot. Both screens register a provider that lists the
   works responded to; the shelf itself keeps no data beyond the current fly-in and the rail's open state (memory only,
   re-opened on every entry to a screen). Spines are sorted A–Z ignoring a leading The / A / An. */
window.Pallas = window.Pallas || {};
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const D = Pallas.drawer, h = D.h;
  const EASE = 'cubic-bezier(.2,.7,.1,1)';
  const RAIL_W = 208, ROW_W = 168;
  // The spine flies once the screen's own sequence has finished: after the like swipe, while the screen is dark after a
  // dislike, and after the book's fold or tear.
  const DELAY = { c: { like: 1450, dislike: 1900 }, l: { like: 1300, dislike: 1300 } };

  const el = { rail: $('rail'), tab: $('rail-tab'), count: $('rail-count'), close: $('rail-close'), filters: $('rail-filters'), rows: $('rail-rows'), caption: $('rail-caption') };
  const minis = { c: $('cq-mini'), l: $('lq-mini') };
  const providers = {};
  let area = null, railOpen = true, filter = 'all', fly = null, flyTimer = 0, known = new Set(), flyer = null;

  const isRail = () => innerWidth >= 900;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frame = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
  const key = (a, id) => a + ':' + id;

  // Spine sizes on the rail and in the mini strip, from the item's kind (film) or its paperback preset (book: w × h at 300).
  const railSize = (it) => it.kind === 'book' ? { w: Math.max(14, Math.round(it.w * .72)), h: Math.round(it.h / 300 * 132) } : { w: 15, h: 118 };
  const miniSize = (it) => it.kind === 'book' ? { w: Math.max(7, Math.round(it.w * .3)), h: Math.round(24 + it.h / 300 * 12) } : { w: 8, h: 34 };

  function items() {
    const p = providers[area];
    if (!p) return [];
    return p.items().slice().sort((a, b) => D.sortKey(a.title).localeCompare(D.sortKey(b.title)));
  }

  function register(a, provider) { providers[a] = provider; if (area === a) render(); }
  // Entering a screen: the rail is open by default, the filter is `all`, and no fly-in is pending.
  function enter(a) {
    clearTimeout(flyTimer); fly = null; removeFlyer();
    area = a; railOpen = true; filter = 'all';
    render();
  }
  function leave() { clearTimeout(flyTimer); fly = null; removeFlyer(); area = null; render(); }
  function removeFlyer() { if (flyer) { flyer.remove(); flyer = null; } }

  // Called by a screen right after a vote is recorded. `known` still holds the shelf as rendered before the vote, so a
  // re-vote of a work already on the shelf replays the fly-in without collapsing its slot.
  function respond(a, id, kind) {
    if (a !== area) return;
    clearTimeout(flyTimer); removeFlyer();
    const k = key(a, id);
    fly = { key: k, phase: 'hold', re: known.has(k) };
    filter = 'all';
    render();
    flyTimer = setTimeout(() => flyIn(k), DELAY[a][kind]);
  }

  async function flyIn(k) {
    if (!fly || fly.key !== k) return;
    fly.phase = 'open';
    render();                                   // the slot opens (width 0 → spine width); neighbours slide apart
    await frame();
    const desk = isRail(), open = railOpen;
    const done = () => { if (fly && fly.key === k) { fly = null; render(); } };
    const p = providers[area], src = p && p.source();
    const slot = desk ? (open ? el.rows.querySelector(`[data-rk="${CSS.escape(k)}"]`) : el.tab) : minis[area].querySelector(`[data-sl="${CSS.escape(k)}"]`);
    const it = items().find((x) => key(area, x.id) === k);
    if (!src || !slot || !it || !src.isConnected || !slot.isConnected || reduced()) return done();
    const s = src.getBoundingClientRect(), r = slot.getBoundingClientRect();
    const dim = it.vote === 'dislike' ? .45 : 1;
    let tx, ty, tw, th, a = 1, c = 1, endOp = dim, endT = 'translate(0px,0px) scale(1,1)', lift = 70;
    if (desk && open) { const ir = slot.firstElementChild.getBoundingClientRect(); tw = ir.width; th = ir.height; tx = ir.left; ty = r.bottom - th; }
    else if (desk) { tw = 120; th = 18; tx = r.left + r.width / 2 - tw / 2; ty = r.top + r.height / 2 - th / 2; endOp = 0; endT = 'translate(36px,5px) scale(.4,.4)'; }
    else { tw = 5; th = parseFloat(slot.style.height) || 16; tx = r.left; ty = r.bottom - th; a = 12 / tw; c = 44 / th; lift = 40; }
    const sx = s.left + s.width / 2 - tw * a / 2 - tx, sy = s.top + s.height / 2 - th * c / 2 - ty;
    const f = h('div', 'flyer');
    f.style.cssText = `left:${tx}px;top:${ty}px;width:${tw}px;height:${th}px;background:${it.bg};color:${it.fg};padding:0 ${desk ? 8 : 0}px;`;
    if (desk && open) {
      const tt = h('span', 'flyer__title', it.title);
      tt.style.fontFamily = it.kind === 'book' ? "'Newsreader',serif" : 'var(--font-sans)';
      f.style.flexDirection = 'column'; f.style.padding = '7px 0';
      f.appendChild(tt);
    }
    document.body.appendChild(f);
    flyer = f;
    const st = `translate(${sx}px,${sy}px) scale(${a},${c})`;
    const anim = f.animate([
      { transform: st, opacity: 0 },
      { transform: st, opacity: 1, offset: .1 },
      { transform: `translate(${sx * .4}px,${sy * .4 - lift}px) scale(${(a + 1) / 2},${(c + 1) / 2})`, opacity: 1, offset: .55 },
      { transform: endT, opacity: endOp },
    ], { duration: 820, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' });
    try { await anim.finished; } catch { /* cancelled by a screen change */ }
    done();
    setTimeout(() => { if (flyer === f) flyer = null; f.remove(); }, 220);
  }

  /* ---------- render ---------- */
  function render() {
    const p = providers[area], on = !!area && !!p;
    const list = on ? items() : [];
    const desk = isRail();
    const open = on && desk && railOpen;
    document.body.classList.toggle('rail-open', open);
    el.rail.hidden = !open;
    el.tab.hidden = !(on && desk && !railOpen);
    for (const a of Object.keys(minis)) minis[a].hidden = !(on && !desk && a === area);
    known = new Set(list.map((it) => key(area, it.id)));
    if (!on) { el.rows.innerHTML = ''; for (const a of Object.keys(minis)) minis[a].innerHTML = ''; return; }

    const n = list.length, nLike = list.filter((it) => it.vote === 'like').length, nDis = n - nLike;
    el.tab.textContent = `shelf (${n})`;
    if (open) {
      el.count.textContent = `${n} ${n === 1 ? p.noun[0] : p.noun[1]}`;
      el.filters.innerHTML = '';
      [['all', 'all'], ['like', `${p.likeWord} ${nLike}`], ['dislike', `${p.dislikeWord} ${nDis}`]].forEach(([v, label]) => {
        const a = h('a', 'rail__f' + (filter === v ? ' is-active' : ''), label);
        a.href = '#';
        a.addEventListener('click', (e) => { e.preventDefault(); filter = v; render(); });
        el.filters.appendChild(a);
      });
      el.caption.textContent = n ? '' : 'responses collect here';
      // spines stand on rows 168px wide, 2px apart, wrapping when a row is full
      const rows = []; let cur = null;
      list.filter((it) => filter === 'all' || it.vote === filter).forEach((it) => {
        const sz = railSize(it), k = key(area, it.id), hold = !!fly && fly.key === k;
        const collapsed = hold && fly.phase === 'hold' && !fly.re;
        if (!cur || cur.used + sz.w + 2 > ROW_W) { cur = { items: [], used: 0, max: 0 }; rows.push(cur); }
        cur.items.push({ it, sz, k, hold, collapsed }); cur.used += sz.w + 2; cur.max = Math.max(cur.max, sz.h);
      });
      el.rows.innerHTML = '';
      rows.forEach((row) => {
        const r = h('div', 'rail__row');
        r.style.minHeight = row.max + 'px';
        row.items.forEach(({ it, sz, k, hold, collapsed }) => {
          const slot = h('div', 'rail__slot');
          slot.dataset.rk = k;
          slot.style.width = (collapsed ? 0 : sz.w) + 'px'; slot.style.height = sz.h + 'px';
          const sp = h('button', 'rail__spine' + (it.kind === 'book' ? ' rail__spine--book' : ''));
          sp.type = 'button'; sp.title = it.title;
          sp.style.cssText = `width:${sz.w}px;height:${sz.h}px;background:${it.bg};color:${it.fg};opacity:${hold ? 0 : it.vote === 'dislike' ? .45 : 1}`;
          sp.append(h('span', 'rail__spine-title', it.title), h('span', 'rail__spine-meta', it.meta));
          sp.addEventListener('click', () => p.open(it.id));
          slot.appendChild(sp);
          r.appendChild(slot);
        });
        el.rows.appendChild(r);
      });
    }
    if (!desk) {
      const m = minis[area];
      m.innerHTML = '';
      const link = h('a', 'mini__link');
      link.href = '#'; link.setAttribute('aria-label', 'open your shelf');
      link.addEventListener('click', (e) => { e.preventDefault(); p.open(null); });
      const strip = h('span', 'mini__strip');
      list.slice(0, 30).forEach((it) => {
        const sz = miniSize(it), k = key(area, it.id), hold = !!fly && fly.key === k, shut = hold && fly.phase === 'hold' && !fly.re;
        const s = h('span', 'mini__spine');
        s.dataset.sl = k;
        s.style.cssText = `width:${shut ? 0 : sz.w}px;margin-right:${shut ? 0 : 2}px;height:${sz.h}px;background:${it.bg};opacity:${hold ? 0 : it.vote === 'dislike' ? .45 : 1}`;
        strip.appendChild(s);
      });
      const text = h('span', 'mini__text');
      text.append(h('span', null, 'your shelf'), h('span', 'mini__count', String(n)));
      link.append(strip, text);
      m.appendChild(link);
    }
  }

  el.close.addEventListener('click', (e) => { e.preventDefault(); railOpen = false; render(); });
  el.tab.addEventListener('click', (e) => { e.preventDefault(); railOpen = true; render(); });
  addEventListener('resize', render);

  Pallas.shelf = { register, enter, leave, respond, render, railWidth: () => (area && isRail() && railOpen ? RAIL_W : 0), isPhone: () => innerWidth < 640 };
})();
