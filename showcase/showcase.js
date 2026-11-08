import {createReferenceModels} from './reference-models.js';
import * as T from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const canvas=document.querySelector('canvas'),scene=new T.Scene();scene.background=new T.Color(0x49635d);scene.fog=new T.Fog(0x49635d,13,35);
const camera=new T.PerspectiveCamera(43,1,.1,70),renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'low-power'});renderer.setPixelRatio(1);scene.add(new T.HemisphereLight(0xe4d3a1,0x383042,2));const light=new T.DirectionalLight(0xffc67c,2);light.position.set(-3,7,4);scene.add(light);
let seed=21;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const materials=new Map();function material(color){if(materials.has(color))return materials.get(color);const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d');ctx.fillStyle='#'+color.toString(16).padStart(6,'0');ctx.fillRect(0,0,32,32);for(let i=0;i<45;i++){ctx.fillStyle=random()>.5?'rgba(34,24,37,.22)':'rgba(215,184,111,.13)';ctx.fillRect(random()*32|0,random()*32|0,2+(random()*5|0),2+(random()*6|0));}const tex=new T.CanvasTexture(c);tex.magFilter=tex.minFilter=T.NearestFilter;tex.colorSpace=T.SRGBColorSpace;const m=new T.MeshLambertMaterial({map:tex,flatShading:true});materials.set(color,m);return m;}
const world=new T.Group();scene.add(world);function mesh(g,geometry,color,x=0,y=0,z=0){const m=new T.Mesh(geometry,material(color));m.position.set(x,y,z);g.add(m);return m;}const box=(g,c,x,y,z,w,h,d)=>mesh(g,new T.BoxGeometry(w,h,d),c,x,y,z);const cyl=(g,c,x,y,z,r1,r2,h,n=6)=>mesh(g,new T.CylinderGeometry(r1,r2,h,n),c,x,y,z);function group(x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);world.add(g);return g;}function bar(g,c,a,b,r=.035){const v=new T.Vector3(...a),d=new T.Vector3(...b).sub(v),m=cyl(g,c,0,0,0,r,r,d.length(),5);m.position.copy(v.addScaledVector(d,.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
box(world,0x355651,0,-.65,-4,80,.1,80);for(let i=0;i<12;i++){const p=box(world,i%2?0x766044:0x62503c,(i-5.5)*.65,-.1,0,.61,.22,6);p.rotation.z=(random()-.5)*.025;}
for(const x of [-3.7,3.7])for(const z of [-2.7,2.7]){cyl(world,0x59422f,x,.45,z,.15,.22,1.8);for(let i=0;i<3;i++)cyl(world,0x998451,x,.87+i*.1,z,.19,.19,.06);}
// Crooked wall, roof and amber lamp frame the workspace.
for(let i=0;i<7;i++)box(world,i%2?0x594936:0x6b4e38,1.2+i*.39,1.8,-2.4,.35,3.7,.15);
bar(world,0x4d382d,[-.5,0,-2.4],[-.65,4.1,-2.4],.13);bar(world,0x4d382d,[-.65,4.1,-2.4],[3.9,4,-2.4],.14);const roof=box(world,0x554130,1.65,4,-1.7,4.8,.17,2);roof.rotation.z=-.045;
bar(world,0x302e26,[.3,4,-1.7],[.3,3.5,-1.7],.025);cyl(world,0x6a5530,.3,3.45,-1.7,.13,.48,.22);const bulb=cyl(world,0xffce78,.3,3.29,-1.7,.18,.18,.18);bulb.material=new T.MeshBasicMaterial({color:0xffd48a});
const table=group(.7,0,.3);box(table,0x795635,0,1.05,0,4.3,.2,1.8);for(const x of [-1.8,1.8])for(const z of [-.65,.65])box(table,0x513c2b,x,.5,z,.17,1,.17);
box(table,0xaa874c,-.65,1.2,.1,1.9,.12,1.2);for(let i=0;i<9;i++){const cut=box(table,0x5b4935,-1.3+random()*1.3,1.265,-.3+random()*.7,.025,.005,.3);cut.rotation.y=random();}
function fish(g,x,y,z,s=1){const f=new T.Group();f.position.set(x,y,z);f.scale.setScalar(s);g.add(f);mesh(f,new T.SphereGeometry(.35,7,4),0x8e9154).scale.set(1.8,.8,.7);const tail=mesh(f,new T.ConeGeometry(.33,.4,3),0x776343,-.7,0,0);tail.rotation.z=Math.PI/2;mesh(f,new T.ConeGeometry(.2,.35,3),0x74643e,0,.3,0);box(f,0xddd3a0,.35,.12,.22,.2,.2,.08);box(f,0x222a26,.4,.12,.27,.08,.1,.04);box(f,0x42382b,.56,-.08,.17,.15,.13,.08);return f;}fish(table,-.65,1.55,.15);
const cleaver=group(.4,1.5,.5);const steel=box(cleaver,0x9b9c8b,0,0,0,.5,.55,.06);cleaver.rotation.z=-.3;box(cleaver,0x563d2e,0,.48,0,.13,.45,.13);box(cleaver,0x80704e,.12,-.1,.035,.13,.1,.005);
function stamp(x,c){box(table,0x5b3d2a,x,1.3,-.45,.55,.13,.4);cyl(table,c,x,1.6,-.45,.13,.09,.5);box(table,0xb4a777,x,1.32,-.22,.44,.12,.01);}stamp(1,0x526337);stamp(1.7,0x783a31);
box(table,0xb7a780,1.2,1.23,.4,1.1,.16,.6);box(table,0x75674a,1.2,1.32,.4,.035,.015,.6);
const bucket=group(-2.9,.4,1.3);cyl(bucket,0x636d60,0,0,0,.4,.31,.7,8);cyl(bucket,0x292e28,0,.36,0,.34,.34,.02,8);for(let i=0;i<3;i++)fish(bucket,(i-1)*.15,.38,0,.4);
function bottle(g,x,y,z){cyl(g,0x46592e,x,y,z,.13,.17,.55,5);cyl(g,0x536332,x,y+.4,z,.06,.06,.25,5);box(g,0xc0ad79,x,y,z+.15,.2,.25,.02);}bottle(world,-2.4,.32,.6);bottle(table,1.8,1.55,.4);
// Hidden face: silhouette, hat, beard and hunched posture carry the character.
const man=group(-2,0,-.9);box(man,0x463627,0,.45,0,.7,.15,.6);for(const x of [-.25,.25])box(man,0x413329,x,.2,0,.1,.5,.1);
for(const x of [-.23,.23]){const leg=box(man,0x9b7c32,x,.52,.38,.32,.85,.38);leg.rotation.x=-.3;box(man,0x3e4431,x,.15,.7,.4,.27,.65);}
const torso=box(man,0x584051,0,1.22,.05,.85,.95,.55);torso.rotation.x=.22;box(man,0xa08434,0,1.12,.37,.67,.62,.08);for(const x of [-.25,.25]){box(man,0xb19643,x,1.5,.35,.1,.5,.05);box(man,0xc0ad79,x,1.35,.39,.17,.15,.06);bar(man,0x584052,[x*2,1.55,.05],[x*2,1,.65],.18);box(man,0xad8060,x*2,.94,.67,.23,.27,.24);}
cyl(man,0x252723,0,1.88,.18,.25,.28,.45,5);const beard=mesh(man,new T.ConeGeometry(.23,.35,4),0x938774,0,1.73,.42);beard.rotation.z=Math.PI;mesh(man,new T.ConeGeometry(.12,.2,4),0xb98062,0,1.96,.46).rotation.x=Math.PI/2;const hat=cyl(man,0xa88732,0,2.2,.13,.13,.71,.5,7);hat.rotation.x=.15;
// Sparse harbor silhouettes and reflections.
for(let i=0;i<11;i++){const x=(i-5)*3.2,h=1+random()*3;box(world,0x3c514d,x,h/2-1,-13,2,h,2);for(let j=0;j<2;j++)box(world,0xb09a57,x-.4+j*.7,h*.4,-11.98,.17,.23,.01);}
for(const x of [-7,5]){bar(world,0x334b47,[x,-.5,-10],[x,5,-10],.08);bar(world,0x334b47,[x-2,4.5,-10],[x+2,5.5,-10],.07);}
for(let i=0;i<25;i++)box(world,0x637666,(random()-.5)*22,-.58,-3-random()*16,.3+random(),.01,.08);
// Art pass 03: shaped silhouettes, still flat shaded and texture limited.
function oval(g,c,x,y,z,sx,sy,sz){const m=mesh(g,new T.SphereGeometry(1,10,6),c,x,y,z);m.scale.set(sx,sy,sz);return m;}
function profile(g,c,points,x,y,z,segments=12){return mesh(g,new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),segments),c,x,y,z);}
// Replace block clothing with articulated sleeves, knees, cuffs and boots.
for(const child of [...man.children]){man.remove(child);child.geometry?.dispose();}
cyl(man,0x55402d,0,.48,0,.43,.4,.13,10);for(const x of [-.27,.27])for(const z of [-.2,.2])bar(man,0x49372a,[x,.45,z],[x*1.2,0,z*1.2],.055);
oval(man,0x584051,0,1.27,.02,.49,.58,.33).rotation.x=.24;
oval(man,0xa08737,0,.94,.19,.43,.35,.34);
for(const side of [-1,1]){
 const x=side*.27;
 bar(man,0xa08737,[x,.98,.15],[x*1.25,.68,.58],.22);
 oval(man,0xa88b3a,x*1.25,.67,.58,.24,.23,.25);
 bar(man,0x96782f,[x*1.25,.65,.59],[x*1.3,.26,.64],.18);
 oval(man,0x394132,x*1.3,.16,.8,.23,.17,.38);
 cyl(man,0x424a36,x*1.3,.32,.63,.2,.21,.25,8);
 bar(man,0x594151,[side*.4,1.55,.06],[side*.6,1.2,.27],.2);
 oval(man,0x63495a,side*.6,1.18,.29,.2,.21,.19);
 bar(man,0x584052,[side*.6,1.17,.3],[side*.48,.95,.69],.16);
 cyl(man,0x443547,side*.48,.98,.66,.17,.16,.13,8).rotation.x=.5;
 oval(man,0xb68768,side*.48,.9,.74,.16,.2,.13);
 oval(man,0xa97b5d,side*.36,.9,.79,.075,.12,.08);
 box(man,0xb39442,side*.27,1.43,.32,.105,.55,.06).rotation.z=side*-.1;
 box(man,0xc0b184,side*.27,1.3,.38,.16,.14,.04);box(man,0x554536,side*.27,1.3,.405,.085,.065,.015);
}
const bib=box(man,0xa78938,0,1.13,.38,.63,.48,.09);bib.rotation.x=.12;
box(man,0x8e7331,0,1.12,.44,.29,.19,.035);
oval(man,0x272928,0,1.9,.2,.27,.3,.25);
// A low swept brim hides the eyes from the default view.
const brim=profile(man,0xa88b3d,[[.05,0],[.3,.03],[.48,-.03],[.68,-.16],[.73,-.22]],0,2.17,.19,14);brim.rotation.x=.18;
profile(man,0xaf9241,[[.42,0],[.37,.17],[.25,.35],[.13,.39],[0,.39]],0,2.17,.17,12).rotation.x=.1;
profile(man,0x75643a,[[.38,0],[.39,.065]],0,2.23,.17,12);
oval(man,0xb78061,0,1.94,.46,.085,.11,.1);
for(let i=0;i<5;i++){const b=mesh(man,new T.ConeGeometry(.075,.22+(i%2)*.04,4),0x918574,(i-2)*.075,1.72,.42);b.rotation.z=Math.PI;}
// More recognizable fish: bulging eyes, lips, gills, dorsal ridge and forked tail.
for(const parent of [table,bucket])for(const f of [...parent.children].filter(o=>o.isGroup)){
 for(const child of [...f.children]){f.remove(child);child.geometry?.dispose();}
 oval(f,0x8e9458,0,0,0,.62,.29,.26);oval(f,0xa9a778,.14,-.12,.03,.43,.15,.22);
 oval(f,0x858a50,.4,.04,0,.29,.28,.26);
 for(const side of [-1,1]){oval(f,0xd8d1a0,.42,.15,side*.22,.13,.13,.07);oval(f,0x292b23,.46,.15,side*.28,.055,.065,.025);const gill=mesh(f,new T.TorusGeometry(.18,.018,3,8,Math.PI),0x5c6240,.18,.01,side*.24);gill.rotation.z=Math.PI/2;}
 const mouth=mesh(f,new T.TorusGeometry(.115,.035,4,8),0x9f8969,.64,-.045,0);mouth.rotation.y=Math.PI/2;
 for(const side of [-1,1]){const t=mesh(f,new T.ConeGeometry(.2,.42,3),0x7e674d,-.72,side*.13,0);t.rotation.z=Math.PI/2+side*.45;t.scale.z=.35;}
 for(let i=0;i<4;i++){const fin=mesh(f,new T.ConeGeometry(.12,.25,3),0x776849,-.3+i*.15,.31,0);fin.scale.z=.35;fin.rotation.z=.35;}
}
// Curved bottle shoulders and carved stamp grips.
for(const x of [1,1.7])profile(table,x===1?0x50643b:0x803e35,[[.1,0],[.09,.13],[.17,.22],[.18,.32],[.12,.37],[0,.38]],x,1.52,-.45,10);
for(const x of [-.045,.045])oval(cleaver,0xc3b888,x,.5,.071,.025,.025,.012);
// Coiled rope, a sagging net, crate and wall-mounted fish sign.
for(let i=0;i<4;i++){const rope=mesh(world,new T.TorusGeometry(.28+i*.045,.024,4,14),0x98835b,3,0.07,1.9);rope.rotation.x=Math.PI/2;}
const netPositions=[];function netLine(a,b){netPositions.push(...a,...b);}for(let i=0;i<7;i++)for(let j=0;j<7;j++){const x=1.1+i*.23,y=2+j*.2,z=-2.24+Math.sin(i*.5)*.08;if(i<6)netLine([x,y,z],[x+.23,y-.08,z]);if(j<6)netLine([x,y,z],[x,y+.2,z]);}const netGeometry=new T.BufferGeometry();netGeometry.setAttribute('position',new T.Float32BufferAttribute(netPositions,3));world.add(new T.LineSegments(netGeometry,new T.LineBasicMaterial({color:0x96845c})));
for(let i=0;i<3;i++){box(world,0x745738,2.9,.16+i*.17,-.9,1,.13,.07);box(world,0x745738,2.9,.16+i*.17,-1.6,1,.13,.07);}for(const x of [2.43,3.37])box(world,0x58422e,x,.3,-1.25,.08,.65,.8);
box(world,0xb09b6c,3,2.65,-2.25,.8,.65,.055);oval(world,0x4a4b38,3,2.65,-2.2,.25,.1,.02);

man.visible=false;cleaver.visible=false;table.visible=false;const referenceModels=createReferenceModels(T);scene.add(referenceModels.root);
let target=new T.Vector3(0,1,0),distance=10,azimuth=.15,elevation=.24,rotating=false,drag=false,px=0,py=0;
canvas.onpointerdown=e=>{drag=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId);};canvas.onpointerup=()=>drag=false;canvas.onpointermove=e=>{if(drag){azimuth-=(e.clientX-px)*.007;elevation=Math.max(.03,Math.min(1.1,elevation+(e.clientY-py)*.005));px=e.clientX;py=e.clientY;}};canvas.onwheel=e=>{e.preventDefault();distance=Math.max(3,Math.min(18,distance+e.deltaY*.01));};
document.querySelector('#wide').onclick=()=>{target.set(0,1,0);distance=10;azimuth=.15;elevation=.24;};document.querySelector('#character').onclick=()=>{target.set(-2,1.5,-.7);distance=4.7;azimuth=.15;elevation=.15;};document.querySelector('#props').onclick=()=>{target.set(.7,1.3,.3);distance=4.5;azimuth=.1;elevation=.55;};document.querySelector('#spin').onclick=e=>{rotating=!rotating;e.target.textContent='ROTATE: '+(rotating?'ON':'OFF');};
document.querySelector('#fish').onclick=()=>{target.set(.3,1.4,1.45);distance=5.5;azimuth=0;elevation=.22;};
function resize(){renderer.setSize(Math.round(innerWidth/2.5),Math.round(innerHeight*.78/2.5),false);camera.aspect=innerWidth/(innerHeight*.78);camera.updateProjectionMatrix();}onresize=resize;resize();let last=0;function frame(t){requestAnimationFrame(frame);if(t-last<33)return;last=t;if(rotating)azimuth+=.003;camera.position.set(target.x+Math.sin(azimuth)*Math.cos(elevation)*distance,target.y+Math.sin(elevation)*distance,target.z+Math.cos(azimuth)*Math.cos(elevation)*distance);camera.lookAt(target);renderer.render(scene,camera);}requestAnimationFrame(frame);
