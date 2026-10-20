/* pallas — votes, keyed by stable still and excerpt ids, kept in localStorage. A re-vote overwrites. */
window.Pallas = window.Pallas || {};
(() => {
  const KEY = 'pallas.votes';
  const votes = { c: {}, l: {} };   // c: film stills, l: literature entries
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    Object.assign(votes.c, v.c || {});
    Object.assign(votes.l, v.l || {});
  } catch { /* unreadable store: start empty */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(votes)); } catch { /* private mode: kept for this visit */ } };
  Pallas.votes = {
    get: (area, id) => votes[area][id],
    set(area, id, kind) { votes[area][id] = kind; save(); },
    list: (area, kind) => Object.keys(votes[area]).filter((k) => votes[area][k] === kind),
    all: (area) => ({ ...votes[area] }),
  };
})();
