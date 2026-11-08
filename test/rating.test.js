import test from 'node:test';
import assert from 'node:assert/strict';
import { shiftRating } from '../src/rating.js';
import { ReachMapper } from '../src/reach.js';
test('rating rewards output, respects practice targets, and returns F for no work',()=>{
 assert.equal(shiftRating([]),'F');
 for(const [points,grade] of [[950,'A+'],[850,'A'],[700,'B'],[500,'C'],[300,'D'],[299,'F']])
  assert.equal(shiftRating([{key:'stamp',points}]),grade);
 assert.equal(shiftRating([{key:'staple',points:400}]),'A+');
 assert.equal(shiftRating([{key:'stamp',points:1000},{key:'copy',points:800},{key:'staple',points:400}]),'A+');
});
test('calibrated comfortable reach maps to the full desk and follows shoulder position',()=>{
 const m=new ReachMapper(); m.setCalibration({side:'right',cx:.5,cy:.3,w:1,h:1});
 const k={left_shoulder:{x:.6,y:.4,score:1},right_shoulder:{x:.4,y:.4,score:1}};
 m.update(k,0);
 const box=m.boxes().right;
 const top=m.toDesk('right',{x:1-box.x,y:box.y});
 const bottom=m.toDesk('right',{x:1-box.x-box.w,y:box.y+box.h});
 assert.ok(Math.abs(top.x)<1e-8 && Math.abs(top.y)<1e-8);
 assert.ok(Math.abs(bottom.x-1)<1e-8 && Math.abs(bottom.y-1)<1e-8);
});
