/* Cultural Capital — About. Ported from Cultural Capital About.dc.html (Claude Design) at its default props
   (aboutFont "pairing", emphasis "cobalt", cta "stacked", brandOutline false).
   One 600vh stage with a sticky 100vh view; y is the stage's scroll in viewport heights:
   the statement types on load and leaves from y .15; section 2 reveals word by word from y .55 and leaves from 1.65;
   section 3 from y 2, its keywords settling to cobalt from scale 1.34; "Work with us" arrives from y 4.05,
   and once it is more than half in the page turns cobalt. */
(function () {
  'use strict';
  var CC = window.CulturalCapital, c01 = CC.c01, ease = CC.ease, reduced = CC.reduced;

  var LINE = 'Culture is not a spectator sport.';
  var P2_LINES = [
    'Cultural Capital is an exploration of the people, technologies, and creations that shape how culture is made, experienced, and transformed.',
    "We don't just articulate culture.",
    'We participate in its making.'
  ];
  var P3_LINES = [
    'The human experience cannot be contained in a single form.',
    'It is connection. It is commerce.',
    'Objects, media, and art.',
    'Governance and philosophy.',
    'Cultural Capital moves between these worlds, inviting you to explore what emerges at their intersections.'
  ];
  var KEYWORDS = ['connection', 'commerce', 'Objects', 'media', 'art', 'Governance', 'philosophy'];
  var COBALT = [46, 91, 214];

  var root = document.documentElement;
  var stage = document.getElementById('about-stage');
  var in1 = document.getElementById('about-1'), in2 = document.getElementById('about-2'), in3 = document.getElementById('about-3'), in4 = document.getElementById('about-4');
  var cta = document.getElementById('about-cta'), ctaRule = document.getElementById('about-cta-rule');

  function span(text, attrs) {
    var s = document.createElement('span');
    s.textContent = text;
    s.setAttribute('aria-hidden', 'true');
    if (attrs) for (var k in attrs) s.setAttribute(k, attrs[k]);
    return s;
  }
  function lineEl() { var l = document.createElement('span'); l.className = 'about-text__line'; return l; }

  // Section 2: one span per word (the space travels with the word).
  P2_LINES.forEach(function (line) {
    var l = lineEl(), words = line.split(' ');
    words.forEach(function (w, i) { l.appendChild(span(w + (i < words.length - 1 ? ' ' : ''), { 'data-w': '' })); });
    in2.appendChild(l);
  });
  // Section 3: keywords are their own inline-block spans, trailing punctuation a separate span.
  var kIndex = 0;
  P3_LINES.forEach(function (line) {
    var l = lineEl(), toks = line.split(' ');
    toks.forEach(function (tok, j) {
      var sp = j < toks.length - 1 ? ' ' : '';
      var m = tok.match(/^([A-Za-z]+)([^A-Za-z]*)$/);
      if (!m || KEYWORDS.indexOf(m[1]) < 0) { l.appendChild(span(tok + sp, { 'data-w': '' })); return; }
      l.appendChild(span(m[1], { 'data-w': '', 'data-k': String(kIndex++) }));
      if (m[2]) l.appendChild(span(m[2], { 'data-w': '' }));
      if (sp) l.appendChild(document.createTextNode(sp));
    });
    in3.appendChild(l);
  });
  var words2 = in2.querySelectorAll('[data-w]'), words3 = in3.querySelectorAll('[data-w]');

  // The statement types once, 400 ms after load, one character every 70 ms.
  var setLine = CC.typed(in1, LINE, true), n = 0, iv;
  if (reduced) setLine(LINE.length);
  else setTimeout(function () {
    iv = setInterval(function () { if (n >= LINE.length) { clearInterval(iv); return; } setLine(++n); }, 70);
  }, 400);

  function exit(el, e) {
    if (reduced) { el.style.opacity = e >= 0.5 ? '0' : '1'; return; }
    e = ease(c01(e));
    el.style.opacity = (1 - e).toFixed(3);
    el.style.transform = 'scale(' + (1 - 0.14 * e).toFixed(4) + ')';
  }
  function reveal(ws, r, tail, cobalt, ramp) {
    ramp = ramp || 4;
    var N = ws.length, KD = ramp === 1 ? 4 : 0, starts = [], total = 0, i;
    for (i = 0; i < N; i++) { starts.push(total); total += KD && ws[i].hasAttribute('data-k') ? KD : 1; }
    var pos = (reduced ? 1 : r) * (total + tail);
    for (i = 0; i < N; i++) {
      var el = ws[i], t0 = starts[i];
      var o = c01((pos - t0) / ramp);
      el.style.opacity = o.toFixed(3);
      if (cobalt && el.hasAttribute('data-k')) {
        var s = ease(c01((pos - t0 - 0.6) / (KD - 0.9)));
        el.style.color = 'rgb(' + COBALT.map(function (c) { return Math.round(255 + (c - 255) * s); }).join(',') + ')';
        el.style.transform = 'scale(' + (1.34 - 0.34 * s).toFixed(4) + ')';
      }
    }
  }

  var light;
  function setLight(on) {
    light = on;
    root.classList.toggle('is-light', on);
  }

  function update() {
    var y = Math.max(0, -stage.getBoundingClientRect().top / window.innerHeight);
    exit(in1, (y - 0.15) / 0.45);
    reveal(words2, c01((y - 0.55) / 0.9), 4);
    exit(in2, (y - 1.65) / 0.4);
    reveal(words3, c01((y - 2.0) / 1.5), 2, true, 1);
    exit(in3, (y - 3.7) / 0.4);
    var k = reduced ? (y > 3.9 ? 1 : 0) : ease(c01((y - 4.05) / 0.45));
    in4.style.opacity = k.toFixed(3);
    in4.style.pointerEvents = k > 0.5 ? 'auto' : 'none';
    in4.style.transform = reduced ? '' : 'scale(' + (0.94 + 0.06 * k).toFixed(4) + ')';
    if (k > 0.5 !== light) setLight(k > 0.5);
    ctaRule.style.transform = 'scaleX(' + (reduced ? (k > 0.5 ? 1 : 0) : ease(c01((y - 4.5) / 0.3))).toFixed(4) + ')';
  }

  // "Work with us" on one line, or stacked Work / with / us when narrow; sized to fill the width.
  var narrow;
  function renderCta() {
    var nw = CC.narrow();
    if (nw === narrow) return;
    narrow = nw;
    while (cta.firstChild !== ctaRule) cta.removeChild(cta.firstChild);
    (nw ? ['Work', 'with', 'us'] : ['Work with us']).forEach(function (ln) {
      var s = span(ln); s.className = 'about-cta__line-text';
      cta.insertBefore(s, ctaRule);
    });
  }
  function fitCta() {
    cta.style.fontSize = '100px';
    var w = cta.offsetWidth, target = in4.clientWidth, lines = narrow ? 3 : 1;
    if (!w || !target) return;
    var availH = window.innerHeight - 110 - 40 - 64;
    cta.style.fontSize = Math.max(32, Math.min(100 * target / w, availH / (lines * 0.86))).toFixed(1) + 'px';
  }
  function refit() { renderCta(); fitCta(); update(); }

  // Keyboard focus can reach "Work with us" while it is still invisible (the stage only shows it near its end):
  // bring the stage to its end, where the design's own jump to the CTA lands, so the focused link is on screen.
  cta.addEventListener('focus', function () {
    if (light) return;
    window.scrollTo(0, stage.getBoundingClientRect().bottom + window.scrollY - window.innerHeight - 4);
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', refit);
  refit();
  requestAnimationFrame(refit);
  if (document.fonts) {
    document.fonts.ready.then(refit);
    document.fonts.load('600 100px Archivo').then(refit, function () {});
    document.fonts.addEventListener('loadingdone', refit);
  }
  if (window.ResizeObserver) {
    var roRaf;
    new ResizeObserver(function () { cancelAnimationFrame(roRaf); roRaf = requestAnimationFrame(refit); }).observe(in4);
  }
})();
