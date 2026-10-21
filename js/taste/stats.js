/* pallas taste engine — statistics. Pure functions, no dependencies, deterministic.
   Loads in the browser as Pallas.taste.stats and in Node via require(). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.Pallas = root.Pallas || {}; root.Pallas.taste = root.Pallas.taste || {}; root.Pallas.taste.stats = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // log(n!) by summation, cached. Exact enough for the table sizes Pallas sees (a few thousand judgments).
  const LF = [0];
  function logFactorial(n) {
    for (let i = LF.length; i <= n; i++) LF[i] = LF[i - 1] + Math.log(i);
    return LF[n];
  }
  const logChoose = (n, k) => (k < 0 || k > n ? -Infinity : logFactorial(n) - logFactorial(k) - logFactorial(n - k));

  /* Fisher's exact test for a 2×2 table
         [ a  b ]   a = liked with the feature,    b = disliked with the feature
         [ c  d ]   c = liked without the feature, d = disliked without the feature
     Returns the two-sided p-value: the probability, with the margins fixed, of a table at least as extreme
     (no more probable) than the one observed. */
  function fisherExact(a, b, c, d) {
    const r1 = a + b, c1 = a + c, n = a + b + c + d;
    const lo = Math.max(0, r1 + c1 - n), hi = Math.min(r1, c1);
    const logP = (x) => logChoose(c1, x) + logChoose(n - c1, r1 - x) - logChoose(n, r1);
    const pObs = logP(a);
    let p = 0;
    for (let x = lo; x <= hi; x++) { const lp = logP(x); if (lp <= pObs + 1e-7) p += Math.exp(lp); }
    return Math.min(1, p);
  }

  // Wilson score interval for k successes in n trials (95% by default). Honest at small n, unlike k/n ± 1.96·se.
  function wilson(k, n, z = 1.959964) {
    if (!n) return [0, 1];
    const p = k / n, z2 = z * z, den = 1 + z2 / n;
    const mid = (p + z2 / (2 * n)) / den;
    const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / den;
    return [Math.max(0, mid - half), Math.min(1, mid + half)];
  }

  // Benjamini–Hochberg adjusted p-values (q-values), same order as the input. Controls the false discovery rate
  // when many features are tested at once.
  function benjaminiHochberg(ps) {
    const m = ps.length;
    const order = ps.map((p, i) => [p, i]).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    const q = new Array(m);
    let run = 1;
    for (let r = m - 1; r >= 0; r--) { run = Math.min(run, (order[r][0] * m) / (r + 1)); q[order[r][1]] = Math.min(1, run); }
    return q;
  }

  // Shannon entropy of a count map, normalised to 0–1 by the number of categories available.
  function normalisedEntropy(counts, categories) {
    const vals = Object.values(counts).filter((v) => v > 0), total = vals.reduce((s, v) => s + v, 0);
    if (!total || categories < 2) return 0;
    const h = -vals.reduce((s, v) => s + (v / total) * Math.log(v / total), 0);
    return Math.abs(h / Math.log(categories));
  }

  // Complementary error function (Abramowitz & Stegun 7.1.26, |error| < 1.5e-7).
  function erfc(x) {
    const z = Math.abs(x), t = 1 / (1 + 0.3275911 * z);
    const y = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-z * z);
    return x >= 0 ? y : 2 - y;
  }
  const chi2p1 = (x) => (x <= 0 ? 1 : erfc(Math.sqrt(x / 2)));   // upper tail of chi-square with 1 degree of freedom

  /* Cochran–Mantel–Haenszel test: is there an association in 2×2 tables [a b; c d] once a third factor (the strata)
     is held constant? Used to ask whether one characteristic still matters among works with and without another.
     Returns { chi2, p, oddsRatio } with Yates continuity correction; p = 1 when no stratum is informative. */
  function cmh(strata) {
    let num = 0, varSum = 0, orN = 0, orD = 0;
    for (const [a, b, c, d] of strata) {
      const n = a + b + c + d;
      if (n < 2) continue;
      const r1 = a + b, r2 = c + d, c1 = a + c, c2 = b + d;
      num += a - (r1 * c1) / n;
      varSum += (r1 * r2 * c1 * c2) / (n * n * (n - 1));
      orN += (a * d) / n; orD += (b * c) / n;
    }
    if (varSum <= 0) return { chi2: 0, p: 1, oddsRatio: null };
    const chi2 = Math.max(0, Math.abs(num) - 0.5) ** 2 / varSum;
    return { chi2, p: chi2p1(chi2), oddsRatio: orD ? orN / orD : null };
  }

  const round = (x, dp = 3) => Math.round(x * 10 ** dp) / 10 ** dp;

  return { logFactorial, logChoose, fisherExact, wilson, benjaminiHochberg, normalisedEntropy, erfc, chi2p1, cmh, round };
});
