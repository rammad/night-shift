import { shiftRating } from './rating.js';
import { Onboarding } from './onboarding.js';
import { Shift, ROUNDS } from './shift.js';
import { GAMES } from './minigames.js';
import { TUNING } from './tuning.js';
import { View2D, THEMES, W, H } from './view2d.js';
import { Input } from './input.js';
import { play, unlockAudio, hum } from './sfx.js';
import { CameraPanel } from './campip.js';

const $ = id => document.getElementById(id);
const stage = $('stage');
const canvas = document.createElement('canvas');
stage.prepend(canvas);
const params0 = new URLSearchParams(location.search);
const view = new View2D(canvas, params0.get('theme') || localStorageGet('theme') || 'warm');
function localStorageGet(k) { try { return localStorage.getItem('nightshift.' + k); } catch { return null; } }
function localStorageSet(k, v) { try { localStorage.setItem('nightshift.' + k, v); } catch {} }
const input = new Input(stage, $('video'));
const params = new URLSearchParams(location.search);
const shift = new Shift();
let onboarding = new Onboarding();
const setupPanel = new CameraPanel($('setup-preview'), $('video'), true);
$('setup-remote').onclick = () => { unlockAudio(); api.remote(); onboarding.done = true; };
const TASKS = GAMES.map(G => new G(() => .5).title);
let paused = false, last = performance.now();
input.onStatus = text => { $('status').textContent = text; };
// The canvas is letterboxed at 16:9 inside the stage; desk space = canvas space.
let box = { x: 0, y: 0, w: 1, h: 1 };
function resize() {
  const sw = stage.clientWidth, sh = stage.clientHeight;
  if (!(sw > 0 && sh > 0)) { box = { x: 0, y: 0, w: 1, h: 1 }; return; } // not laid out yet (TV launch): never divide by zero
  const s = Math.min(sw / W, sh / H);
  const w = W * s, h = H * s; box = { x: (sw - w) / 2 / sw, y: (sh - h) / 2 / sh, w: w / sw, h: h / sh };
  Object.assign(canvas.style, { width: w + 'px', height: h + 'px', left: (sw - w) / 2 + 'px', top: (sh - h) / 2 + 'px' });
}
input.map = p => ({ x: (p.x - box.x) / box.w, y: (p.y - box.y) / box.h });
window.addEventListener('resize', resize); resize();
{ const practice = ['stamp', 'copy', 'staple'].indexOf(params.get('practice')); if (practice >= 0) { shift.start(practice); onboarding.done = true; } }

// ------------------------------------------------------------------ HUD
const fmt = s => '0:' + String(Math.max(0, Math.ceil(s))).padStart(2, '0');
function hud() {
  const s = shift.state, g = shift.game, inGame = s === 'intro' || s === 'play' || s === 'roundEnd';
  const atBar = s === 'phone' || s === 'message' || s === 'fade';
  document.body.dataset.state = s; document.body.dataset.theme = view.themeKey;
  $('task').textContent = inGame ? `0${shift.round + 1} / ${g.title}` : atBar ? '' : 'CLOCKED OUT';
  $('clock').textContent = s === 'play' ? fmt(shift.timeLeft) : inGame ? fmt(g.duration) : atBar ? '11:47 PM' : '';
  $('clock').classList.toggle('countdown', inGame);
  $('clock').classList.toggle('warning', s === 'play' && shift.timeLeft <= 8);
  $('clock').classList.toggle('urgent', s === 'play' && shift.timeLeft <= 5);
  $('clock').classList.toggle('critical', s === 'play' && shift.timeLeft <= 3);
  $('score').textContent = atBar ? '' : String(shift.score + (s === 'play' ? Math.max(0, g.count * 100 - g.misses * 25) : 0));
  $('count').textContent = inGame ? `${g.count} DONE · ${g.misses} FUMBLED` : '';
  let msg = '', big = '', sub = '';
  if (s === 'phone') { sub = shift.opener.phase === 'raising' ? '' : 'bzzt… bzzt…'; msg = shift.opener.phase === 'waiting' ? 'HANDS DOWN…' : 'RAISE ONE HAND TO ANSWER'; }
  else if (s === 'message') { sub = ''; }
  else if (s === 'results') { big = ''; msg = shift.opener.phase === 'waiting' ? 'HANDS DOWN…' : 'RAISE ONE HAND TO GO AGAIN'; }
  else if (s === 'intro') { big = g.verb; sub = `JOB ${shift.round + 1} OF ${ROUNDS} • ${g.duration}s`; }
  else if (s === 'play') { msg = g.prompt; }
  else if (s === 'roundEnd') { big = "TIME'S UP!"; const r = shift.results.at(-1); sub = `${r.count} done, ${r.misses} fumbled • +${r.points}`; }
  $('big').textContent = big; $('message').textContent = paused ? 'PAUSED' : msg; $('sub').textContent = sub;
  let meter = null;
  if (shift.opener && (s === 'phone' || s === 'results') && shift.opener.phase === 'raising') meter = { label: 'HOLD!', v: shift.opener.progress };
  if (s === 'play' && g.key === 'stamp' && g.dwell > 0) meter = { label: 'THUMP', v: g.dwell / TUNING.stamp.dwell };
  if (s === 'play' && g.key === 'copy' && g.scan > 0) meter = { label: 'SCAN', v: g.scan / TUNING.copy.scanTime };
  $('meter').hidden = !meter;
  if (meter) { $('meter-label').textContent = meter.label; $('meter-fill').style.width = meter.v * 100 + '%'; }
  $('results').hidden = s !== 'results';
  if (s === 'results') $('results').innerHTML = '<header>NIGHT SHIFT <small>EMPLOYEE TIME CARD</small></header><h2>CLOCKED OUT</h2><p>IN 11:47 PM · NIGHT CREW</p><div class=card-labels><b>JOB</b><span>DONE / ERRORS</span><em>PTS</em></div>' + shift.results.map(r => `<div><b>${r.title}</b><span>${r.count} / ${r.misses}</span><em>${r.points}</em></div>`).join('') + `<div class="total"><b>TOTAL</b><em>${shift.score}</em></div><p class="card-stamp rating-stamp" aria-label="Shift rating ${shiftRating(shift.results)}"><small>SHIFT RATING</small>${shiftRating(shift.results)}</p><p>FILED: ${shift.results.reduce((n,r)=>n+r.count,0)} · FUMBLES: ${shift.results.reduce((n,r)=>n+r.misses,0)}</p>`;
  const conversation = $('conversation'); conversation.hidden = true;
  conversation.innerHTML = '';
  $('fade').style.opacity = view.fade.toFixed(3);
}

// ------------------------------------------------------------------ loop
function frame(now) { requestAnimationFrame(frame); if (!window.__manual) tick(now); } // __manual: tests step tick() themselves
function tick(now) {
  const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = Math.max(last, now);
  const g = shift.game, playing = shift.state === 'play';
  const policy = playing ? ({ stamp: 'park', copy: 'park', staple: 'park' }[g.key] || 'mirror') : 'mirror';
  const raw = input.sample(now, paused ? 0 : dt, policy, playing && g.key === 'staple' ? { x: .4, y: .62 } : null); // mouse mode: left hand holds the papers here
  const settingUp = !onboarding.done;
  $('onboarding').hidden = !settingUp;
  if (settingUp) {
    const readiness = onboarding.update(paused ? 0 : dt, input.mode === 'mouse' ? null : window.dockPose, now);
    setupPanel.draw(now, input.mode === 'mouse' ? null : window.dockPose);
    $('setup-status').textContent = readiness.message;
    $('setup-checks').textContent = (readiness.visible ? '✓ Upper body visible' : '○ Upper body visible') + '    ' + (readiness.centered ? '✓ Centered' : '○ Centered');
    $('setup-progress').value = readiness.progress;
    if (readiness.done) { shift.toPhone(); input.tracked.pendingReset = true; }
  }
  if (!paused && !settingUp) {
    shift.update(dt, raw);
    for (const e of shift.drain()) { play(e.type); view.event(e, shift); }
    if (shift.drunk.hiccup > .33) play('hiccup');
  }
  view.render(shift, paused ? 0 : dt);
  if (camPanel) camPanel.draw(now, window.dockPose);
  hum(shift.state === 'play' && g?.key === 'copy' && g.scan > 0);
  hud();
  $('tracking').hidden = settingUp || raw.valid !== false;
}
requestAnimationFrame(frame);

// ------------------------------------------------------------------ controls
['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, unlockAudio));
$('start').onclick = () => { unlockAudio(); api.start(); $('start').blur(); };
$('practice').onclick = () => { onboarding.done = true; shift.start(Number($('practice-round').value)); $('practice').blur(); };
$('camera').onclick = async () => {
  try { await input.startCamera(Number($('rate').value)); $('mode').value = 'camera'; }
  catch (e) { input.stopCamera(); $('status').textContent = 'Camera unavailable: ' + e.message; }
};
$('mode').onchange = () => input.setMode($('mode').value);
for (const [k, t] of Object.entries(THEMES)) $('theme').add(new Option(t.name, k));
$('theme').value = view.themeKey;
$('theme').onchange = () => { view.setTheme($('theme').value); localStorageSet('theme', view.themeKey); $('theme').blur(); };
// Camera panel (what the camera sees) unless ?nocam.
const camPanel = !params.has('cam') ? null : new CameraPanel($('campip'), $('video'));
if (!camPanel) $('campip').hidden = true;
// Dev controls stay out of sight unless ?dev is in the URL. The game itself needs no keyboard.
if (!params.has('dev')) { document.body.classList.add('hide-controls'); view.showMarks = params.has('marks'); }
window.addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key === 'h' || e.key === 'H') document.body.classList.toggle('hide-controls');
  if (e.key === 't' || e.key === 'T') { view.nextTheme(); $('theme').value = view.themeKey; localStorageSet('theme', view.themeKey); }
});

// Stable API used by little-bridge.js.
const api = window.dockGame = {
  start() { api.resume(); onboarding.done = true; if (!['intro', 'play', 'roundEnd'].includes(shift.state)) shift.start(); },
  reset() { api.resume(); onboarding = new Onboarding(); shift.toPhone(); },
  state() {
    const r = p => ({ x: +p.x.toFixed(2), y: +p.y.toFixed(2) });
    return { ...shift.snapshot(), onboarding: !onboarding.done, paused, input: input.mode, hands: { left: r(shift.hands.left), right: r(shift.hands.right) }, opener: shift.opener ? { phase: shift.opener.phase, progress: +shift.opener.progress.toFixed(2) } : null };
  },
  restore(s) { shift.restore(s); },
  pause() { if (paused) return; paused = true; input.stopCamera(); },
  resume() { if (!paused) return; paused = false; last = performance.now(); input.tracked.reset(); },
  stopCamera() { input.stopCamera(); },
  external() { input.setMode('external'); $('mode').value = 'external'; },
  remote() { input.setMode('mouse'); $('mode').value = 'mouse'; },
  move(dx, dy) { if (!paused) input.move(dx, dy); },
  raise(v) { input.space = !!v; },
};
window.__dock = { shift, view, input, tick }; // debugging handle
window.dispatchEvent(new Event('dock-ready'));
