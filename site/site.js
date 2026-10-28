/* Cultural Capital site — shared behaviour (window.CulturalCapital).
   The header shrinks once the page has scrolled past 24 px (brand 20 px, padding space-3), as in the design. */
(function () {
  'use strict';
  var CC = window.CulturalCapital = window.CulturalCapital || {};

  CC.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  CC.narrow = function () { return window.innerWidth < 720; };   // the design's only breakpoint
  CC.c01 = function (v) { return Math.min(1, Math.max(0, v)); };
  CC.ease = function (k) { return 1 - Math.pow(1 - k, 2); };

  // A typed line: [shown text][caret][the rest, hidden], so the layout never moves while it types.
  CC.typed = function (el, text, withCaret) {
    el.textContent = '';
    var a = document.createElement('span'), b = document.createElement('span');
    a.setAttribute('aria-hidden', 'true'); b.setAttribute('aria-hidden', 'true');
    b.style.visibility = 'hidden';
    el.appendChild(a);
    if (withCaret) { var c = document.createElement('span'); c.className = 'cc-caret'; c.setAttribute('aria-hidden', 'true'); el.appendChild(c); }
    el.appendChild(b);
    var last = -1;
    return function (n) {
      if (n === last) return;
      last = n;
      a.textContent = text.slice(0, n);
      b.textContent = text.slice(n);
    };
  };

  var header = document.querySelector('.cc-header'), scrolled;
  function onScroll() {
    var s = (window.scrollY || document.documentElement.scrollTop) > 24;
    if (s === scrolled || !header) return;
    scrolled = s;
    header.classList.toggle('is-scrolled', s);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
