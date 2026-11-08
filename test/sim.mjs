// Bot playtest: a "decent human" plays each job through the real drunk-hand model and rules.
// The bot moves its raw hands like a person (spring toward a goal, speed cap, a little tremor);
// DrunkHands then makes them drunk, exactly as in the game. Reports pace per job and level.
//   node test/sim.mjs            (all jobs, levels 3 / 3.5 / 4, careful bot)
//   RUSH=1.5 node test/sim.mjs   (a bot that moves 1.5× faster: more done, more fumbles?)
import { StampGame, CopyGame, StapleGame, STAPLER } from '../src/minigames.js';
import { TUNING } from '../src/tuning.js';
import { DrunkHands } from '../src/drunk.js';
import { levelFor } from '../src/shift.js';
import { rng, noise, dist } from '../src/util.js';

const DT = 1 / 60, RUSH = Number(process.env.RUSH || 1);
class Arm {
  constructor(x, y, seed) { this.p = { x, y }; this.v = { x: 0, y: 0 }; this.seed = seed; this.t = 0; }
  step(goal, maxSpeed = 2.2, w = 9) {
    maxSpeed *= RUSH; w *= Math.sqrt(RUSH);
    this.t += DT;
    for (const k of ['x', 'y']) this.v[k] += (w * w * (goal[k] - this.p[k]) - 2 * w * this.v[k]) * DT;
    const s = Math.hypot(this.v.x, this.v.y); if (s > maxSpeed) { this.v.x *= maxSpeed / s; this.v.y *= maxSpeed / s; }
    this.p.x += this.v.x * DT; this.p.y += this.v.y * DT;
    return { x: this.p.x + noise(this.t * 6, this.seed) * .004, y: this.p.y + noise(this.t * 6, this.seed + 9) * .004 };
  }
}

const bots = {
  stamp(g, h, arms) {
    const goal = g.ink !== g.form.want ? g.pads[g.form.want] : g.form.target;
    return { left: arms.left.step({ x: .1, y: .93 }), right: arms.right.step(g.phase === 'live' || g.ink !== g.form.want ? goal : g.pads[g.form.want]) };
  },
  copy(g, h, arms) {
    const goal = g.holder ? { x: g.glass.x, y: g.glass.y - .02 } : g.pile;
    return { left: arms.left.step({ x: .1, y: .93 }), right: arms.right.step(goal) };
  },
  staple(g, h, arms) {
    const at = { x: STAPLER.x - g.target.x, y: STAPLER.y - g.target.y };
    return { left: arms.left.step({ x: .1, y: .9 }), right: arms.right.step(at, 1.6) };
  },
};

function play(Game, level, seed) {
  const random = rng(seed), g = new Game(random), drunk = new DrunkHands(random); drunk.setLevel(level);
  const arms = { left: new Arm(.1, .9, seed), right: new Arm(.8, .8, seed + 3) };
  const events = [], ctx = { random, level, emit: (type, d) => events.push({ type, ...d }) };
  let h = drunk.update(DT, { left: arms.left.p, right: arms.right.p });
  for (let t = 0; t < g.duration; t += DT) { const raw = bots[g.key](g, h, arms); h = drunk.update(DT, raw); g.update(DT, h, ctx); }
  const by = {}; for (const e of events) by[e.type] = (by[e.type] || 0) + 1;
  return { count: g.count, misses: g.misses, by };
}

const SEEDS = 24;
for (const Game of [StampGame, CopyGame, StapleGame]) {
  const name = new Game(() => .5).key;
  for (const level of [levelFor(0), levelFor(1), levelFor(2), 2]) {
    let c = 0, m = 0; const by = {};
    for (let s = 1; s <= SEEDS; s++) { const r = play(Game, level, s * 7919); c += r.count; m += r.misses; for (const [k, v] of Object.entries(r.by)) by[k] = (by[k] || 0) + v; }
    const ev = Object.entries(by).map(([k, v]) => `${k}:${(v / SEEDS).toFixed(1)}`).join(' ');
    console.log(`${name.padEnd(6)} L${level.toFixed(1)}  done ${(c / SEEDS).toFixed(1).padStart(4)}  fumbles ${(m / SEEDS).toFixed(1).padStart(4)}   ${ev}`);
  }
}
