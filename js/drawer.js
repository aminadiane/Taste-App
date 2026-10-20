/* pallas — quick-view drawer (design-system Drawer, right side) and the shelf helpers both screens share. */
window.Pallas = window.Pallas || {};
(() => {
  const root = document.getElementById('drawer');
  const panel = root.querySelector('.drawer__panel');
  const body = root.querySelector('.drawer__body');
  let open = false, renderer = null;

  const width = () => Math.max(440, Math.round(innerWidth * .5));
  const layout = () => { panel.style.width = `min(${width()}px, 100vw)`; };
  function render() { if (!renderer) return; body.innerHTML = ''; body.appendChild(renderer()); }
  function show(fn) { renderer = fn; layout(); render(); open = true; root.classList.add('is-open'); root.setAttribute('aria-hidden', 'false'); }
  function close() { open = false; renderer = null; root.classList.remove('is-open'); root.setAttribute('aria-hidden', 'true'); }

  root.querySelector('.drawer__scrim').addEventListener('click', close);
  root.querySelector('.drawer__close').addEventListener('click', (e) => { e.preventDefault(); close(); });
  addEventListener('keydown', (e) => { if (open && e.key === 'Escape') { close(); e.stopImmediatePropagation(); } });   // Escape closes the drawer only; the book's Escape must not also fire
  addEventListener('resize', () => { if (open) { layout(); render(); } });

  // Small DOM helper used by both screens' drawer content.
  function h(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  // Tabs row: [{ label, active, onClick }]
  function tabs(items) {
    const row = h('div', 'qv__tabs');
    for (const it of items) {
      const a = h('a', 'qlink' + (it.active ? ' is-active' : ''), it.label);
      a.href = '#';
      a.addEventListener('click', (e) => { e.preventDefault(); it.onClick(); });
      row.appendChild(a);
    }
    return row;
  }

  // The shelf: a row of spines over a board. Mouse drag scrolls with inertia; the click after a drag is swallowed.
  function shelf(spines) {
    const wrap = h('div', 'shelf');
    const row = h('div', 'shelf__row');
    spines.forEach((s) => row.appendChild(s));
    wrap.appendChild(row);
    wrap.appendChild(h('div', 'shelf__board'));
    wrap.appendChild(h('div', 'shelf__fade'));
    let raf = 0;
    row.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;   // touch: native pan-x
      cancelAnimationFrame(raf);
      const x0 = e.clientX, s0 = row.scrollLeft;
      let lastX = x0, lastT = performance.now(), v = 0, moved = false;
      const move = (ev) => {
        const now = performance.now(), dx = ev.clientX - x0;
        if (Math.abs(dx) > 4) moved = true;
        row.scrollLeft = s0 - dx;
        v = (ev.clientX - lastX) / Math.max(1, now - lastT); lastX = ev.clientX; lastT = now;
      };
      const up = () => {
        removeEventListener('pointermove', move); removeEventListener('pointerup', up);
        row.style.cursor = 'grab';
        if (moved) {
          const stop = (ce) => { ce.stopPropagation(); ce.preventDefault(); row.removeEventListener('click', stop, true); };
          row.addEventListener('click', stop, true);
          setTimeout(() => row.removeEventListener('click', stop, true), 0);
        }
        let vel = -v * 16, t = performance.now();
        const glide = (now) => {
          const dt = Math.min(32, now - t); t = now;
          row.scrollLeft += vel * dt / 16;
          vel *= Math.pow(.94, dt / 16);
          if (Math.abs(vel) > .2 && row.scrollLeft > 0 && row.scrollLeft < row.scrollWidth - row.clientWidth) raf = requestAnimationFrame(glide);
        };
        raf = requestAnimationFrame(glide);
      };
      row.style.cursor = 'grabbing';
      addEventListener('pointermove', move); addEventListener('pointerup', up);
    });
    return wrap;
  }

  // A–Z ignoring a leading The / A / An.
  const sortKey = (title) => title.replace(/^(the|a|an) /i, '');

  Pallas.drawer = { show, close, render, isOpen: () => open, width, h, tabs, shelf, sortKey,
    pageScale: () => Math.max(.6, Math.min(1.2, (Math.min(width(), innerWidth) - 80) / 330)) };
})();
