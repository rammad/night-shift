import { clamp, dist, speed } from './util.js';
import { LAYOUT } from './layout.js';
import { TUNING } from './tuning.js';
const TS = TUNING.stamp, TC = TUNING.copy, TP = TUNING.staple;

// Pure minigame rules. Coordinates are desk space (see layout.js): 0..1 across the desk,
// y toward the player. Hands arrive already drunk-adjusted with velocities
// in screen-units/second. Views read these objects; they never write them.
//
// ctx: { random(), level (0..4), emit(type, data) }


// ---------------------------------------------------------------- opener (confirm gesture)
// Raise both hands above your head and hold them there: the phone flips open.
// Hands must be seen down first, so arms still up from a slam can't trigger it.
export class Opener {
  constructor(pos = LAYOUT.opener, kind = 'phone') {
    this.kind = kind; this.pos = { ...pos }; this.phase = 'waiting';
    this.progress = 0; this.done = false; this.t = 0;
  }
  update(dt, h, ctx) {
    this.t += dt;
    if (this.done) return;
    const up = h.left.y < TUNING.raise.upY || h.right.y < TUNING.raise.upY;
    const down = h.left.y > TUNING.raise.downY && h.right.y > TUNING.raise.downY;
    if (this.phase === 'waiting') { if (down) this.phase = 'idle'; return; }
    if (up) {
      if (this.phase !== 'raising') { this.phase = 'raising'; ctx.emit('grip', { kind: this.kind }); }
      this.progress = clamp(this.progress + dt / TUNING.raise.hold);
      if (this.progress >= 1) { this.phase = 'open'; this.done = true; ctx.emit('flip'); }
    } else {
      this.progress = Math.max(0, this.progress - dt * 2);
      if (this.progress === 0) this.phase = 'idle';
    }
  }
}

// ---------------------------------------------------------------- 1. STAMP
// You hold one rubber stamp (the right hand is the stamp). Rest it on an ink pad to ink it
// APPROVED or REJECTED, then hold it over the form: once your hand settles it thumps down by
// itself, wherever it is. Each form wants a different spot and a stamp. Re-ink every time.
export const FORM = LAYOUT.form; // centre/size of the form on the blotter
// Pre-laid-out variants: target boxes have a paper margin and clear the heading.
export const FORM_VARIANTS = Object.freeze([
  { want: 'approved', dx: 0, dy: -.035 },
  { want: 'rejected', dx: .004, dy: .06 },
  { want: 'approved', dx: -.004, dy: .145 },
  { want: 'rejected', dx: 0, dy: -.035 },
  { want: 'approved', dx: .004, dy: .06 },
  { want: 'rejected', dx: -.004, dy: .145 },
]);
export class StampGame {
  constructor(random = Math.random) {
    this.key = 'stamp'; this.title = 'STAMP'; this.verb = 'STAMP THE FORMS!'; this.duration = TS.duration;
    this.count = 0; this.misses = 0; this.t = 0;
    this.pads = structuredClone(LAYOUT.pads);
    this.ink = null;                       // what's on the stamp: 'approved' | 'rejected' | null (dry)
    this.form = this.newForm(random); this.phase = 'in'; this.timer = .3; this.dwell = 0; this.thump = 0;
    this.prompt = 'INK THE STAMP';
  }
  newForm(random) {
    const index = Math.min(FORM_VARIANTS.length - 1, Math.floor(random() * FORM_VARIANTS.length));
    const variant = FORM_VARIANTS[index];
    return {
      variant: index, want: variant.want,
      target: { x: FORM.x + variant.dx, y: FORM.y + variant.dy },
      mark: null, slide: -1, grade: '',
    };
  }
  over(p) { return Math.abs(p.x - FORM.x) < FORM.w / 2 + .02 && Math.abs(p.y - FORM.y) < FORM.h / 2 + .02; }
  update(dt, h, ctx) {
    this.t += dt; this.thump = Math.max(0, this.thump - dt);
    const f = this.form, r = h.right;
    for (const [kind, pad] of Object.entries(this.pads)) {
      if (dist(r, pad) < TS.inkRadius && speed(r) < TS.inkMaxSpeed && this.ink !== kind) { this.ink = kind; ctx.emit('pickup', { kind }); }
    }
    if (this.phase === 'in') { this.timer -= dt; f.slide = -(this.timer / .3); if (this.timer <= 0) { this.phase = 'live'; f.slide = 0; } return; }
    if (this.phase === 'out') {
      this.timer -= dt; f.slide = clamp(1 - (this.timer - .25) / .3);
      if (this.timer <= 0) { this.form = this.newForm(ctx.random); this.phase = 'in'; this.timer = .3; }
      return;
    }
    if (!this.over(r)) { this.dwell = 0; this.prompt = this.ink ? `${f.want.toUpperCase()} — LINE IT UP` : 'INK THE STAMP'; return; }
    if (!this.ink) { this.dwell = 0; this.prompt = 'DRY! INK IT FIRST'; return; }
    if (Math.abs(r.x - f.target.x) >= TS.good || Math.abs(r.y - f.target.y) >= TS.good) { this.dwell = 0; this.prompt = 'LINE UP WITH THE BOX'; return; }
    // Ink + entry into the enlarged target stamps immediately, even while moving.
    this.dwell = 0;
    {
      const kind = this.ink, d = dist(r, f.target);
      f.mark = { kind, x: r.x - FORM.x, y: r.y - FORM.y };
      const right = kind === f.want, onTarget = true;
      f.grade = !right ? 'WRONG STAMP' : d < TS.perfect ? 'PERFECT' : onTarget ? 'GOOD' : 'SLOPPY';
      if (right && onTarget) this.count++; else this.misses++;
      ctx.emit(right && onTarget ? 'stamp' : 'wrong', { kind, grade: f.grade, x: r.x, y: r.y });
      this.ink = null; this.dwell = 0; this.thump = .2; this.phase = 'out'; this.timer = .55;
    }
  }
}

// ---------------------------------------------------------------- 2. COPY
// Grab a sheet off the pile, hold it over the copier glass and keep it still until the scan
// finishes. Each scanned sheet becomes a copy; grab the next one.
export class CopyGame {
  constructor() {
    this.key = 'copy'; this.title = 'COPY'; this.verb = 'MAKE COPIES!'; this.duration = TC.duration;
    this.count = 0; this.misses = 0; this.t = 0;
    this.pile = { ...LAYOUT.pile }; this.glass = { ...LAYOUT.glass };
    this.holder = null; this.sheet = { ...this.pile }; this.fall = null; this.scan = 0; this.ejected = 0;
    this.prompt = 'GRAB A SHEET';
  }
  update(dt, h, ctx) {
    this.t += dt;
    const L = ctx.level || 0, r = h.right;
    this.ejected = Math.max(0, this.ejected - dt);
    if (this.fall) {
      this.fall.vy += 2.5 * dt; this.fall.y += this.fall.vy * dt; this.fall.x += Math.sin(this.t * 9) * .2 * dt;
      this.sheet = { x: this.fall.x, y: this.fall.y };
      if (this.fall.y > 1.1) { this.fall = null; this.sheet = { ...this.pile }; }
      return;
    }
    if (!this.holder) {
      this.sheet = { ...this.pile }; this.scan = 0; this.prompt = 'GRAB A SHEET';
      if (Math.abs(r.x - this.pile.x) <= LAYOUT.copyPaper.w / 2 + .02 && r.y >= this.pile.y - LAYOUT.copyPaper.h / 2 - LAYOUT.copyPaper.stackRise - .03 && r.y <= this.pile.y + LAYOUT.copyPaper.h / 2 + .03) { this.holder = 'right'; ctx.emit('grab', { hand: 'right' }); }
      return;
    }
    this.sheet = { x: r.x, y: r.y + .02 };
    // Paper is floppy: wave it around too hard and it flutters away.
    const slip = TC.slipSpeed - TC.slipPerLevel * L, s = speed(r);
    if (s > slip && ctx.random() < (s - slip) * TC.slipChance * dt) {
      this.fall = { x: this.sheet.x, y: this.sheet.y, vy: -.3 }; this.holder = null; this.scan = 0; this.misses++; ctx.emit('drop'); return;
    }
    if (dist(this.sheet, this.glass) < TC.glassRadius) {
      const was = this.scan;
      this.scan = s < TC.calmSpeed ? this.scan + dt : Math.max(0, this.scan - dt * 2);
      if (was === 0 && this.scan > 0) ctx.emit('copy');
      this.prompt = 'HOLD IT STILL…';
      if (this.scan >= TC.scanTime) { this.count++; this.holder = null; this.scan = 0; this.ejected = .6; ctx.emit('copied'); }
    } else { this.scan = Math.max(0, this.scan - dt * 3); this.prompt = 'OVER THE GLASS'; }
  }
}

// ---------------------------------------------------------------- 3. STAPLE
// The stapler is fixed on the desk. Your left hand moves the papers: line the corner mark up
// under the stapler's nose. Then raise your right hand and swing it down to staple.
export const STAPLER = LAYOUT.stapler;
export const STAPLE_TARGETS = Object.freeze([
  { x: .135, y: -.175 }, { x: .105, y: -.17 },
  { x: .13, y: -.125 }, { x: .095, y: -.14 },
]);
export class StapleGame {
  constructor(random = Math.random) {
    this.random = random; this.targetIndex = -1; this.nextTarget();
    this.key = 'staple'; this.title = 'STAPLE'; this.verb = 'LINE UP THE PAPER!'; this.duration = TP.duration;
    this.count = 0; this.misses = 0; this.t = 0;
    this.stack = { x: .45, y: LAYOUT.stapleY, spin: 0, slide: -1 };
    this.phase = 'in'; this.timer = .35; this.nextStaple = TP.interval;
    this.marks = []; this.slam = 0; this.height = 1; this.aligned = false; this.result = '';
    this.prompt = 'MOVE THE PAPER WITH ONE HAND';
  }
  nextTarget() {
    const count = STAPLE_TARGETS.length;
    // Select among all OTHER locations, including under deterministic test RNGs.
    const offset = Math.min(count - 2, Math.floor(this.random() * (count - 1))) + 1;
    this.targetIndex = (this.targetIndex + offset) % count;
    this.target = { ...STAPLE_TARGETS[this.targetIndex] };
  }
  corner() { return { x: this.stack.x + this.target.x, y: this.stack.y + this.target.y }; }
  update(dt, h, ctx) {
    this.t += dt; this.slam = Math.max(0, this.slam - dt);
    const s = this.stack, p = h.right, paper = LAYOUT.staplePaper;
    // Follow the hand freely; the paper may extend beyond the screen.
    s.x += (p.x - s.x) * clamp(dt * 18);
    s.y += (p.y - s.y) * clamp(dt * 18);
    if (this.phase !== 'live') {
      this.timer -= dt;
      s.slide = this.phase === 'in' ? -Math.max(0, this.timer) / .35 : 1 - Math.max(0, this.timer) / .6;
      if (this.timer <= 0) {
        if (this.phase === 'in') { this.phase = 'live'; s.slide = 0; this.nextStaple = TP.interval; }
        else { this.phase = 'in'; this.timer = .35; this.marks = []; this.result = ''; this.nextTarget(); }
      }
      this.aligned = false; return;
    }
    this.aligned = dist(this.corner(), STAPLER) < TP.tolerance && Math.abs(STAPLER.x-s.x) <= paper.w/2-.013 && Math.abs(STAPLER.y-s.y) <= paper.h/2-.013;
    this.nextStaple -= dt;
    this.height = this.slam > 0 ? 0 : Math.min(1, this.nextStaple / .3);
    this.prompt = (this.aligned ? 'ON TARGET — HOLD HERE! ' : 'MOVE THE TARGET UNDER THE STAPLER ') + Math.ceil(Math.max(0, this.nextStaple));
    if (this.nextStaple > 0) return;
    this.nextStaple = TP.interval; this.slam = .25;
    const hit = { x: STAPLER.x - s.x, y: STAPLER.y - s.y };
    if (Math.abs(hit.x) <= paper.w / 2 - .013 && Math.abs(hit.y) <= paper.h / 2 - .013) this.marks.push(hit);
    if (this.aligned) { this.count++; this.result = 'clean'; this.phase = 'done'; this.timer = .6; ctx.emit('staple', { ...STAPLER }); }
    else { this.misses++; this.result = 'miss'; ctx.emit('clack', { ...STAPLER }); }
  }
}

export const GAMES = [StampGame, CopyGame, StapleGame];
