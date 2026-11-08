import test from 'node:test';
import assert from 'node:assert/strict';
import { TrackedHands } from '../src/input.js';
test('one visible hand keeps tracking live; no hands expires; smoothing reduces jitter',()=>{
 const t=new TrackedHands();
 assert.equal(t.push({right:{x:.5,y:.5}},100),true);
 assert.equal(t.sample(100,1/60).valid,true);
 t.push({right:{x:.52,y:.5}},116);
 const s=t.sample(116,1/60);
 assert.ok(s.right.x>.5 && s.right.x<.51);
 assert.equal(t.push({},200),false);
 assert.equal(t.sample(700,1/60).valid,false);
 assert.equal(t.push({left:{x:.3,y:.4}},800),true);
 assert.equal(t.sample(800,1/60).valid,true);
});
