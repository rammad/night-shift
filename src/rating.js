// Balanced against a full round's achievable output; misses already reduce points.
const TARGETS = { stamp: 1000, copy: 800, staple: 400 };
export function shiftRating(results) {
  const target = results.reduce((sum, r) => sum + (TARGETS[r.key] || 0), 0);
  const points = results.reduce((sum, r) => sum + Math.max(0, Number(r.points) || 0), 0);
  const ratio = target ? points / target : 0;
  return ratio >= .95 ? 'A+' : ratio >= .85 ? 'A' : ratio >= .7 ? 'B' : ratio >= .5 ? 'C' : ratio >= .3 ? 'D' : 'F';
}
