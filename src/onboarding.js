// Camera-space readiness; independent of drunken gameplay coordinates.
export class Onboarding {
  constructor() { this.hold = 0; this.done = false; this.phase = 'ready'; this.side = null; this.elapsed = 0; this.bounds = null; this.calibration = null; }
  update(dt, pose, now) {
    const k = Object.fromEntries((pose?.keypoints || []).map(p => [p.name, p]));
    const names = ['nose', 'left_shoulder', 'right_shoulder'];
    const visible = !!pose && now - pose.t < 500 && names.every(n => {
      const p = k[n]; return p && p.score >= .4 && p.x > .04 && p.x < .96 && p.y > .04 && p.y < .96;
    });
    const handVisible = side => { const p = k[side + '_wrist']; return p && p.score >= .4 && p.x > .04 && p.x < .96 && p.y > .04 && p.y < .96; };
    const hasHand = handVisible('left') || handVisible('right');
    const mid = visible ? (k.left_shoulder.x + k.right_shoulder.x) / 2 : 0;
    const centered = visible && hasHand && Math.abs(mid - .5) < .18;
    const raised = centered && ((handVisible('left') && k.left_wrist.y < k.left_shoulder.y) || (handVisible('right') && k.right_wrist.y < k.right_shoulder.y));
    this.hold = raised ? Math.min(1.2, this.hold + Math.max(0, Math.min(dt, .1))) : 0;
    if (this.phase === 'ready' && this.hold >= 1.2) {
      this.side = handVisible('right') && k.right_wrist.y < k.right_shoulder.y ? 'right' : 'left';
      this.phase = 'reach'; this.hold = 0;
    }
    if (this.phase === 'reach' && centered && handVisible(this.side)) {
      const p = k[this.side + '_wrist'], shoulder = k[this.side + '_shoulder'];
      const sw = Math.max(.04, Math.abs(k.left_shoulder.x - k.right_shoulder.x));
      const x = (shoulder.x - p.x) / sw, y = (p.y - shoulder.y) / sw;
      this.bounds ||= { minX:x, maxX:x, minY:y, maxY:y };
      const b = this.bounds;
      b.minX = Math.min(b.minX,x); b.maxX = Math.max(b.maxX,x);
      b.minY = Math.min(b.minY,y); b.maxY = Math.max(b.maxY,y);
      this.elapsed += Math.max(0,Math.min(dt,.1));
      if (this.elapsed >= 4 && b.maxX-b.minX >= .6 && b.maxY-b.minY >= .6) {
        this.calibration = { side:this.side, cx:(b.minX+b.maxX)/2, cy:(b.minY+b.maxY)/2,
          w:Math.max(.65,Math.min(2.2,(b.maxX-b.minX)*.9)), h:Math.max(.65,Math.min(2,(b.maxY-b.minY)*.9)) };
        this.done = true;
      }
    }
    return { visible: visible && hasHand, centered, raised, progress: this.phase === 'reach' ? Math.min(.95, this.elapsed / 4) : this.hold / 1.2, done: this.done,
      message: this.phase === 'reach' && centered ? 'Calibration: sweep the same hand left, right, up and down comfortably.' : !visible || !hasHand ? 'Step back until your head, shoulders and one hand are in view.' : !centered ? 'Move into the center of the frame.' : raised ? 'Looking good — hold one hand up…' : 'You’re centered! Raise one hand to continue.' };
  }
}
