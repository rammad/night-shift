// Small shared math helpers. No DOM, no three.js: safe to import from tests.
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, vx: ((a.vx || 0) + (b.vx || 0)) / 2, vy: ((a.vy || 0) + (b.vy || 0)) / 2 });
export const speed = h => Math.hypot(h.vx || 0, h.vy || 0);

export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// Smooth 1D value noise in [-1, 1].
export function noise(t, seed = 0) {
  const i = Math.floor(t), f = t - i;
  const h = n => { const x = Math.sin((n + seed * 57.13) * 127.1 + seed * 3.7) * 43758.5453; return x - Math.floor(x); };
  const u = f * f * (3 - 2 * f);
  return lerp(h(i), h(i + 1), u) * 2 - 1;
}
