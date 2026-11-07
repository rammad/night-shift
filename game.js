import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const $=id=>document.getElementById(id),stage=$('stage');
const scene=new THREE.Scene();scene.background=new THREE.Color('#425e58');scene.fog=new THREE.Fog('#425e58',8,24);
const camera=new THREE.PerspectiveCamera(50,1,.1,50);camera.position.set(0,5,8);camera.lookAt(0,0,0);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power'});stage.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xd6d2a1,0x34312b,2));
function box(w,h,d,color,x=0,y=0,z=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color,flatShading:true}));m.position.set(x,y,z);scene.add(m);return m;}
box(80,.1,80,0x304c47,0,-1.2,-10);for(let i=0;i<9;i++)box(.95,.3,5, i%2?0x65513c:0x786044,i-4,-.3,0);
for(let i=0;i<14;i++)box(1.5,2+i%4,2,0x354b45,(i-7)*2,0,-15);
box(9,.2,.2,0x514235,0,1,-2);box(.2,4,.2,0x514235,-4,0,-2);box(.2,4,.2,0x514235,4,0,-2);
const board=box(4,.15,2,0x9b7944,0,0,1),fish=box(1.8,.45,.65,0x8d9960,0,.4,1),tail=box(.5,.5,.1,0x81864f,-1,.4,1),eye=box(.12,.12,.1,0xeee4b8,.65,.57,1.34),blade=box(.12,1.1,.7,0xa6aaa0,1,1.4,1),paper=box(2.5,.12,1.4,0xbdb18b,0,.2,1);
const hands={left:{x:.3,y:.6},right:{x:.7,y:.6}};let lastInput=performance.now(),space=false;
window.dockInput={push(frame){if($('mode').value!=='external')return;for(const k of ['left','right'])if(!frame[k]||!Number.isFinite(frame[k].x)||!Number.isFinite(frame[k].y))return;for(const k of ['left','right'])hands[k]={x:Math.max(0,Math.min(1,frame[k].x)),y:Math.max(0,Math.min(1,frame[k].y))};lastInput=performance.now();}};
stage.addEventListener('pointermove',e=>{if($('mode').value!=='mouse')return;const r=stage.getBoundingClientRect();hands[e.shiftKey?'left':'right']={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};});
window.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target===document.body){e.preventDefault();space=true;}});window.addEventListener('keyup',e=>{if(e.code==='Space')space=false;});window.addEventListener('blur',()=>space=false);
let active=false,job=0,end=0,score=0,phase='charge',charge=0,bite=0,cool=0,ink=0,want=0,dwell=0,prevY=.6,prevBoth=.6,previous=0;
const names=['BAIT THE HOOK','CAST & CATCH','OFF WITH THEIR HEADS','FRESH ENOUGH'];
const hints=['Bring your right hand worm to the swinging hook.','Hold both hands high to charge; sweep down. When green, pull up!','Slide fish with left hand into the center. Raise right hand, then chop down.','Hover GREEN or RED ink, then hover the package outline to stamp.'];
function round(){phase='charge';charge=0;cool=0;dwell=0;end=performance.now()+15000;$('task').textContent=names[job];$('hint').textContent=hints[job];$('inks').style.visibility=job===3?'visible':'hidden';want=Math.random()<.5?0:1;}
$('start').onclick=()=>{active=true;job=0;score=0;round();$('start').textContent='RESTART SHIFT';};
function reward(){score+=100;cool=.65;$('message').textContent=['BAITED!','DINNER!','CLEAN ENOUGH!','APPROVED!'][job];dwell=0;want=Math.random()<.5?0:1;}
let stream,pose,busy=false,lastDetect=0;
$('camera').onclick=async()=>{try{$('status').textContent='Loading camera and pose model…';const {PoseLandmarker,FilesetResolver}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm');pose??=await PoseLandmarker.createFromOptions(await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'),{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'},runningMode:'VIDEO',numPoses:1});stream??=await navigator.mediaDevices.getUserMedia({video:{width:320,height:240,frameRate:{ideal:15,max:30}},audio:false});$('video').srcObject=stream;await $('video').play();$('mode').value='camera';$('status').textContent='Camera ready. Keep both wrists in view.';}catch(e){$('status').textContent='Camera unavailable: '+e.message;}};
$('mode').onchange=()=>{if($('mode').value!=='camera'&&stream){stream.getTracks().forEach(t=>t.stop());stream=null;}lastInput=0;};
function tick(now){requestAnimationFrame(tick);if(now-previous<1000/30)return;const dt=Math.min((now-previous)/1000,.1);previous=now;
if($('mode').value==='camera'&&pose&&$('video').readyState>=2&&now-lastDetect>1000/Number($('rate').value)&&!busy){busy=true;lastDetect=now;try{const p=pose.detectForVideo($('video'),now).landmarks[0];if(p&&p[15].visibility>.5&&p[16].visibility>.5){hands.left={x:1-p[15].x,y:p[15].y};hands.right={x:1-p[16].x,y:p[16].y};lastInput=now;}}catch(e){$('status').textContent=e.message;}finally{busy=false;}}
let l=hands.left,r=hands.right;if($('mode').value==='mouse'&&space){l={x:.65,y:.15};r={x:.75,y:.15};}const valid=$('mode').value==='mouse'||now-lastInput<500;
for(const [k,h]of [['left',l],['right',r]]){$(k).style.left=h.x*100+'%';$(k).style.top=h.y*100+'%';$(k).style.opacity=valid?1:.2;}
const both=(l.y+r.y)/2,down=(r.y-prevY)/dt,up=(prevBoth-both)/dt;let tx=.5,ty=.53;
fish.visible=tail.visible=eye.visible=job===2;paper.visible=job===3;blade.visible=job===2;board.visible=job>=2;
if(active){if(now>=end){job++;if(job===4){active=false;$('task').textContent='SHIFT COMPLETE';$('message').textContent=score+' POINTS • AN HONEST DAY’S WORK';$('inks').style.visibility='hidden';}else round();}
if(active){cool=Math.max(0,cool-dt);$('clock').textContent=Math.max(0,Math.ceil((end-now)/1000));if(cool===0){$('message').textContent='';
if(job===0){tx=.5+Math.sin(now*.002)*.08;ty=.45;if(valid&&Math.hypot(r.x-tx,r.y-ty)<.12)reward();}
if(job===1){if(phase==='charge'){charge=valid&&l.y<.32&&r.y<.32?Math.min(1.5,charge+dt):charge;$('message').textContent=charge>=1.5?'SWING DOWN!':'RAISE HANDS • '+Math.floor(charge/1.5*100)+'%';if(valid&&charge>=1.5&&both>.5){phase='bite';bite=now+1400+Math.random()*1000;}}else{$('message').textContent=now>=bite&&now<bite+700?'PULL UP!':'WAIT FOR GREEN';$('target').style.borderColor=now>=bite&&now<bite+700?'#99ee65':'#e2bd64';$('target').style.scale=String(Math.max(.5,(bite-now)/2000+1));if(valid&&up>1.4){if(now>=bite&&now<bite+700)reward();else{cool=.6;$('message').textContent='TOO EARLY!';}phase='charge';charge=0;}if(now>bite+700){phase='charge';charge=0;}}}
if(job===2){fish.position.x=(l.x-.5)*7;tail.position.x=fish.position.x-1;eye.position.x=fish.position.x+.65;blade.position.y=2-r.y*2;if(valid&&Math.abs(l.x-.5)<.13&&r.y>.5&&down>1.3){reward();hands.left.x=.15;}}
if(job===3){if(r.y>.25&&r.y<.42){if(r.x<.4)ink=0;if(r.x>.6)ink=1;}$('message').textContent=(want?'EXPIRED ×':'FRESH ✓')+' • INK: '+(ink?'RED ×':'GREEN ✓');dwell=valid&&Math.hypot(r.x-tx,r.y-ty)<.12?dwell+dt:0;if(dwell>.45){if(ink===want)reward();else{cool=.6;dwell=0;$('message').textContent='WRONG STAMP!';}}}
}}}else $('clock').textContent='—';
$('target').style.left=tx*100+'%';$('target').style.top=ty*100+'%';if(job!==1){$('target').style.scale='1';$('target').style.borderColor='#f3d374';}$('score').textContent=score+' POINTS';prevY=r.y;prevBoth=both;
camera.rotation.z=Math.sin(now*.0008)*.012;renderer.render(scene,camera);}
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(Math.round(w/3),Math.round(h/3),false);camera.aspect=w/h;camera.updateProjectionMatrix();}window.addEventListener('resize',resize);resize();requestAnimationFrame(tick);
