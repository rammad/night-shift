import test from 'node:test';
import assert from 'node:assert/strict';
import { Onboarding } from '../src/onboarding.js';
import { Shift } from '../src/shift.js';
const pose = () => ({t:100, keypoints: ['nose','left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist'].map((name,i)=>({name, x:i%2?.4:.6,y:name.includes('wrist')?.2:.5,score:1}))});
test('setup requires fresh visible centered evidence and a sustained one-hand raise',()=>{
 const o=new Onboarding(); const p=pose();
 for(let i=0;i<20;i++) o.update(.1,null,100);
 assert.equal(o.done,false);
 for(let i=0;i<20;i++) o.update(.1,p,900);
 assert.equal(o.done,false);
 const off=pose(); off.keypoints.forEach(k=>k.x=.85);
 assert.equal(o.update(.1,off,100).centered,false);
 const hidden=pose(); hidden.keypoints.at(-1).score=.1; hidden.keypoints.at(-2).score=.1;
 assert.equal(o.update(.1,hidden,100).visible,false);
 for(let i=0;i<8;i++) o.update(.1,p,100);
 const one=pose(); one.keypoints.at(-1).y=.8; one.keypoints.at(-2).y=.8;
 assert.equal(o.update(.1,one,100).progress,0);
 for(let i=0;i<13;i++) o.update(.1,p,100);
 assert.equal(o.done,false, 'raising starts calibration, not gameplay');
 for(let i=0;i<50;i++) o.update(.1,p,100);
 assert.equal(o.done,false, 'a stationary hand cannot calibrate');
 for(let i=0;i<50;i++) {
  const moving=pose(), wrist=moving.keypoints.find(k=>k.name===o.side+'_wrist');
  wrist.x=i%2?.25:.65; wrist.y=i%3?.3:.75;
  o.update(.1,moving,100);
 }
 assert.equal(o.done,true); assert.ok(o.calibration.w>=.65);
});
test('tracking loss freezes round timer and scoring until fresh hands return',()=>{
 const s=new Shift(); s.start(); const h={left:{x:.1,y:.9},right:{x:.9,y:.9},valid:true};
 for(let i=0;i<20;i++) s.update(.1,h);
 assert.equal(s.state,'play'); const time=s.timeLeft;
 for(let i=0;i<100;i++) s.update(.1,{...h,valid:false});
 assert.equal(s.timeLeft,time); assert.equal(s.game.count,0);
 s.update(.1,h); assert.ok(s.timeLeft<time);
});
