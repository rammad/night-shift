import test from 'node:test';
import assert from 'node:assert/strict';
import { Onboarding } from '../src/onboarding.js';
import { Shift } from '../src/shift.js';
const pose = () => ({t:100, keypoints: ['nose','left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist'].map((name,i)=>({name, x:i%2?.4:.6,y:name.includes('wrist')?.2:.5,score:1}))});
test('setup auto-continues only after a stable centered view; hands need not be raised',()=>{
 const o=new Onboarding(), p=pose();
 p.keypoints.filter(k=>k.name.includes('wrist')).forEach(k=>k.y=.8);
 for(let i=0;i<20;i++)o.update(.1,p,900);
 assert.equal(o.done,false,'stale poses never start');
 for(let i=0;i<8;i++)o.update(.1,p,100);
 assert.ok(o.hold>0);o.update(.1,null,100);assert.equal(o.hold,0);
 const off=pose();off.keypoints.forEach(k=>k.x=.85);
 for(let i=0;i<20;i++)o.update(.1,off,100);
 assert.equal(o.done,false,'off-center player waits');
 p.keypoints.find(k=>k.name==='left_wrist').score=0;
 for(let i=0;i<13;i++)o.update(.1,p,100);
 assert.equal(o.done,true,'one lowered visible hand is sufficient');
});
test('tracking loss freezes round timer and scoring until fresh hands return',()=>{
 const s=new Shift(); s.start(); const h={left:{x:.1,y:.9},right:{x:.9,y:.9},valid:true};
 for(let i=0;i<20;i++) s.update(.1,h);
 assert.equal(s.state,'play'); const time=s.timeLeft;
 for(let i=0;i<100;i++) s.update(.1,{...h,valid:false});
 assert.equal(s.timeLeft,time); assert.equal(s.game.count,0);
 s.update(.1,h); assert.ok(s.timeLeft<time);
});
