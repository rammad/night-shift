import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

function harness(granted=true, cameraResult=null){
  const elements={},tools={},hooks={},intervals=[];let now=100,requests=0,cancels=0,cameraRequests=0;
  const el=id=>elements[id]??={dataset:{},value:'mouse',hidden:false,textContent:'',onclick:null,srcObject:null,play:async()=>{},listeners:{},addEventListener(n,f){this.listeners[n]=f;}};
  const game={external(){this.mode='external';},remote(){this.mode='mouse';},resets:0,reset(){this.resets++;},resume(){},pause(){},state(){return {state:'phone',round:0,score:0,timeLeft:0,onboarding:this.onboarding};}};
  const app={media:{camera:async()=>{cameraRequests++;return await cameraResult;}},can:()=>granted,tool:(n,f)=>tools[n]=f,onEnter:f=>hooks.enter=f,onPause:f=>hooks.pause=f,onResume:f=>hooks.resume=f,saveState(){},emit(){},sense:{pose(){requests++;return ()=>cancels++;}}};
  const document={getElementById:el,createElement:()=>({}),body:{append(){}}};
  const window={isSecureContext:true,dockGame:game,addEventListener(){}};
  const code=fs.readFileSync(new URL('../little-bridge.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
  vm.runInNewContext(code,{connect:()=>app,ReachMapper:class{reset(){}},window,document,performance:{now:()=>now},setInterval:f=>intervals.push(f)});
  hooks.enter({granted:granted?['sense.pose']:[],denied:granted?[]:['sense.pose']});
  return {tools,hooks,game,elements,cameraRequests:()=>cameraRequests,requests:()=>requests,cancels:()=>cancels,tick(t){now=t;intervals.forEach(f=>f());}};
}
test('missing launch grant does not request pose or claim camera is on',()=>{
  const h=harness(false);assert.equal(h.requests(),0);assert.equal(h.game.mode,'mouse');
  assert.equal(h.tools.enable_tracking().ok,false);
  h.tick(20000);assert.equal(h.requests(),0);
  const status=JSON.parse(h.tools.get_status().detail);assert.equal(status.trackingState,'not_granted');assert.deepEqual(status.denied,['sense.pose']);
});
test('pending camera prompt is not cancelled by retry timer or repeated enable',()=>{
  const h=harness();assert.equal(h.requests(),1);
  h.tick(5000);h.tick(11000);h.tick(30000);h.tools.enable_tracking();
  assert.equal(h.requests(),1);assert.equal(h.cancels(),0);
  assert.equal(JSON.parse(h.tools.get_status().detail).trackingState,'no_frames');
});
test('remote selection stays selected across polling and host resume',()=>{
  const h=harness();h.elements.mode.value='mouse';h.elements.mode.listeners.change();
  h.tick(20000);h.hooks.pause();h.hooks.resume();
  assert.equal(h.requests(),1);assert.equal(h.cancels(),1);assert.equal(h.game.mode,'mouse');
});
test('host pause releases camera, resume requests once',()=>{
  const h=harness();h.hooks.pause();assert.equal(h.cancels(),1);
  h.hooks.resume();assert.equal(h.requests(),2);
});

test('repeated host entry does not restart an existing shift',()=>{
 const h=harness();assert.equal(h.game.resets,1);
 h.hooks.enter({granted:['sense.pose'],denied:[]});
 assert.equal(h.game.resets,1);
});

test('preview requests once during setup and releases when setup finishes',async()=>{
 let stopped=0;const stream={};const h=harness(true,{ok:true,stream,stop:()=>stopped++});
 h.game.onboarding=true;h.tick(200);await new Promise(r=>setImmediate(r));
 assert.equal(h.cameraRequests(),1);assert.equal(h.elements.video.srcObject,stream);
 h.tick(300);assert.equal(h.cameraRequests(),1);
 h.game.onboarding=false;h.tick(400);assert.equal(stopped,1);assert.equal(h.elements.video.srcObject,null);
});
test('preview obtained after setup ends is immediately released',async()=>{
 let resolve,stopped=0;const pending=new Promise(r=>resolve=r);const h=harness(true,pending);
 h.game.onboarding=true;h.tick(200);h.game.onboarding=false;h.tick(300);
 resolve({ok:true,stream:{},stop:()=>stopped++});await new Promise(r=>setImmediate(r));
 assert.equal(stopped,1);
});
