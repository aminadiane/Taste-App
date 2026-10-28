/* Cultural Capital — Home. Ported from Cultural Capital Home.dc.html (Claude Design):
   the statement types with the scroll through its 320vh section, then settles to scale .38;
   the television's screen powers on and types "Judgement begets taste." / "Build yours" as it scrolls in. */
(function () {
  'use strict';
  var CC = window.CulturalCapital, c01 = CC.c01, reduced = CC.reduced;

  var TEXT = 'An evolving world of ideas, design, technology, and experiences.';
  var TV_LINES = ['Judgement begets taste.', 'Build yours'];
  var TV_FULL = TV_LINES.join('').length;

  var intro = document.getElementById('home-intro');
  var statement = document.getElementById('home-statement');
  var tv = document.getElementById('home-tv');
  var glow = document.getElementById('home-tv-glow');
  var tvText = document.getElementById('home-tv-text');
  var setStatement = CC.typed(statement, TEXT, true);

  // Each screen line: [typed][cursor?][rest, hidden].
  var lines = TV_LINES.map(function (ln) {
    var row = document.createElement('div'), a = document.createElement('span'), cur = document.createElement('span'), b = document.createElement('span');
    row.className = 'tv__line';
    cur.className = 'tv__cursor';
    b.style.visibility = 'hidden';
    row.appendChild(a); row.appendChild(cur); row.appendChild(b);
    tvText.appendChild(row);
    return { text: ln, a: a, cur: cur, b: b };
  });
  var tvN = -1;
  function renderTV(n) {
    if (n === tvN) return;
    tvN = n;
    var rem = n, last = lines.length - 1;
    lines.forEach(function (ln, i) {
      var len = ln.text.length, k = Math.max(0, Math.min(len, rem));
      rem -= len;
      var showCur = n > 0 && (k < len || i === last) && (i === 0 ? true : n > lines[0].text.length);
      ln.a.textContent = ln.text.slice(0, k);
      ln.b.textContent = ln.text.slice(k);
      ln.cur.style.display = showCur && (k < len || i === last) && (i === last || k < len) ? '' : 'none';
    });
  }

  function onIntro() {
    var r = intro.getBoundingClientRect();
    var span = Math.max(1, r.height - window.innerHeight);
    var p = c01(-r.top / span);
    var n = reduced ? TEXT.length : Math.round(Math.min(1, p / 0.62) * TEXT.length);
    setStatement(n);
    var k = c01((p - 0.72) / 0.28), e = 1 - Math.pow(1 - k, 3);
    statement.style.transform = 'scale(' + (1 - 0.62 * e).toFixed(4) + ')';
  }

  function onTV() {
    var r = tv.getBoundingClientRect(), vh = window.innerHeight;
    var p = c01((vh * 0.55 - r.top) / Math.max(160, r.height - vh * 0.3));
    var k = reduced ? 1 : Math.min(1, p / 0.14);
    renderTV(reduced ? TV_FULL : Math.round(c01((p - 0.18) / 0.7) * TV_FULL));
    glow.style.opacity = k > 0 ? '1' : '0';
    glow.style.transform = 'scaleY(' + (0.015 + 0.985 * Math.pow(k, 0.6)).toFixed(4) + ')';
    glow.style.filter = 'brightness(' + (1 + (1 - k) * 2.2).toFixed(3) + ')';
  }

  function onScroll() { onIntro(); onTV(); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
