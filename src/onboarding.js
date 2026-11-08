// A short, stable in-frame check; no gesture or range calibration required.
export class Onboarding {
  constructor() { this.hold=0; this.done=false; }
  update(dt, pose, now) {
    const k=Object.fromEntries((pose?.keypoints||[]).map(p=>[p.name,p]));
    const seen=n=>{const p=k[n];return p && p.score>=.4 && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x>.04 && p.x<.96 && p.y>.04 && p.y<.96;};
    const visible=!!pose && now-pose.t<500 && ['nose','left_shoulder','right_shoulder'].every(seen) && (seen('left_wrist')||seen('right_wrist'));
    const centered=visible && Math.abs((k.left_shoulder.x+k.right_shoulder.x)/2-.5)<.18;
    this.hold=centered ? Math.min(1.2,this.hold+Math.max(0,Math.min(dt,.1))) : 0;
    this.done ||= this.hold>=1.2;
    return {visible,centered,progress:this.hold/1.2,done:this.done,
      message:!visible?'Keep your head, shoulders and one hand in view.':!centered?'Move into the center of the frame.':'Looking good — starting…'};
  }
}
