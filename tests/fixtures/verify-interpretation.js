// Re-derives every claim of an interpretation from the judgments and the library. Used by tests and the examples tool.
const { fisherExact } = require('../../works/pallas/js/taste/stats.js');
function verify(interp, { library, judgments }) {
  const items = library.items, failures = [];
  const judged = Object.keys(judgments).filter((id) => items[id] && (judgments[id] === 'like' || judgments[id] === 'dislike'));
  const has = (id, f) => items[id].features.includes(f);
  let claims = 0, examples = 0;
  for (const s of interp.sections) for (const c of s.claims) {
    claims++;
    const ch = c.check;
    if (ch.type === 'rates') for (const f of ch.features) {
      const e = judged.filter((id) => has(id, f.feature)), k = e.filter((id) => judgments[id] === 'like').length;
      if (e.length !== f.exposed || k !== f.liked) failures.push(`${s.id}: ${f.feature} is ${k}/${e.length}, claim says ${f.liked}/${f.exposed}`);
    }
    if (ch.type === 'within') {
      const inA = judged.filter((id) => has(id, ch.a)), w = inA.filter((id) => has(id, ch.b)), wo = inA.filter((id) => !has(id, ch.b));
      const k1 = w.filter((id) => judgments[id] === 'like').length, k2 = wo.filter((id) => judgments[id] === 'like').length;
      if (k1 !== ch.with[0] || w.length !== ch.with[1] || k2 !== ch.without[0] || wo.length !== ch.without[1]) failures.push(`${s.id}: within counts differ`);
      if (fisherExact(k1, w.length - k1, k2, wo.length - k2) >= 0.05) failures.push(`${s.id}: within difference is not significant`);
    }
    if (ch.type === 'joint') {
      const e = judged.filter((id) => has(id, ch.a) && has(id, ch.b)), k = e.filter((id) => judgments[id] === 'like').length;
      if (e.length !== ch.exposed || k !== ch.liked) failures.push(`${s.id}: joint ${ch.a}+${ch.b} is ${k}/${e.length}, claim says ${ch.liked}/${ch.exposed}`);
    }
    if (ch.type === 'overlap') {
      // a and b are the liked works of each strand; each must really be liked, and the overlap must be as stated.
      for (const id of [...ch.a, ...ch.b]) if (judgments[id] !== 'like') failures.push(`${s.id}: strand work ${id} was not liked`);
      const la = new Set(ch.a), lb = ch.b;
      const both = lb.filter((id) => la.has(id)).length, union = new Set([...la, ...lb]).size;
      if (both !== ch.both || union !== ch.union) failures.push(`${s.id}: overlap is ${both}/${union}, claim says ${ch.both}/${ch.union}`);
    }
    for (const id of c.evidence.liked) { examples++; if (judgments[id] !== 'like') failures.push(`${s.id}: ${id} cited as liked but was ${judgments[id] || 'not judged'}`); }
    for (const id of c.evidence.disliked) { examples++; if (judgments[id] !== 'dislike') failures.push(`${s.id}: ${id} cited as disliked but was ${judgments[id] || 'not judged'}`); }
  }
  return { ok: failures.length === 0, claims, examples, failures };
}
module.exports = { verify };
