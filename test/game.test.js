import test from 'node:test';
import assert from 'node:assert/strict';
import { Opener, StampGame, CopyGame, StapleGame, STAPLER, FORM_VARIANTS, FORM } from '../src/minigames.js';
import { Shift, ROUNDS } from '../src/shift.js';
import { DrunkHands } from '../src/drunk.js';
import { ReachMapper } from '../src/reach.js';
import { rng } from '../src/util.js';
import { TUNING } from '../src/tuning.js';

const H = (x, y, vx = 0, vy = 0) => ({ x, y, vx, vy });
const ctxFor = (level = 1) => { const events = []; return { events, random: rng(7), level, emit: (type, d) => events.push({ type, ...d }) }; };
const run = (g, hands, ctx, seconds, dt = 1 / 60) => { for (let t = 0; t < seconds; t += dt) g.update(dt, typeof hands === 'function' ? hands(t) : hands, ctx); };
const away = H(.05, .95);

test('opener: hands down then either hand raised opens the phone', () => {
  const o = new Opener(), ctx = ctxFor(0), down = { left: H(.3, .8), right: H(.7, .8) };
  run(o, { left: H(.3, .1), right: H(.7, .1) }, ctx, 2);
  assert.ok(!o.done, 'arms already up must come down first');
  run(o, down, ctx, .2);
  run(o, { left: H(.3, .8), right: H(.7, .1) }, ctx, 2);
  assert.ok(o.done, 'one hand is enough');
  run(o, { left: H(.3, .1), right: H(.7, .1) }, ctx, TUNING.raise.hold + .1);
  assert.ok(o.done);
  assert.deepEqual(ctx.events.map(e => e.type), ['grip', 'flip']);
});

test('stamp: moving into an inked target scores immediately and consumes ink', () => {
  const g = new StampGame(() => 0), ctx = ctxFor(1); // .2 → wants approved
  assert.equal(g.form.want, 'approved');
  run(g, { left: away, right: H(g.pads.approved.x, g.pads.approved.y) }, ctx, .4);
  assert.equal(g.ink, 'approved');
  g.update(1 / 60, { left: away, right: H(g.form.target.x, g.form.target.y, 2, 0) }, ctx);
  assert.equal(g.count, 1); assert.equal(g.form.grade, 'PERFECT'); assert.equal(g.ink, null);
});

test('stamp: dry stamp never thumps; off-target movement waits for alignment', () => {
  const g = new StampGame(() => 0), ctx = ctxFor(1);
  run(g, { left: away, right: H(g.form.target.x, g.form.target.y) }, ctx, 1);
  assert.equal(g.count + g.misses, 0, 'dry stamp');
  run(g, { left: away, right: H(g.pads.approved.x, g.pads.approved.y) }, ctx, .4);
  run(g, t => ({ left: away, right: H(.8, .55, Math.sin(t * 30) * 3, 0) }), ctx, 1);
  assert.equal(g.count + g.misses, 0, 'movement outside the target never stamps');
  const far = { x: g.form.target.x > .5 ? g.form.target.x - .1 : g.form.target.x + .1, y: g.form.target.y };
  run(g, { left: away, right: H(far.x, far.y) }, ctx, .6);
  assert.equal(g.misses, 0); assert.equal(g.form.mark, null); assert.equal(g.dwell, 0);
});

test('copy: grab a sheet, hold it still over the glass until the scan finishes = a copy', () => {
  const g = new CopyGame(), ctx = ctxFor(3);
  run(g, { left: away, right: H(g.pile.x, g.pile.y) }, ctx, .2);
  assert.equal(g.holder, 'right');
  run(g, { left: away, right: H(g.glass.x, g.glass.y - .02) }, ctx, TUNING.copy.scanTime + .1);
  assert.equal(g.count, 1); assert.equal(g.holder, null);
  run(g, { left: away, right: H(g.pile.x, g.pile.y) }, ctx, .2);
  run(g, t => ({ left: away, right: H(g.glass.x, g.glass.y - .02, Math.sin(t * 30) * 1.5, 0) }), ctx, 2);
  assert.equal(g.count, 1, 'a jiggling sheet never finishes scanning');
});

test('copy: flailing the sheet drops it', () => {
  const g = new CopyGame(), ctx = ctxFor(4);
  run(g, { left: away, right: H(g.pile.x, g.pile.y) }, ctx, .1);
  run(g, { left: away, right: H(.4, .5, 9, 0) }, ctx, 2);
  assert.ok(g.misses >= 1);
});

test('stapler strikes automatically, keeps missed staples, then scores the aligned sheet', () => {
 const g = new StapleGame(), ctx = ctxFor(1);
 const wrong = {left:away,right:H(.52,.5)};
 run(g,wrong,ctx,.4);
 run(g,wrong,ctx,TUNING.staple.interval-.1);
 assert.equal(g.marks.length,0);
 run(g,wrong,ctx,.2);
 assert.equal(g.misses,1); assert.equal(g.marks.length,1);
 const mark = {...g.marks[0]};
 run(g,wrong,ctx,TUNING.staple.interval);
 assert.equal(g.marks.length,2); assert.deepEqual(g.marks[0],mark);
 const at = H(STAPLER.x-g.target.x,STAPLER.y-g.target.y);
 run(g,{left:away,right:at},ctx,TUNING.staple.interval);
 assert.equal(g.count,1); assert.equal(g.marks.length,3);
 run(g,{left:away,right:at},ctx,1);
 assert.equal(g.marks.length,0);
});

test('reach: the right hand covers the whole desk from its own side, never crossing the body midline', () => {
  const m = new ReachMapper();
  // Camera space, not mirrored: the player's right shoulder appears on the camera's left.
  const kp = { left_shoulder: { x: .58, y: .4, score: 1 }, right_shoulder: { x: .42, y: .4, score: 1 } };
  m.update(kp, 0);
  const sw = .16, mid = .5; // mirrored body midline
  const b = m.boxes().right;
  assert.ok(b.x >= mid - .02, 'right box starts at or right of the body midline');
  assert.ok(Math.abs(m.toDesk('right', { x: 1 - b.x, y: b.y }).x) < 1e-9, 'left edge of the box = left edge of the desk');
  assert.ok(Math.abs(m.toDesk('right', { x: 1 - (b.x + b.w), y: b.y + b.h }).x - 1) < 1e-9, 'right edge = right edge');
  const l = m.boxes().left;
  assert.ok(l.x + l.w <= mid + .02, 'left box ends at or left of the midline');
});

test('hands converge without artificial overshoot at every level', () => {
  const err = level => {
    const d = new DrunkHands(rng(3)); d.setLevel(level); let max = 0;
    for (let i = 0; i < 120; i++) { const x = i < 30 ? .2 : .8; const o = d.update(1 / 60, { left: H(x, .5), right: H(x, .5) }); if (i > 30) max = Math.max(max, o.right.x - .8); }
    return max;
  };
  assert.ok(err(0) < .02); assert.ok(err(4) < .02);
});

test('drunk hands: a NaN input never sticks; the next good frame recovers', () => {
  const d = new DrunkHands(rng(3)); d.setLevel(3);
  d.update(1 / 60, { left: H(NaN, NaN), right: H(.5, NaN) });
  d.state.left.x = NaN;
  const o = d.update(1 / 60, { left: H(.3, .6), right: H(.7, .6) });
  assert.ok([o.left.x, o.left.y, o.right.x, o.right.y].every(Number.isFinite));
});

test('shift: phone → message → fade → 3 jobs back to back, drunk from the start → results → phone again', () => {
  const s = new Shift(rng(5));
  const open = target => { // hands down, then both up
    const down = { left: H(.3, .85), right: H(.7, .85), valid: true }, up = { left: H(.3, .1), right: H(.7, .1), valid: true };
    for (let i = 0; i < 20; i++) s.update(1 / 30, down);
    for (let i = 0; i < 600 && s.state !== target; i++) s.update(1 / 30, up);
  };
  const idle = { left: H(.05, .95), right: H(.95, .95), valid: true };
  assert.equal(s.state, 'phone'); assert.ok(s.level >= 2.5, 'drunk at the bar already');
  open('message');
  for (let i = 0; i < 900 && s.state !== 'intro'; i++) s.update(1 / 30, idle);
  assert.equal(s.game.key, 'stamp'); assert.equal(s.level, 3);
  const keys = [];
  for (let i = 0; i < 4000 && s.state !== 'results'; i++) { if (s.state === 'intro' && keys.at(-1) !== s.game.key) keys.push(s.game.key); s.update(1 / 30, idle); }
  assert.deepEqual(keys, ['stamp', 'copy', 'staple']); assert.equal(s.level, 4);
  assert.equal(s.state, 'results'); assert.equal(s.results.length, ROUNDS);
  open('intro'); assert.equal(s.game.key, 'stamp'); assert.equal(s.results.length, 0);
});

test('shift: start() skips the phone; snapshot/restore resumes at the start of the saved job', () => {
  const s = new Shift(rng(5)); s.start();
  assert.equal(s.state, 'intro');
  s.round = 2; s.results = [{ points: 400 }, { points: 500 }]; s.score = 900;
  const r = new Shift(); r.restore(s.snapshot());
  assert.equal(r.state, 'intro'); assert.equal(r.round, 2); assert.equal(r.game.key, 'staple'); assert.equal(r.score, 900);
});

test('all preset stamp areas fit within the page with a margin',()=>{
 for(const f of FORM_VARIANTS){
  assert.ok(Math.abs(f.dx)+TUNING.stamp.good < FORM.w/2-.005);
  assert.ok(Math.abs(f.dy)+TUNING.stamp.good < FORM.h/2-.005);
 }
});
test('restoring after stamp round completion advances to copy rather than replaying stamp',()=>{
 const s=new Shift(); s.start();
 const h={left:away,right:away,valid:true};
 for(let i=0;i<300 && s.state!=='roundEnd';i++) s.update(.1,h);
 assert.equal(s.state,'roundEnd');
 const restored=new Shift();restored.restore(s.snapshot());
 assert.equal(restored.game.key,'copy');assert.equal(restored.results.length,1);
});
import { LAYOUT } from '../src/layout.js';

test('copy pickup includes all paper edges as soon as the cursor touches',()=>{
 const p=LAYOUT.pile, size=LAYOUT.copyPaper;
 for(const [x,y] of [[p.x-size.w/2,p.y],[p.x+size.w/2,p.y],[p.x,p.y-size.h/2-size.stackRise],[p.x,p.y+size.h/2],[p.x+size.w/2,p.y-size.h/2]]){
  const g=new CopyGame();g.update(1/60,{left:away,right:H(x,y)},ctxFor());assert.equal(g.holder,'right');
 }
 const g=new CopyGame();g.update(1/60,{left:away,right:H(.8,.9)},ctxFor());assert.equal(g.holder,null);
});

test('staple paper follows the hand offscreen and air strikes leave no floating staple',()=>{
 const g=new StapleGame(()=>0),ctx=ctxFor();
 run(g,{left:away,right:H(1.04,1.04)},ctx,3);
 assert.ok(g.stack.x>1 && g.stack.y>1);
 assert.equal(g.marks.length,0);assert.ok(g.misses>0);
});

test('new staple targets stay inside smaller paper and never repeat consecutively',()=>{
 const g=new StapleGame(()=>0);
 for(let i=0;i<12;i++){
  const old=g.targetIndex;g.nextTarget();assert.notEqual(g.targetIndex,old);
  assert.ok(Math.abs(g.target.x)+.02<LAYOUT.staplePaper.w/2);
  assert.ok(Math.abs(g.target.y)+.032<LAYOUT.staplePaper.h/2);
 }
});

test('stapler cannot score an air strike near the target edge',()=>{
 const g=new StapleGame(()=>0),ctx=ctxFor();
 run(g,{left:away,right:H(.32,.575)},ctx,3);
 assert.equal(g.count,0);assert.equal(g.marks.length,0);
});
