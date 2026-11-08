import { clamp, lerp, noise } from './util.js';
import { TUNING } from './tuning.js';
const D = TUNING.drunk, mix = ([a, b], L) => lerp(a, b, L);

// Turns raw tracked hand positions into what a drunk office worker's hands actually do:
// a wobbly under-damped spring chasing a drifting target, with body sway and hiccups.
// Level 0 = sober (menus), 4 = blind drunk.
export const MAX_LEVEL = 4;

export class DrunkHands {
  constructor(random = Math.random) {
    this.random = random; this.level = 0; this.time = 0; this.hiccup = 0;
    this.reset();
  }
  reset() { this.state = { left: null, right: null }; }
  setLevel(level) { this.level = clamp(level, 0, MAX_LEVEL); }

  // Body sway shared by both hands and the camera, so the world and the hands lean together.
  sway(t = this.time) {
    const L = this.level / MAX_LEVEL;
    const a = mix(D.sway, L);
    return { x: noise(t * .35, 9) * a + Math.sin(t * .9) * a * .5, y: noise(t * .3, 11) * a * .6 };
  }

  update(dt, raw) {
    dt = clamp(Number.isFinite(dt) ? dt : 0, 0, .1);
    this.time += dt;
    const L = this.level / MAX_LEVEL;
    const sway = this.sway();
    const w = mix(D.stiffness, L), zeta = mix(D.damping, L);
    const drift = mix(D.drift, L), dfreq = mix(D.driftSpeed, L);
    // Hiccups: rare upward jolt of both hands. More frequent when drunker.
    let jolt = 0;
    if (L > 0 && this.random() < dt * D.hiccupsPerSec * this.level) { jolt = -(1.2 + this.random() * 1.6); this.hiccup = .35; }
    this.hiccup = Math.max(0, this.hiccup - dt);
    const out = {};
    for (const k of ['left', 'right']) {
      const r = raw[k] && Number.isFinite(raw[k].x) && Number.isFinite(raw[k].y) ? raw[k] : (this.state[k] && Number.isFinite(this.state[k].x) ? this.state[k] : { x: .5, y: .7 });
      let s = this.state[k];
      // A bad value must never stick: NaN in a spring stays NaN forever.
      if (!s || ![s.x, s.y, s.vx, s.vy].every(Number.isFinite)) s = this.state[k] = { x: r.x, y: r.y, vx: 0, vy: 0 };
      const seed = k === 'left' ? 1 : 2;
      const tx = r.x + sway.x + noise(this.time * dfreq, seed) * drift;
      const ty = r.y + sway.y + noise(this.time * dfreq * .85, seed + 4) * drift * .8;
      s.vy += jolt;
      const steps = Math.max(1, Math.ceil(dt * 240)), h = dt / steps;
      for (let i = 0; i < steps; i++) {
        s.vx += (w * w * (tx - s.x) - 2 * zeta * w * s.vx) * h;
        s.vy += (w * w * (ty - s.y) - 2 * zeta * w * s.vy) * h;
        s.x += s.vx * h; s.y += s.vy * h;
      }
      s.x = clamp(s.x, -.05, 1.05); s.y = clamp(s.y, -.05, 1.05);
      out[k] = { x: s.x, y: s.y, vx: s.vx, vy: s.vy };
    }
    return out;
  }
}
