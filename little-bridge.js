import { connect } from './vendor/little.mjs';
import { ReachMapper } from './src/reach.js';

// Little TV integration: tools, TV pose → window.dockInput, lifecycle, persistence.
// The game itself lives in src/ and is reached only through window.dockGame.
const app = connect();
const $ = id => document.getElementById(id);
let enteredGame = false;
let game, hosted = false, entry, stopPose, tracking = false, hostPaused = false, userPaused = false, raised = false;
let poseFrames = 0, acceptedFrames = 0, lastPose = 0, lastSaved = 0, lastState;
const seen = { wrist: 0, elbow: 0, held: 0, left: 0, right: 0, people: 0 }, held = { left: null, right: null };
const POSE_FPS = 30, WRIST_MIN = .2, ELBOW_MIN = .3, HOLD_MS = 1000;
const reach = new ReachMapper(); let lastFrameAt = 0, wantTracking = true, trackingState = "idle", requestStarted = 0;
const NO_FRAMES_MS = 10000;
const status = text => {
  $('status').textContent = text;
  const notice = $('camera-notice');
  if (notice) {
    $('camera-notice-text').textContent = text;
    notice.hidden = !hosted || hostPaused || ['active', 'remote'].includes(trackingState);
  }
};
const stopTracking = () => { stopPose?.(); stopPose = undefined; };

function syncPause() {
  if (!game) return;
  if (hostPaused || userPaused) { game.pause(); stopTracking(); }
  else { game.resume(); if (tracking && !stopPose) subscribePose(); }
  $('pause').textContent = userPaused ? 'RESUME' : 'PAUSE';
}
function subscribePose() {
  if (!app.can('sense.pose')) {
    tracking = false; trackingState = 'not_granted'; game.remote();
    status('TV pose capability was not granted. Relaunch from copy-that with its little/manifest.json. Camera approval cannot be requested until the host grants pose.');
    return false;
  }
  tracking = true; trackingState = 'waiting'; requestStarted = performance.now();
  held.left = held.right = null; lastFrameAt = 0;
  game.external(); lastPose = performance.now();
  status('Waiting for TV camera approval or pose data. Check the TV permission card.');
  // Keep this subscription alive while the viewer answers the host permission card.
  try { stopPose = app.sense.pose(frame => {
    poseFrames++;
    if (!Array.isArray(frame?.keypoints)) return;
    const now = performance.now(), kp = name => frame.keypoints.find(p => p.name === name && Number.isFinite(p.x) && Number.isFinite(p.y));
    if (frame.score >= .3) seen.people++;
    window.dockPose = { keypoints: frame.keypoints, t: now };   // for the on-screen camera panel
    const byName = Object.fromEntries(frame.keypoints.map(p => [p.name, p]));
    reach.update(byName, lastFrameAt ? (now - lastFrameAt) / 1000 : 0); lastFrameAt = now;
    window.dockReach = reach.boxes();
    // Each hand on its own: the wrist if it's seen at all, else extend the forearm past the elbow,
    // else keep the last good spot for a second. One missing wrist no longer drops the frame.
    for (const side of ['left', 'right']) {
      const w = kp(side + '_wrist'), e = kp(side + '_elbow'), s = kp(side + '_shoulder');
      let p = null;
      if (w && w.score >= WRIST_MIN) { p = w; seen.wrist++; }
      else if (e && e.score >= ELBOW_MIN) { p = s ? { x: e.x + (e.x - s.x) * .8, y: e.y + (e.y - s.y) * .8 } : e; seen.elbow++; }
      if (p) { held[side] = { ...reach.toDesk(side, p), t: now }; seen[side]++; } // each hand's own reach box → whole desk
    }
    const fresh = side => { const w = kp(side + '_wrist'); return w && w.score >= WRIST_MIN && held[side]?.t === now; };
    if (!fresh('left') && !fresh('right')) return;
    window.dockInput.push({ left: fresh('left') ? held.left : null, right: fresh('right') ? held.right : null });
    acceptedFrames++; lastPose = now; trackingState = 'active'; status('TV tracking active.');
  }, { fps: POSE_FPS, accuracy: 'standard' }); } catch (e) { tracking = false; trackingState = 'error'; status('TV pose error: ' + e.message); stopPose = undefined; return false; }
  return true;
}
function enableTracking() {
  wantTracking = true; reach.reset(); lastFrameAt = 0;
  if (hostPaused || userPaused) return { ok: false, detail: 'Resume the game before enabling tracking.' };
  if (stopPose) return { say: 'Camera tracking is already requested. Check the TV permission card and keep one hand visible.' };
  if (!subscribePose()) return { ok: false, detail: $('status').textContent };
  return { say: 'Camera tracking requested. Approve access on the TV if prompted.' };
}
function useRemote() { wantTracking = false; tracking = false; trackingState = 'remote'; stopTracking(); game.remote(); status('Arrows move the gloves; Enter raises/drops them. Back pauses, then exits.'); }
function save() { if (game && hosted) void app.saveState({ ...game.state(), userPaused }); }

function enter(info) {
  hosted = true; entry = info; if (!game) return;
  // Every launch starts the night from the top (phone at the bar), never mid-shift or on results.
  if (!enteredGame) { userPaused = false; game.reset(); enteredGame = true; }
  // Hands-free from the start: track the body straight away; fall back to the remote only without pose.
  stopTracking(); tracking = false; syncPause(); if (wantTracking) enableTracking(); else useRemote();
  $('camera').textContent = 'ENABLE TV TRACKING';
}
app.onEnter(enter);
app.onPause(() => { hostPaused = true; syncPause(); status('Paused.'); save(); });
app.onResume(() => { hostPaused = false; syncPause(); });

const handlers = {
  start_shift() { userPaused = false; game.start(); syncPause(); save(); return { say: 'Back to work. Stamp, copy, staple. Go!' }; },
  pause_game() { userPaused = true; syncPause(); save(); return { say: 'Paused.' }; },
  resume_game() { userPaused = false; syncPause(); save(); return { say: 'Resumed.' }; },
  enable_tracking: enableTracking,
  use_remote() { useRemote(); return { say: 'Remote controls enabled.' }; },
  get_status() {
    return { detail: JSON.stringify({ ...game.state(), round: $('task').textContent, prompt: $('message').textContent, tracking, trackingState, granted: entry?.granted ?? [], denied: entry?.denied ?? [], canPose: app.can('sense.pose'), poseFrames, acceptedFrames, seen: { ...seen }, lastPoseAgeMs: acceptedFrames ? Math.round(performance.now() - lastPose) : null }) };
  },
};
for (const [name, handler] of Object.entries(handlers)) app.tool(name, () => game ? handler() : { ok: false, detail: 'Game is still loading.' });

function ready() {
  game = window.dockGame;
  const browserCamera = $('camera').onclick;
  $('camera').onclick = () => { if (hosted) { const r = enableTracking(); if (r.ok === false) status(r.detail); } else browserCamera?.(); };
  $('pause').onclick = () => handlers[userPaused ? 'resume_game' : 'pause_game']();
  $('mode').addEventListener('change', () => { if ($('mode').value === 'mouse') useRemote(); else { tracking = false; stopTracking(); if (hosted) enableTracking(); } });
    for (const [id, kind, label, action] of [
    ['stage', 'region', 'Dock game'], ['score', 'readout', 'Score'], ['clock', 'readout', 'Time left'],
    ['task', 'readout', 'Current job'], ['status', 'readout', 'Input status'], ['message', 'readout', 'What to do now'],
    ['start', 'control', 'Start or restart shift', 'start_shift'], ['camera', 'control', 'Enable TV tracking', 'enable_tracking'],
    ['pause', 'control', 'Pause game', 'pause_game'],
  ]) {
    const el = $(id); el.dataset.little = kind; el.dataset.littleLabel = label;
    if (action) { el.dataset.littleAction = action; el.dataset.littleId = id; }
  }
  if (entry) enter(entry);
  setInterval(() => {
    if (hostPaused) return;
    const s = game.state();
    $('score').dataset.littleData = JSON.stringify({ value: s.score });
    $('clock').dataset.littleData = JSON.stringify({ seconds: s.timeLeft });
    $('pause').dataset.littleAction = userPaused ? 'resume_game' : 'pause_game';
    $('pause').dataset.littleLabel = userPaused ? 'Resume game' : 'Pause game';
    const key = s.state + ':' + s.round;
    if (key !== lastState) { app.emit(s.state === 'results' ? 'shift_stopped' : 'round_changed', { round: s.round, state: s.state, score: s.score }); lastState = key; save(); }
    // A silent stream does not prove denial: preserve it instead of cancelling a pending prompt.
    const now = performance.now();
    if (hosted && tracking && !userPaused && now - Math.max(requestStarted, lastFrameAt) > NO_FRAMES_MS) {
      trackingState = 'no_frames';
      status('No TV pose frames yet. Check camera permission and your adult household profile. If access was declined, close and reopen the app to request it again. You can use the remote meanwhile.');
    } else if (tracking && lastFrameAt && now - lastPose > 2500 && now - lastFrameAt < NO_FRAMES_MS) {
      trackingState = 'hands_missing'; status('Camera frames are arriving. Keep both hands and shoulders visible.');
    }
    if (performance.now() - lastSaved > 1000) { save(); lastSaved = performance.now(); }
  }, 250);
}
window.addEventListener('dock-ready', ready, { once: true });
if (window.dockGame) ready();

window.addEventListener('keydown', event => {
  if (!game || !hosted) return;
  const s = game.state();
  if (event.key === 'Escape' || event.key === 'GoBack' || event.key === 'BrowserBack') {
    event.preventDefault(); if (s.state !== 'title' && !userPaused) handlers.pause_game(); else void app.exit(); return;
  }
  if (!userPaused && !hostPaused && !tracking) {
    const m = { ArrowLeft: [-.06, 0], ArrowRight: [.06, 0], ArrowUp: [0, -.08], ArrowDown: [0, .08] }[event.key];
    if (m) { event.preventDefault(); event.stopPropagation(); game.move(...m); }
    if (event.key === 'Enter' && !event.repeat) { event.preventDefault(); raised = !raised; game.raise(raised); }
  }
}, true);
window.addEventListener('pagehide', () => { stopTracking(); game?.stopCamera(); });
