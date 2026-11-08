// "What the camera sees" panel. The TV only gives us pose keypoints (never video over plain
// http), so we draw the skeleton; with the browser webcam we also show the mirrored video.
// Feed it with window.dockPose = { keypoints: [{ name, x, y, score }], t } (x/y 0..1, camera space).
const BONES = [
  ['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'], ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'], ['left_hip', 'right_hip'], ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'], ['nose', 'left_eye'], ['nose', 'right_eye'],
];
const MIN = .2;

export class CameraPanel {
  constructor(canvas, video, previewOnly = false) {
    this.previewOnly = previewOnly;
    this.pixel = document.createElement('canvas'); this.pixel.width=240; this.pixel.height=135;
    this.pg = this.pixel.getContext('2d');
    this.c = canvas; this.g = canvas.getContext('2d'); this.video = video; this.frames = []; this.lastT = 0;
  }
  draw(now, pose, mirrored = true) {
    const g = this.g, w = this.c.width, h = this.c.height;
    g.fillStyle = '#16131a'; g.fillRect(0, 0, w, h);
    const live = this.video?.srcObject && this.video.readyState >= 2;
    if (this.previewOnly) {
      if (live) {
        const v=this.video, pw=this.pixel.width, ph=this.pixel.height;
        const scale=Math.max(pw/v.videoWidth,ph/v.videoHeight);
        this.pg.drawImage(v,(pw-v.videoWidth*scale)/2,(ph-v.videoHeight*scale)/2,v.videoWidth*scale,v.videoHeight*scale);
        g.save();g.imageSmoothingEnabled=false;g.translate(w,0);g.scale(-1,1);g.drawImage(this.pixel,0,0,w,h);g.restore();
        g.fillStyle='rgba(28,20,36,.08)';for(let y=0;y<h;y+=4)g.fillRect(0,y,w,1);
      } else {
        g.strokeStyle='#b9ad91';g.lineWidth=2;g.strokeRect(w*.25,h*.12,w*.5,h*.76);
        g.fillStyle='#e5d7bc';g.font='16px Silkscreen, monospace';g.textAlign='center';
        g.fillText(window.dockPreviewStatus || 'CAMERA PREVIEW UNAVAILABLE',w/2,h/2);
        g.textAlign='left';
      }
      return;
    }
    if (live) { g.save(); g.translate(w, 0); g.scale(-1, 1); g.globalAlpha = .75; g.drawImage(this.video, 0, 0, w, h); g.restore(); }
    // Each hand's reach box: anywhere inside it maps onto the whole desk.
    const boxes = window.dockReach;
    if (boxes) for (const [side, col] of [['left', 'rgba(59,111,214,.8)'], ['right', 'rgba(224,83,61,.8)']]) {
      const b = boxes[side]; if (!b) continue; g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(b.x * w, b.y * h, b.w * w, b.h * h);
    }
    const fresh = pose && now - pose.t < 600;
    if (pose?.t && pose.t !== this.lastT) { this.frames.push(now); this.lastT = pose.t; }
    this.frames = this.frames.filter(t => now - t < 1000);
    if (fresh) {
      const k = Object.fromEntries(pose.keypoints.map(p => [p.name, p]));
      const P = p => [(mirrored ? 1 - p.x : p.x) * w, p.y * h];
      g.lineWidth = 3; g.lineCap = 'round';
      for (const [a, b] of BONES) {
        const A = k[a], B = k[b]; if (!A || !B || A.score < MIN || B.score < MIN) continue;
        g.strokeStyle = 'rgba(240,232,220,.85)'; g.beginPath(); g.moveTo(...P(A)); g.lineTo(...P(B)); g.stroke();
      }
      // Wrists: the two points the game actually plays with. Mirrored, so your right is on the right.
      for (const [name, col, label] of [['left_wrist', '#3b6fd6', 'L'], ['right_wrist', '#e0533d', 'R']]) {
        const p = k[name]; if (!p) continue;
        const [x, y] = P(p), ok = p.score >= MIN;
        g.fillStyle = ok ? col : 'rgba(150,150,150,.5)'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill();
        g.font = 'bold 12px Silkscreen, monospace'; g.fillText(label + (ok ? '' : '?'), x + 9, y - 6);
      }
    }
    g.font = '11px Silkscreen, monospace'; g.fillStyle = fresh ? '#9fe0a8' : '#e08a7a';
    g.fillText(fresh ? `CAMERA · ${this.frames.length} fps` : 'CAMERA · no body seen', 8, h - 8);
  }
}
