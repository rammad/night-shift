import { TUNING } from './tuning.js';

// One-handed reach: each hand gets its own box of space out beside its own shoulder, sized by
// shoulder width (so it scales with how far you stand), and that box maps onto the WHOLE desk.
// Your right hand never has to cross your body to reach the left of the screen.
// Input keypoints are camera space (0..1, not mirrored). Output is desk space (0..1, mirrored so
// your right hand is on the right).
const R = TUNING.reach;
const OK = p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && (p.score ?? 1) >= R.minScore;

export class ReachMapper {
  constructor() { this.reset(); }
  reset() { this.anchor = { left: null, right: null }; this.sw = null; }

  // Follow the shoulders slowly, so the boxes stay put while you move your hands.
  update(kp, dt) {
    const ls = kp.left_shoulder, rs = kp.right_shoulder;
    if (!OK(ls) || !OK(rs)) return;
    const sw = Math.max(R.minShoulder, Math.abs(ls.x - rs.x));
    const a = this.sw == null ? 1 : 1 - Math.exp(-Math.max(0, dt) / R.follow);
    this.sw = this.sw == null ? sw : this.sw + (sw - this.sw) * a;
    for (const [side, s, dir] of [['left', ls, -1], ['right', rs, 1]]) {
      const target = { x: (1 - s.x) + dir * R.out * this.sw, y: s.y + R.down * this.sw };
      const A = this.anchor[side];
      this.anchor[side] = A ? { x: A.x + (target.x - A.x) * a, y: A.y + (target.y - A.y) * a } : target;
    }
  }
  // Camera-space hand point → desk space. Before shoulders are seen, falls back to plain mirroring.
  toDesk(side, p) {
    const A = this.anchor[side];
    if (!A || !this.sw) return { x: 1 - p.x, y: p.y };
    return { x: .5 + ((1 - p.x) - A.x) / (R.spanX * this.sw), y: .5 + (p.y - A.y) / (R.spanY * this.sw) };
  }
  // The reach boxes in mirrored camera space, for the camera panel.
  boxes() {
    if (!this.sw) return null;
    const b = (A, side) => { const w=R.spanX*this.sw, h=R.spanY*this.sw; return A && {x:A.x-w/2,y:A.y-h/2,w,h}; };
    return { left: b(this.anchor.left,'left'), right: b(this.anchor.right,'right') };
  }
}
