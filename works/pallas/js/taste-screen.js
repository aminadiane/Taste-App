/* pallas — the Taste Profile screen, "the sorting table" (handoff update 2, concept 1b). Route: #taste?m=film|lit.
   Everything shown comes from the taste engine (Pallas.taste.profile): findings drawn to / away from, their strength
   labels and counts, the glossary terms, and the supporting and contradicting items. Nothing is invented and no scores
   are shown. With no responses in a medium the page shows only the empty state. With responses but no finding yet, the
   engine's own summary sentence stands where the findings would be. */
window.Pallas = window.Pallas || {};
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const h = Pallas.drawer.h, V = Pallas.votes;
  const AREA = { film: 'cinema', lit: 'literature' };
  const ROT = [-1.4, .9, -.5, 1.3, -.9];
  const EASE = 'cubic-bezier(.2,.7,.1,1)';
  const el = { main: $('taste'), sw: $('taste-switch'), swFilm: $('taste-film'), swLit: $('taste-lit'), empty: $('taste-empty'), body: $('taste-body'),
    head: $('taste-h'), basis: $('taste-basis'), findings: $('taste-findings'), detail: $('taste-detail'), table: $('taste-table'), exam: $('taste-exam') };
  let med = 'film', sel = 0, exam = null, active = false, token = 0, data = null;
  const phone = () => innerWidth < 640;

  const roman = (n) => { const R = [['x', 10], ['ix', 9], ['v', 5], ['iv', 4], ['i', 1]]; let s = ''; for (const [r, v] of R) while (n >= v) { s += r; n -= v; } return s + '.'; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- data: the profile and the judged works of the chosen medium ---------- */
  async function load(m) {
    const area = AREA[m];
    const judgments = Pallas.taste.judgments(area);
    const ids = Object.keys(judgments);
    if (!ids.length) return { empty: true };
    const profile = await Pallas.taste.profile(area);
    let works;
    if (m === 'film') {
      const lib = await Pallas.film.ready;
      works = ids.map((id) => { const s = lib.stills.find((x) => x.id === id); if (!s) return null; const f = lib.films[s.film] || {};
        return { id, work: s.film, title: f.title || s.film, by: f.director || '', year: f.year || '', vote: judgments[id], file: Pallas.film.base + s.file, alt: s.scene || '' }; }).filter(Boolean);
    } else {
      const entries = await Pallas.book.ready;
      works = ids.map((id) => { const i = Pallas.book.indexOf(id); if (i < 0) return null; const e = entries[i];
        return { id, work: Pallas.book.workOf(i), title: e.title, by: e.byline.split(' — ')[0], year: '', vote: judgments[id], entry: i }; }).filter(Boolean);
    }
    const byId = new Map(works.map((w) => [w.id, w]));
    const term = new Map((profile.terminology || []).map((t) => [t.term, t]));
    // Findings: drawn to (preferred) and away from (disliked), leaving out those the engine says another explains.
    const rank = { 'well supported': 0, emerging: 1, tentative: 2 };
    const findings = [...profile.preferred.map((f) => ({ ...f, dir: 'toward' })), ...profile.disliked.map((f) => ({ ...f, dir: 'away' }))]
      .filter((f) => !f.explainedBy)
      .sort((a, b) => (rank[a.strength] - rank[b.strength]) || (a.dir === b.dir ? 0 : a.dir === 'toward' ? -1 : 1))
      .map((f) => {
        const keys = [f.feature, ...(f.aliases || [])];
        const terms = keys.map((k) => term.get(k)).filter(Boolean).map((t) => ({ t: t.label, d: t.definition }));
        const label = (k) => (term.get(k) || {}).label || f.label;
        const support = (f.evidence.supporting || []).filter((id) => byId.has(id)), against = (f.evidence.contradicting || []).filter((id) => byId.has(id));
        return { dir: f.dir, title: keys.map(label).join(', '), strength: f.strength, evidence: f.explanation, terms, support, against, subjective: f.subjective };
      });
    return { empty: false, profile, works, byId, findings };
  }

  const voteWord = (w) => med === 'lit' ? (w.vote === 'like' ? 'dog-eared' : 'torn out') : (w.vote === 'like' ? 'liked' : 'disliked');
  const caption = (w) => med === 'lit' ? `${w.title}, ${w.by} — ${voteWord(w)}` : `${w.title} — ${w.by}, ${w.year} — ${voteWord(w)}`;
  function basis(p) {
    const b = p.basedOn;
    return med === 'lit' ? `drawn from ${b.judged} passage${b.judged === 1 ? '' : 's'} — ${b.likes} dog-eared, ${b.dislikes} torn out`
      : `drawn from ${b.judged} still${b.judged === 1 ? '' : 's'} — ${b.likes} liked, ${b.dislikes} disliked`;
  }
  // Relationships between findings: works shared with another finding's evidence.
  function rel(F, k) {
    const f = F[k], mine = new Set([...f.support, ...f.against].map((id) => data.byId.get(id).work));
    const parts = [];
    F.forEach((g, j) => {
      if (j === k) return;
      const shared = [...new Set([...g.support, ...g.against].map((id) => data.byId.get(id).work).filter((w) => mine.has(w)))];
      if (shared.length) parts.push(`shares ${shared.map((w) => data.works.find((x) => x.work === w).title).join(', ')} with ${roman(j + 1)}`);
    });
    return parts.join(' — ');
  }

  /* ---------- the objects: a framed print or a page laid flat ---------- */
  function object(w, cls) {
    const o = h('div', 'tobj' + (cls ? ' ' + cls : ''));
    if (med === 'film') {
      const print = h('div', 'tobj__print'), frame = h('div', 'tobj__frame');
      const img = document.createElement('img'); img.src = w.file; img.alt = w.alt; img.draggable = false; img.loading = 'lazy';
      frame.appendChild(img); print.appendChild(frame); o.appendChild(print);
    } else {
      const pg = h('div', 'tobj__page'), inner = h('div', 'tobj__page-in');
      inner.appendChild(Pallas.book.flatPage(w.entry, w.vote === 'dislike', w.vote === 'like'));
      pg.appendChild(inner); o.appendChild(pg);
    }
    o.appendChild(h('p', 'tobj__cap', caption(w)));
    o.addEventListener('click', (e) => { e.stopPropagation(); exam = w.id; renderExam(); });
    return o;
  }

  /* ---------- render ---------- */
  function render() {
    el.swFilm.classList.toggle('is-active', med === 'film');
    el.swLit.classList.toggle('is-active', med === 'lit');
    el.head.textContent = `your taste in ${med === 'lit' ? 'literature' : 'film'}`;
    if (!data || data.empty) {
      el.empty.hidden = false; el.body.hidden = true; el.sw.hidden = true; el.exam.hidden = true;
      return;
    }
    el.empty.hidden = true; el.body.hidden = false; el.sw.hidden = false;
    const F = data.findings;
    sel = clamp(sel, 0, Math.max(0, F.length - 1));
    el.basis.textContent = basis(data.profile);
    el.findings.innerHTML = '';
    if (F.length) {
      F.forEach((f, k) => {
        const b = h('button', 'tf' + (k === sel ? ' is-active' : ''));
        b.type = 'button';
        const text = h('span', 'tf__text');
        text.append(h('span', 'tf__dir' + (f.dir === 'away' ? ' tf__dir--away' : ''), f.dir === 'toward' ? 'drawn to' : 'away from'), h('span', 'tf__title', f.title));
        b.append(h('span', 'tf__num', roman(k + 1)), text);
        b.addEventListener('click', () => { sel = k; render(); });
        el.findings.appendChild(b);
      });
      const f = F[sel];
      el.detail.hidden = false;
      el.detail.innerHTML = '';
      el.detail.appendChild(h('p', 'taste__detail-ev', `${f.strength} — ${f.evidence}`));
      if (f.terms.length) {
        const dl = h('dl', 'taste__terms');
        f.terms.forEach((t) => { const d = h('div'); d.append(h('dt', null, t.t), h('dd', null, t.d)); dl.appendChild(d); });
        el.detail.appendChild(dl);
      }
      const r = rel(F, sel);
      if (r) el.detail.appendChild(h('p', 'taste__rel', r));
    } else {
      // no finding yet: the engine's own summary of why (too few judgments, or nothing standing out)
      el.findings.appendChild(h('p', 'taste__note', data.profile.signature.summary));
      el.detail.hidden = true;
    }
    renderTable();
    renderExam();
  }

  function renderTable() {
    const F = data.findings, f = F[sel], W = data.works, lit = med === 'lit';
    el.table.innerHTML = '';
    el.table.classList.toggle('taste__table--phone', phone());
    const sup = f ? W.filter((w) => f.support.includes(w.id)) : W;
    const ag = f ? W.filter((w) => f.against.includes(w.id)) : [];
    const oth = f ? W.filter((w) => !f.support.includes(w.id) && !f.against.includes(w.id)) : [];
    if (phone()) {
      // three strips that scroll sideways
      const vw = innerWidth, stillW = Math.min(300, vw - 80), pS = .56;
      const band = (label, color, list, small) => {
        const b = h('div', 'tband');
        const l = h('p', 'tband__label', label); l.style.color = color; b.appendChild(l);
        const row = h('div', 'tband__row');
        list.forEach((w) => {
          const o = object(w);
          const k = small ? (lit ? .7 : .62) : 1;
          o.style.width = (lit ? Math.round(330 * pS * k) : Math.round(stillW * k)) + 'px';
          o.style.opacity = small ? .5 : 1;
          if (lit) { const pg = o.querySelector('.tobj__page'); pg.style.width = Math.round(330 * pS * k) + 'px'; pg.style.height = Math.round(520 * pS * k) + 'px'; o.querySelector('.tobj__page-in').style.transform = `scale(${pS * k})`; }
          row.appendChild(o);
        });
        b.appendChild(row);
        return b;
      };
      if (f) {
        el.table.append(band('supports', 'var(--graphite)', sup), band(ag.length ? 'contradicts' : 'contradicts — none so far', 'var(--ink)', ag));
        if (oth.length) el.table.appendChild(band('not part of this finding', 'var(--stone)', oth, true));
      } else el.table.appendChild(band('', 'var(--graphite)', sup));
      return;
    }
    // desktop: the works lie on white and re-sort into bands by transform
    const w = lit ? 165 : 240, hgt = lit ? 260 : 177, gap = lit ? 36 : 32, capH = lit ? 48 : 30, othS = .58;
    const width = el.table.clientWidth || 800;
    const cols = Math.max(1, Math.floor((width - 24) / (w + gap)));
    const colsS = Math.max(1, Math.floor((width - 24) / (w * othS + 28)));
    const rowsOf = (n, c) => Math.ceil(n / c);
    const forY = 112;
    const supH = Math.max(1, rowsOf(sup.length, cols)) * (hgt + capH) + Math.max(0, rowsOf(sup.length, cols) - 1) * 40;
    const agY = forY + supH + 76;
    const agH = ag.length ? rowsOf(ag.length, cols) * (hgt + capH) + (rowsOf(ag.length, cols) - 1) * 40 : 0;
    const othY = (ag.length ? agY + agH : agY) + 76;
    const othH = oth.length ? rowsOf(oth.length, colsS) * ((hgt + capH) * othS) + (rowsOf(oth.length, colsS) - 1) * 28 : 0;
    const place = (list, y0, c, step, rowH, s) => list.map((wk, i) => ({ wk, x: 24 + (i % c) * step, y: y0 + Math.floor(i / c) * rowH, s }));
    const placed = new Map();
    place(sup, forY, cols, w + gap, hgt + capH + 40, 1).forEach((p) => placed.set(p.wk.id, { ...p, op: 1, z: 2, capOp: 1 }));
    place(ag, agY, cols, w + gap, hgt + capH + 40, 1).forEach((p) => placed.set(p.wk.id, { ...p, op: 1, z: 2, capOp: 1 }));
    place(oth, othY, colsS, w * othS + 28, (hgt + capH) * othS + 28, othS).forEach((p) => placed.set(p.wk.id, { ...p, op: .34, z: 1, capOp: 0 }));
    if (f) {
      [{ text: 'supports', y: forY - 32, color: 'var(--graphite)' },
        { text: ag.length ? 'contradicts' : 'contradicts — none so far', y: (ag.length ? agY : agY - 20) - 32, color: 'var(--ink)' },
        { text: oth.length ? 'not part of this finding' : '', y: othY - 28, color: 'var(--stone)' }].forEach((l) => {
        const d = h('div', 'tlabel', l.text); d.style.color = l.color; d.style.transform = `translateY(${l.y}px)`; el.table.appendChild(d);
      });
    }
    W.forEach((wk, i) => {
      const p = placed.get(wk.id);
      const o = object(wk);
      o.style.width = w + 'px';
      o.style.transform = `translate(${p.x}px,${p.y}px) rotate(${ROT[i % ROT.length]}deg) scale(${p.s})`;
      o.style.opacity = p.op; o.style.zIndex = p.z;
      o.lastElementChild.style.opacity = p.capOp;
      el.table.appendChild(o);
    });
    el.table.style.height = Math.max(othY + othH, agY + agH) + 64 + 'px';
  }

  function renderExam() {
    const w = exam && data && !data.empty ? data.byId.get(exam) : null;
    el.exam.hidden = !w;
    el.exam.innerHTML = '';
    if (!w) return;
    const lit = med === 'lit';
    const close = h('div', 'taste__exam-close');
    const a = h('a', 'textlink textlink--nav', 'Close'); a.href = '#taste';
    a.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); exam = null; renderExam(); });
    close.appendChild(a); el.exam.appendChild(close);
    if (!lit) {
      const print = h('div', 'taste__exam-print'), frame = h('div', 'tobj__frame');
      const img = document.createElement('img'); img.src = w.file; img.alt = w.alt; img.draggable = false;
      frame.appendChild(img); print.appendChild(frame); el.exam.appendChild(print);
    } else {
      const s = phone() ? Math.min(1.1, (innerWidth - 40) / 330, (innerHeight - 220) / 520) : 1.1;
      const pg = h('div', 'taste__exam-page'), inner = h('div', 'tobj__page-in');
      pg.style.width = Math.round(330 * s) + 'px'; pg.style.height = Math.round(520 * s) + 'px';
      inner.style.transform = `scale(${s})`;
      inner.appendChild(Pallas.book.flatPage(w.entry, w.vote === 'dislike', w.vote === 'like'));
      pg.appendChild(inner); el.exam.appendChild(pg);
    }
    const text = h('div', 'taste__exam-text');
    text.appendChild(h('p', 'taste__exam-cap', caption(w)));
    data.findings.forEach((g, k) => {
      if (g.support.includes(w.id)) text.appendChild(h('p', null, `supports ${roman(k + 1)} ${g.title}`));
      else if (g.against.includes(w.id)) text.appendChild(h('p', null, `contradicts ${roman(k + 1)} ${g.title}`));
    });
    el.exam.appendChild(text);
  }

  async function show(m) {
    med = m; sel = 0; exam = null;
    const t = ++token;
    try { data = await load(m); } catch (err) { console.error(err); data = { empty: true }; }
    if (t !== token) return;
    render();
  }
  el.exam.addEventListener('click', () => { exam = null; renderExam(); });
  el.sw.addEventListener('click', (e) => { if (e.target.closest('a')) e.target.closest('a').blur(); });
  addEventListener('resize', () => { if (active && data && !data.empty) { renderTable(); renderExam(); } });
  addEventListener('pallas:route', (e) => {
    active = !!e.detail.isTaste;
    if (!active) { exam = null; return; }
    const q = e.detail.query.get('m');
    show(q === 'lit' ? 'lit' : 'film');
  });
  // the screen may already be the route when this deferred script runs
  if (location.hash.split('?')[0] === '#taste') { active = true; show(new URLSearchParams(location.hash.split('?')[1] || '').get('m') === 'lit' ? 'lit' : 'film'); }
  Pallas.tasteScreen = { show, get medium() { return med; } };
})();
