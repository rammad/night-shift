import { MESSAGE_SECONDS, CONVERSATION_SECONDS } from './conversation.js';
import { DrunkHands, MAX_LEVEL } from './drunk.js';
import { Opener, GAMES } from './minigames.js';
import { clamp } from './util.js';
import { LAYOUT } from './layout.js';
import { TUNING } from './tuning.js';

// The night: flip open the phone at the bar → boss text → fade → office → three jobs back to
// back → results. You're drunk from the first frame and it creeps up each job.
// Flip the phone open again on the results screen to go again.
//
// states: phone | message | fade | intro | play | roundEnd | results
export const ROUNDS = GAMES.length;
const TIMES = { message: CONVERSATION_SECONDS, fade: 1.4, intro: 1.5, roundEnd: 1.8 };
export const BAR_LEVEL = TUNING.levels.bar;                               // already well gone at the bar
export const levelFor = round => Math.min(MAX_LEVEL, TUNING.levels.firstJob + round * TUNING.levels.perJob);

export const points = (count, misses) => Math.max(0, count * 100 - misses * 25);

export class Shift {
  constructor(random = Math.random) {
    this.random = random; this.drunk = new DrunkHands(random);
    this.hands = { left: { x: .3, y: .8, vx: 0, vy: 0 }, right: { x: .7, y: .8, vx: 0, vy: 0 } };
    this.events = []; this.practice = null; this.toPhone();
  }
  reset() { this.round = 0; this.score = 0; this.results = []; this.game = null; this.timer = 0; this.timeLeft = 0; }
  toPhone() {
    this.reset(); this.practice = null; this.state = 'phone';
    this.opener = new Opener(LAYOUT.opener, 'phone'); this.drunk.setLevel(BAR_LEVEL);
  }
  get level() { return this.drunk.level; }
  emit(type, data = {}) { this.events.push({ type, ...data }); }
  drain() { const e = this.events; this.events = []; return e; }
  ctx() { return { random: this.random, level: this.level, emit: (t, d) => this.emit(t, d) }; }

  // Voice/tool start (and ?practice=): skip the phone, straight to a task.
  start(practiceIndex = null) {
    this.reset();
    this.practice = Number.isInteger(practiceIndex) && practiceIndex >= 0 && practiceIndex < ROUNDS ? practiceIndex : null;
    this.round = this.practice ?? 0;
    this.beginIntro();
  }
  beginIntro() {
    this.drunk.setLevel(levelFor(this.round));
    this.game = new GAMES[this.round](this.random);
    this.state = 'intro'; this.timer = TIMES.intro; this.emit('intro', { round: this.round });
  }

  update(dt, raw) {
    dt = clamp(Number.isFinite(dt) ? dt : 0, 0, .1);
    if (raw?.valid !== false && raw?.left && raw?.right) this.hands = this.drunk.update(dt, raw);
    else this.drunk.update(dt, this.hands);
    // Do not score, trigger gestures, or spend round time on stale hands.
    if (raw?.valid === false) return;
    const h = this.hands, ctx = this.ctx();
    switch (this.state) {
      case 'phone':
        this.opener.update(dt, h, ctx);
        if (this.opener.done) { this.state = 'message'; this.timer = TIMES.message; this.emit('message'); }
        break;
      case 'message':
        const before = Math.floor((TIMES.message - this.timer) / MESSAGE_SECONDS);
        this.timer -= dt;
        if (Math.floor((TIMES.message - this.timer) / MESSAGE_SECONDS) > before && this.timer > 0) this.emit('message');
        if (this.timer <= 0) { this.state = 'fade'; this.timer = TIMES.fade; this.emit('fade'); }
        break;
      case 'fade':
        this.timer -= dt;
        if (this.timer <= 0) { this.round = 0; this.beginIntro(); this.emit('lamp_on'); }
        break;
      case 'results':
        this.opener.update(dt, h, ctx);
        if (this.opener.done) { const p = this.practice; this.reset(); this.practice = p; this.round = p ?? 0; this.beginIntro(); }
        break;
      case 'intro':
        this.timer -= dt;
        if (this.timer <= 0) { this.state = 'play'; this.timeLeft = this.game.duration; this.emit('go'); }
        break;
      case 'play':
        this.game.update(dt, h, ctx);
        this.timeLeft = Math.max(0, this.timeLeft - dt);
        if (this.timeLeft === 0) {
          const g = this.game, pts = points(g.count, g.misses);
          this.score += pts;
          this.results.push({ key: g.key, title: g.title, count: g.count, misses: g.misses, level: this.level, points: pts });
          this.state = 'roundEnd'; this.timer = TIMES.roundEnd; this.emit('timeup', { points: pts });
        }
        break;
      case 'roundEnd':
        this.timer -= dt;
        if (this.timer <= 0) {
          if (this.practice !== null || this.round + 1 >= ROUNDS) { this.opener = new Opener(LAYOUT.restart, 'phone'); this.state = 'results'; this.emit('results'); }
          else { this.round++; this.beginIntro(); }
        }
        break;
    }
  }

  snapshot() {
    return {
      version: 3, state: this.state, round: this.round, score: this.score, level: this.level,
      timeLeft: Math.ceil(this.timeLeft), practice: this.practice,
      game: this.game ? { key: this.game.key, count: this.game.count, misses: this.game.misses } : null,
      results: this.results.map(r => ({ ...r })),
    };
  }
  // Restores to a safe point: the start of the saved job (or the phone if nothing played).
  restore(s) {
    if (!s || s.version !== 3 || !Number.isInteger(s.round)) return;
    this.toPhone();
    this.round = clamp(s.round, 0, ROUNDS - 1); this.score = Math.max(0, Number(s.score) || 0);
    this.results = Array.isArray(s.results) ? s.results.slice(0, ROUNDS) : [];
    if (!this.results.length && this.round === 0) return;
    if (s.state === 'results') { this.opener = new Opener(LAYOUT.restart, 'phone'); this.state = 'results'; this.drunk.setLevel(levelFor(this.round)); return; }
    if (s.state === 'roundEnd' && this.results.length > this.round) {
      if (this.round + 1 >= ROUNDS) { this.state = 'results'; this.opener = new Opener(LAYOUT.restart, 'phone'); return; }
      this.round++;
    }
    this.results = this.results.slice(0, this.round); this.score = this.results.reduce((a, r) => a + (r.points || 0), 0);
    this.beginIntro();
  }
}
