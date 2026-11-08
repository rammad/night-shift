// Hand input sources → raw normalized hands {left,right,valid}. Drunkenness is applied later.
//   mouse   : mouse = right glove; left glove follows a per-game policy (see leftPolicy)
//   camera  : browser webcam + MediaPipe pose (wrists)
//   external: TV pose frames via window.dockInput.push (little-bridge.js)
import { ReachMapper } from './reach.js';
const clamp = v => Math.max(0, Math.min(1, v));
// MediaPipe landmark index → COCO-style name (only the ones the camera panel draws).
const MP_NAMES = []; Object.entries({ 0: 'nose', 2: 'left_eye', 5: 'right_eye', 11: 'left_shoulder', 12: 'right_shoulder', 13: 'left_elbow', 14: 'right_elbow', 15: 'left_wrist', 16: 'right_wrist', 23: 'left_hip', 24: 'right_hip', 25: 'left_knee', 26: 'right_knee', 27: 'left_ankle', 28: 'right_ankle' }).forEach(([k, v]) => { MP_NAMES[k] = v; });

// Smoothing for noisy pose wrists: calm jitter, quick on deliberate swings.
export class TrackedHands {
  constructor() { this.reset(); }
  reset() { this.target = null; this.filtered = null; this.lastInput = -Infinity; this.pendingReset = true; }
  push(frame, now) {
    const validHand = k => frame?.[k] && Number.isFinite(frame[k].x) && Number.isFinite(frame[k].y);
    if (!['left', 'right'].some(validHand)) return false;
    const available = validHand('right') ? frame.right : frame.left;
    frame = { left: validHand('left') ? frame.left : (this.target?.left || available), right: validHand('right') ? frame.right : available };
    if (now - this.lastInput >= 500) this.pendingReset = true;
    this.target = { left: { x: clamp(frame.left.x), y: clamp(frame.left.y) }, right: { x: clamp(frame.right.x), y: clamp(frame.right.y) } };
    this.lastInput = now; return true;
  }
  sample(now, dt) {
    const valid = !!this.target && now - this.lastInput < 500;
    if (valid) {
      if (this.pendingReset) { this.filtered = structuredClone(this.target); this.pendingReset = false; }
      else for (const k of ['left', 'right']) {
        const c = this.filtered[k], t = this.target[k];
        const d = Math.hypot(t.x - c.x, t.y - c.y), tau = .12 - .065 * Math.min(1, d / .3);
        const a = 1 - Math.exp(-Math.max(0, dt) / tau);
        c.x += (t.x - c.x) * a; c.y += (t.y - c.y) * a;
      }
    } else this.pendingReset = true;
    const f = this.filtered ?? { left: { x: .3, y: .7 }, right: { x: .7, y: .7 } };
    return { left: { ...f.left }, right: { ...f.right }, valid };
  }
}

export class Input {
  constructor(stage, video) {
    this.stage = stage; this.video = video; this.mode = 'mouse'; this.tracked = new TrackedHands();
    this.mouse = { x: .86, y: .86 }; this.left = { x: .14, y: .86 }; this.freeze = false; this.space = false; this.leftPolicy = 'mirror';
    this.map = p => p; // mouse screen point → desk space (set by main)
    this.reach = new ReachMapper(); this.lastPoseAt = 0;
    this.pose = null; this.stream = null; this.lastDetect = 0; this.lastVideoTime = -1; this.onStatus = () => {};
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      this.mouse = { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) };
      this.freeze = e.shiftKey || (e.buttons & 2) === 2;
    });
    stage.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('keydown', e => {
      if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); this.space = true; }
      if (e.key === 'Shift') this.freeze = true;
      const m = { ArrowLeft: [-.06, 0], ArrowRight: [.06, 0], ArrowUp: [0, -.08], ArrowDown: [0, .08] }[e.key];
      if (m && this.mode === 'mouse') { e.preventDefault(); this.move(...m); }
    });
    window.addEventListener('keyup', e => { if (e.code === 'Space') this.space = false; if (e.key === 'Shift') this.freeze = false; });
    window.addEventListener('blur', () => { this.space = false; this.freeze = false; });
    window.dockInput = { push: frame => { if (this.mode === 'external') this.tracked.push(frame, performance.now()); } };
  }
  move(dx, dy) { this.mouse = { x: clamp(this.mouse.x + dx), y: clamp(this.mouse.y + dy) }; }
  setMode(mode) { if (mode !== 'camera') this.stopCamera(); this.mode = mode; this.tracked.reset(); }

  async startCamera(rate = 30) {
    this.onStatus('Loading camera and pose model…');
    const { PoseLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');
    this.pose ??= await PoseLandmarker.createFromOptions(await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'), {
      baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task' }, runningMode: 'VIDEO', numPoses: 1,
    });
    this.stream ??= await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, frameRate: { ideal: rate, max: 30 } }, audio: false });
    this.video.srcObject = this.stream; await this.video.play();
    this.rate = rate; this.mode = 'camera'; this.tracked.reset(); this.lastVideoTime = -1;
    this.onStatus('Camera ready. Keep both wrists in view.');
  }
  stopCamera() { if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; } if (this.video) this.video.srcObject = null; }

  // Where the mouse-mode left hand goes. 'mirror' | 'park' | 'pin' (rests on a given point).
  mouseLeft(policy, pinY, r) {
    if (this.freeze) return this.left;
    if (policy === 'park') return { x: .1, y: .93 };
    if (policy === 'pin') return pinY && typeof pinY === 'object' ? { ...pinY } : { x: 1 - r.x - .02, y: pinY ?? .6 }; // off-hand pins the given point
    return { x: 1 - r.x, y: r.y };
  }

  sample(now, dt, policy = 'mirror', pinY = .68) {
    if (this.mode === 'camera' && this.stream && this.pose && this.video.readyState >= 2 && now - this.lastDetect > 1000 / (this.rate || 30) && this.video.currentTime !== this.lastVideoTime) {
      this.lastDetect = now; this.lastVideoTime = this.video.currentTime;
      try {
        const p = this.pose.detectForVideo(this.video, now).landmarks[0];
        if (p) {
          const keypoints = MP_NAMES.map((name, j) => name && p[j] ? { name, x: p[j].x, y: p[j].y, score: p[j].visibility ?? 1 } : null).filter(Boolean);
          const k = Object.fromEntries(keypoints.map(q => [q.name, q]));
          window.dockPose = { t: now, keypoints };
          this.reach.update(k, this.lastPoseAt ? (now - this.lastPoseAt) / 1000 : 0); this.lastPoseAt = now;
          window.dockReach = this.reach.boxes();

          this.tracked.push({ left: k.left_wrist.score > .4 ? this.reach.toDesk('left', k.left_wrist) : null, right: k.right_wrist.score > .4 ? this.reach.toDesk('right', k.right_wrist) : null }, now);
        }
      } catch (e) { this.onStatus(e.message); }
    }
    if (this.mode !== 'mouse') return this.tracked.sample(now, dt);
    let right = this.map({ ...this.mouse });
    if (this.space) right = { x: right.x, y: .22 };
    let left = this.mouseLeft(policy, pinY, right);
    if (this.space && !this.freeze && policy !== 'park') left = { x: left.x, y: .22 };
    this.left = { ...left };
    return { left, right, valid: true };
  }
}
