// Authored ring topology -> glTF 2.0 binary. No runtime primitive construction.
// Units: metres, Y up, front +Z. Joint weights and UVs are generated at authoring time.
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve(import.meta.dirname,'../models');
const colors=['#d2a13a','#624351','#4b5136','#ad9f91','#c38b73','#242824','#946441','#c7b483','#8d9659','#836149','#d6cba1','#557d79','#999b91','#76543b','#c5b185','#87503e','#4f713e','#ccd7d6'];
function asset(name){
 const positions=[],normals=[],uv=[],joints=[],weights=[],indices=[],bones=[],parts=[];
 function bone(name,parent,p){bones.push({name,parent,p});return bones.length-1;}
 const root=bone('root',-1,[0,0,0]);
 function vertex(p,n,u,v,w){positions.push(...p);normals.push(...n);uv.push(u,v);const entries=w||[[0,1]];joints.push(...[0,1,2,3].map(i=>entries[i]?.[0]||0));weights.push(...[0,1,2,3].map(i=>entries[i]?.[1]||0));return positions.length/3-1;}
 // Explicit cross-section profiles. Each ring is [x,y,z,halfWidth,halfDepth].
 function loft(label,rings,color,weight=()=>[[0,1]],segments=18,axis='y'){
 const start=indices.length,base=positions.length/3;
 for(let k=0;k<rings.length;k++){const [x,y,z,a,b]=rings[k];for(let j=0;j<=segments;j++){const t=j/segments*Math.PI*2,c=Math.cos(t),s=Math.sin(t);const p=axis==='x'?[x,y+c*a,z+s*b]:[x+c*a,y,z+s*b];const n=axis==='x'?[0,c,s]:[c,0,s];vertex(p,n,j/segments,k/(rings.length-1),weight(p,k));}}
 const stride=segments+1;for(let k=0;k<rings.length-1;k++)for(let j=0;j<segments;j++){const a=base+k*stride+j,b=a+stride;if(axis==='x')indices.push(a,a+1,b,b,a+1,b+1);else indices.push(a,b,a+1,b,b+1,a+1);}
 for(const [k,reverse]of [[0,true],[rings.length-1,false]]){const r=rings[k],center=vertex(r.slice(0,3),axis==='x'?[reverse?-1:1,0,0]:[0,reverse?-1:1,0],.5,.5,weight(r,k));for(let j=0;j<segments;j++){const a=base+k*stride+j;if((axis==='y')===reverse)indices.push(center,a,a+1);else indices.push(center,a+1,a);}}
 parts.push({label,color,start,count:indices.length-start});
 }
 function plate(label,points,depth,color,w=[[0,1]]){const start=indices.length,base=positions.length/3;for(const zoff of [-depth/2,depth/2])for(const p of points)vertex([p[0],p[1],p[2]+zoff],[0,0,zoff>0?1:-1],p[0],p[1],w);const n=points.length;for(let i=1;i<n-1;i++)indices.push(base,base+i+1,base+i,base+n,base+n+i,base+n+i+1);for(let i=0;i<n;i++){const j=(i+1)%n;indices.push(base+i,base+j,base+n+i,base+j,base+n+j,base+n+i);}parts.push({label,color,start,count:indices.length-start});}
 function patch(x,y,z,w,h,b){plate('stitched repair',[[x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z]],.006,6,[[b,1]]);for(let i=0;i<4;i++)for(const sign of [-1,1]){const xx=x-w*.38+i*w*.25,yy=y+sign*h*.5;plate('thread',[[xx-.005,yy-.018,z+.005],[xx+.005,yy-.018,z+.005],[xx+.005,yy+.018,z+.005],[xx-.005,yy+.018,z+.005]],.002,7,[[b,1]]);}}
 function sweep(label,points,r,color,w=[[0,1]],sides=10){
const base=positions.length/3,start=indices.length;for(let i=0;i<points.length;i++){const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)],t=after.map((v,k)=>v-before[k]);const len=Math.hypot(...t)||1;for(let k=0;k<3;k++)t[k]/=len;let u=Math.abs(t[1])>.9?[1,0,0]:[t[2],0,-t[0]];const ul=Math.hypot(...u)||1;u=u.map(v=>v/ul);const v=[t[1]*u[2]-t[2]*u[1],t[2]*u[0]-t[0]*u[2],t[0]*u[1]-t[1]*u[0]];for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,n=u.map((x,k)=>x*Math.cos(a)+v[k]*Math.sin(a));vertex(points[i].map((x,k)=>x+n[k]*r),n,j/sides,i/(points.length-1),w);}}for(let i=0;i<points.length-1;i++)for(let j=0;j<sides;j++){const a=base+i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}parts.push({label,color,start,count:indices.length-start});}
function eyelet(label,cx,cy,z,r,outer,depth,color,w,axis='z'){const start=indices.length,base=positions.length/3,n=24;for(const dz of [-depth/2,depth/2])for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;for(const rr of [r,outer])vertex(axis==='x'?[cx+dz,cy+Math.cos(a)*rr,z+Math.sin(a)*rr]:[cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,z+dz],axis==='x'?[dz>0?1:-1,0,0]:[0,0,dz>0?1:-1],i/n,rr===r?0:1,w);}for(let i=0;i<n;i++){let a=base+i*2,b=a+2,k=(n+1)*2;indices.push(a,b,a+1,b,b+1,a+1,a+k,a+k+1,b+k,b+k,a+k+1,b+k+1,a,a+k,b,b,a+k,b+k,a+1,b+1,a+k+1,b+1,b+k+1,a+k+1);}parts.push({label,color,start,count:indices.length-start});}
function save(clips=[]){
if(name==='fisherman'){const reshape=p=>{const y=p[1];return [p[0]*(y<1.65?.87:.96),y<.95?y*1.3:y+.285,p[2]*(y<1.6?.9:1)];};for(let i=0;i<positions.length;i+=3){const p=reshape(positions.slice(i,i+3));positions.splice(i,3,...p);}for(const bone of bones)bone.p=reshape(bone.p);}

 const chunks=[],views=[],accessors=[];let offset=0;
 function acc(data,type,componentType,components){const bytes=Buffer.from(data.buffer,data.byteOffset,data.byteLength),pad=(4-offset%4)%4;if(pad){chunks.push(Buffer.alloc(pad));offset+=pad;}const view=views.length;views.push({buffer:0,byteOffset:offset,byteLength:bytes.length});chunks.push(bytes);offset+=bytes.length;const a={bufferView:view,componentType,count:data.length/components,type};if(type==='VEC3'||type==='SCALAR'){a.min=Array(components).fill(Infinity);a.max=Array(components).fill(-Infinity);for(let i=0;i<data.length;i++){a.min[i%components]=Math.min(a.min[i%components],data[i]);a.max[i%components]=Math.max(a.max[i%components],data[i]);}}accessors.push(a);return accessors.length-1;}
 // Recompute normals from authored faces for correctly tapered and bent surfaces.
 normals.fill(0);for(let i=0;i<indices.length;i+=3){const ids=indices.slice(i,i+3),p=ids.map(n=>positions.slice(n*3,n*3+3)),a=p[1].map((v,k)=>v-p[0][k]),b=p[2].map((v,k)=>v-p[0][k]),n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];for(const id of ids)for(let k=0;k<3;k++)normals[id*3+k]+=n[k];}for(let i=0;i<normals.length;i+=3){const l=Math.hypot(...normals.slice(i,i+3))||1;for(let j=0;j<3;j++)normals[i+j]/=l;}
 const attrs={POSITION:acc(new Float32Array(positions),'VEC3',5126,3),NORMAL:acc(new Float32Array(normals),'VEC3',5126,3),TEXCOORD_0:acc(new Float32Array(uv),'VEC2',5126,2),JOINTS_0:acc(new Uint16Array(joints),'VEC4',5123,4),WEIGHTS_0:acc(new Float32Array(weights),'VEC4',5126,4)};
 const nodes=bones.map(b=>({name:b.name,translation:b.parent<0?b.p:b.p.map((v,i)=>v-bones[b.parent].p[i]),children:[]}));bones.forEach((b,i)=>{if(b.parent>=0)nodes[b.parent].children.push(i);});nodes.forEach(n=>{if(!n.children.length)delete n.children;});const ibm=[];for(const b of bones)ibm.push(1,0,0,0,0,1,0,0,0,0,1,0,-b.p[0],-b.p[1],-b.p[2],1);
 const skin={joints:bones.map((_,i)=>i),skeleton:0,inverseBindMatrices:acc(new Float32Array(ibm),'MAT4',5126,16)};
 const animations=clips.map(c=>{const samplers=[],channels=[];for(const t of c.tracks){const times=t.keys.map(k=>k[0]),values=t.keys.flatMap(k=>{const a=k[1]/2,s=Math.sin(a);return [t.axis[0]*s,t.axis[1]*s,t.axis[2]*s,Math.cos(a)];});samplers.push({input:acc(new Float32Array(times),'SCALAR',5126,1),output:acc(new Float32Array(values),'VEC4',5126,4),interpolation:'LINEAR'});channels.push({sampler:samplers.length-1,target:{node:t.bone,path:'rotation'}});}return {name:c.name,samplers,channels};});
 const grouped=[...new Set(parts.map(p=>p.color))].map(color=>({color,label:colors[color],list:parts.filter(p=>p.color===color).flatMap(p=>indices.slice(p.start,p.start+p.count))}));const primitives=grouped.map(p=>({attributes:attrs,indices:acc(new Uint32Array(p.list),'SCALAR',5125,1),material:p.color,extras:{part:p.label}}));
 nodes.push({name,mesh:0,skin:0});const gltf={asset:{version:'2.0',generator:'Dock Drunk authored mesh pipeline'},scene:0,scenes:[{nodes:[0,nodes.length-1]}],nodes,meshes:[{name,primitives}],skins:[skin],animations,materials:colors.map(c=>({name:c,pbrMetallicRoughness:{baseColorFactor:[...c.slice(1).match(/../g).map(h=>parseInt(h,16)/255),1],metallicFactor:0,roughnessFactor:1},doubleSided:true})),buffers:[{byteLength:offset}],bufferViews:views,accessors,extras:{triangles:indices.length/3,vertices:positions.length/3,bones:bones.length,source:'showcase/model-source/build-models.mjs'}};
 let json=Buffer.from(JSON.stringify(gltf));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);let bin=Buffer.concat(chunks);bin=Buffer.concat([bin,Buffer.alloc((4-bin.length%4)%4)]);const header=Buffer.alloc(12);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);const jh=Buffer.alloc(8),bh=Buffer.alloc(8);jh.writeUInt32LE(json.length);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync(path.join(out,name+'.glb'),Buffer.concat([header,jh,json,bh,bin]));return {name,...gltf.extras,clips:clips.map(c=>c.name)};
 }
 return {bone,loft,plate,patch,sweep,eyelet,save};
}
const manifest=[];
{
 const a=asset('fisherman'),hip=a.bone('pelvis',0,[0,.92,0]),spine=a.bone('spine',hip,[0,1.22,0]),chest=a.bone('chest',spine,[0,1.48,0]),head=a.bone('head',chest,[0,1.76,0]);
 const torsoWeight=p=>p[1]<1.12?[[hip,1]]:p[1]<1.4?[[spine,.75],[chest,.25]]:[[chest,1]];
 a.loft('tailored shirt',[[0,.99,0,.29,.19],[0,1.15,0,.34,.22],[0,1.38,-.025,.36,.23],[0,1.55,-.04,.39,.21],[0,1.65,-.03,.26,.16],[0,1.72,0,.12,.12]],1,torsoWeight);
 a.loft('bib and seat',[[0,.91,0,.29,.18],[0,1.02,.015,.3,.2],[0,1.18,.025,.29,.21],[0,1.36,.08,.24,.19]],0,torsoWeight);
 const arms=[];for(const s of [-1,1]){const thigh=a.bone((s<0?'left':'right')+'_thigh',hip,[s*.17,.93,0]),knee=a.bone((s<0?'left':'right')+'_knee',thigh,[s*.19,.53,0]),ankle=a.bone((s<0?'left':'right')+'_ankle',knee,[s*.2,.18,0]);
 a.loft('trouser leg',[[s*.2,.26,0,.12,.13],[s*.2,.34,0,.13,.135],[s*.2,.42,-.015,.12,.13],[s*.19,.5,.005,.125,.14],[s*.19,.55,.025,.14,.155],[s*.19,.6,.015,.135,.15],[s*.18,.73,0,.155,.17],[s*.17,.88,0,.17,.18],[s*.16,.99,0,.18,.19]],0,p=>p[1]>.65?[[thigh,1]]:p[1]>.46?[[thigh,.4],[knee,.6]]:[[knee,1]]);
 a.loft('rubber boot',[[s*.2,.025,.07,.15,.25],[s*.2,.07,.08,.16,.26],[s*.2,.16,.07,.15,.24],[s*.2,.21,.015,.12,.15],[s*.2,.36,0,.125,.135]],2,()=>[[ankle,1]]);
 const shoulder=a.bone((s<0?'left':'right')+'_upper_arm',chest,[s*.33,1.55,0]),elbow=a.bone((s<0?'left':'right')+'_forearm',shoulder,[s*.48,1.22,0]),hand=a.bone((s<0?'left':'right')+'_hand',elbow,[s*.56,.96,0]);arms.push({shoulder,elbow,hand});
 a.loft('shaped sleeve',[[s*.56,.96,0,.078,.08],[s*.55,1,0,.105,.1],[s*.53,1.09,0,.11,.11],[s*.5,1.18,0,.095,.1],[s*.48,1.23,.015,.105,.11],[s*.47,1.28,.015,.115,.12],[s*.43,1.37,0,.135,.14],[s*.39,1.48,0,.145,.15],[s*.33,1.56,0,.14,.15]],1,p=>p[1]>1.35?[[shoulder,1]]:p[1]>1.18?[[shoulder,.4],[elbow,.6]]:[[elbow,1]]);
 a.loft('mitten hand',[[s*.57,.73,.02,.055,.065],[s*.58,.77,.025,.085,.08],[s*.57,.88,.02,.095,.08],[s*.55,.98,0,.075,.075]],4,()=>[[hand,1]],8);
 a.loft('thumb',[[s*.48,.79,.07,.035,.045],[s*.46,.85,.08,.04,.05],[s*.49,.92,.05,.04,.04]],4,()=>[[hand,1]],6);
 a.plate('suspender',[[s*.25,1.3,.29],[s*.16,1.3,.29],[s*.2,1.6,.18],[s*.28,1.6,.18]],.015,0,[[chest,1]]);
 a.plate('brass buckle',[[s*.25-.065,1.31,.31],[s*.25+.065,1.31,.31],[s*.25+.065,1.43,.31],[s*.25-.065,1.43,.31]],.02,7,[[chest,1]]);
 a.plate('buckle inset',[[s*.25-.035,1.335,.325],[s*.25+.035,1.335,.325],[s*.25+.035,1.4,.325],[s*.25-.035,1.4,.325]],.005,13,[[chest,1]]);
 a.patch(s*.2,.51,.17,.14,.15,knee);
a.loft('rolled sleeve cuff',[[s*.56,.96,0,.085,.085],[s*.555,.985,0,.112,.108],[s*.55,1.025,0,.112,.108],[s*.548,1.045,0,.095,.095]],1,()=>[[elbow,1]],16);
a.loft('boot sole welt',[[s*.2,.024,.07,.158,.255],[s*.2,.047,.07,.163,.26],[s*.2,.066,.07,.16,.255]],5,()=>[[ankle,1]],18);
for(let finger=0;finger<3;finger++){const x=s*.57+(finger-1)*.04;a.loft('finger knuckle',[[x,.755,.075,.016,.02],[x,.79,.095,.022,.025],[x,.84,.09,.02,.02]],4,()=>[[hand,1]],8);}
a.plate('rear suspender',[[s*.15,1.1,-.22],[s*.23,1.1,-.22],[s*.28,1.58,-.15],[s*.2,1.58,-.15]],.012,0,[[chest,1]]);
a.plate('back pocket',[[s*.15-.075,1,-.21],[s*.15+.075,1,-.21],[s*.15+.075,1.13,-.21],[s*.15-.075,1.13,-.21]],.012,0,[[hip,1]]);
 }
 a.plate('bib pocket',[[-.13,1.08,.267],[.13,1.08,.267],[.13,1.24,.267],[-.13,1.24,.267]],.015,0,[[spine,1]]);
 a.loft('shadowed head',[[0,1.65,0,.12,.1],[0,1.8,0,.2,.17],[0,1.98,0,.18,.16]],5,()=>[[head,1]]);
 a.loft('rounded beard',[[0,1.42,.2,.04,.05],[0,1.47,.2,.15,.13],[0,1.56,.21,.25,.2],[0,1.7,.21,.3,.23],[0,1.82,.19,.26,.21],[0,1.89,.15,.16,.14]],3,()=>[[head,1]],14);
 a.loft('nose',[[0,1.84,.36,.06,.065],[0,1.91,.3,.05,.055],[0,1.95,.24,.025,.03]],4,()=>[[head,1]],6);
 a.loft('rain hat crown',[[0,1.97,0,.32,.27],[0,2.07,0,.29,.24],[0,2.24,0,.18,.17],[0,2.28,0,.13,.13]],0,()=>[[head,1]],14);
 a.loft('swept hat brim',[[0,1.89,.01,.48,.4],[0,1.92,.01,.47,.39],[0,1.97,0,.36,.3],[0,2.015,0,.31,.26]],0,()=>[[head,1]],16);
 a.patch(.08,2.14,.214,.12,.12,head);a.patch(-.2,1.935,.34,.1,.065,head);
 for(const side of [-1,1])a.loft('rounded moustache',[[side*.1,1.79,.36,.06,.045],[side*.1,1.84,.38,.12,.065],[side*.08,1.875,.34,.08,.045]],3,()=>[[head,1]],12);
const track=(bone,axis,keys)=>({bone,axis,keys});manifest.push(a.save([{name:'Idle',tracks:[track(spine,[0,0,1],[[0,-.025],[1.5,.025],[3,-.025]]),track(head,[1,0,0],[[0,.03],[1.5,-.03],[3,.03]])]},{name:'Cast',tracks:arms.flatMap(b=>[track(b.shoulder,[1,0,0],[[0,0],[.7,-2.4],[1.4,-2.4],[1.65,.65],[2.2,0]]),track(b.elbow,[1,0,0],[[0,0],[.7,-.7],[1.4,-.7],[1.65,-.15],[2.2,0]])])},{name:'Chop',tracks:[track(arms[1].shoulder,[1,0,0],[[0,0],[.6,-1.8],[.85,.35],[1.3,0]]),track(arms[1].elbow,[1,0,0],[[0,0],[.6,-.8],[.85,-.1],[1.3,0]])]}]));
}
for(const [type,name] of ['perch','mackerel','flatfish'].entries()){
 const a=asset(name),spine=a.bone('spine',0,[0,0,0]),tail=a.bone('tail',spine,[-.5,0,0]),tip=a.bone('tail_tip',tail,[-.85,0,0]),jaw=a.bone('jaw',spine,[.5,-.1,0]);const flat=type===2,long=type===1,c=long?11:flat?9:8,L=long?1.25:.9;
 const w=p=>p[0]<-.7?[[tip,.7],[tail,.3]]:p[0]<-.35?[[tail,.65],[spine,.35]]:[[spine,1]];
 a.loft('continuous fish body',[[-L,0,0,.035,.035],[-L*.75,0,0,flat?.07:.12,flat?.25:.1],[-.3,0,0,flat?.12:.28,flat?.5:.22],[.1,0,0,flat?.12:.34,flat?.52:.25],[.45,0,0,flat?.1:.3,flat?.35:.23],[.65,-.04,0,.1,.13]],c,w,24,'x');
 for(const s of [-1,1])a.plate('forked tail',[[-L+.1,0,0],[-L-.45,s*.32,0],[-L-.36,s*.05,0],[-L-.18,0,0]],.035,9,[[tip,1]]);
 a.plate('dorsal fin',[[-.5,.15,0],[-.4,.43,0],[-.2,.36,0],[0,.51,0],[.2,.3,0]],.025,9,[[spine,1]]);
 for(const s of [-1,1]){const ey=flat?.15:.16,ez=flat?s*.22:s*.24;a.loft('eye',[ [.4,ey-.09,ez,.06,.06],[.4,ey,ez,.12,.09],[.4,ey+.09,ez,.06,.05]],10,()=>[[spine,1]],8);a.plate('pupil',[[.38,ey-.045,ez+.085],[.45,ey-.045,ez+.085],[.45,ey+.04,ez+.085],[.38,ey+.04,ez+.085]],.012,5,[[spine,1]]);a.plate('pectoral fin',[[.05,-.1,s*.18],[-.2,-.38,s*.36],[.3,-.18,s*.2]],.02,9,[[spine,1]]);}
 a.loft('lower jaw',[[.42,-.2,0,.06,.11],[.6,-.17,0,.055,.15],[.7,-.1,0,.035,.12]],14,()=>[[jaw,1]],8,'x');
 for(const side of [-1,1]){a.sweep('gill rim',[[.3,.19,side*.245],[.23,.12,side*.265],[.21,0,side*.27],[.28,-.13,side*.245]],.012,9,[[spine,1]],6);for(let i=0;i<4;i++)a.sweep('tail fin ray',[[-L,0,0],[-L-.38,(i-1.5)*.14,.02]],.008,14,[[tip,1]],5);}
a.eyelet('mouth lip',.64,-.07,0,.065,.1,.06,14,[[jaw,1]],'x');
manifest.push(a.save([{name:'Swim',tracks:[{bone:tail,axis:[0,1,0],keys:[[0,-.3],[.4,.3],[.8,-.3]]},{bone:tip,axis:[0,1,0],keys:[[0,-.45],[.4,.45],[.8,-.45]]},{bone:jaw,axis:[0,0,1],keys:[[0,0],[.4,.13],[.8,0]]}]}]));
}
// Tool silhouettes are extruded authored outlines, not assembled boxes.
for(const name of ['cleaver','stamp-fresh','stamp-expired','cutting-board','parcel','hook','worm','rod']){
 const a=asset(name),joint=a.bone('grip',0,[0,0,0]);const w=()=>[[joint,1]];
 if(name==='cleaver'){
a.plate('forged blade face',[[-.35,-.32,0],[.28,-.35,0],[.35,-.29,0],[.34,.19,0],[.28,.29,0],[-.3,.29,0],[-.37,.2,0]],.055,12,[[joint,1]]);
a.plate('sharpened bevel',[[-.35,-.32,.03],[.28,-.35,.03],[.35,-.29,.03],[.33,-.4,0],[-.36,-.4,0]],.009,17,[[joint,1]]);
a.loft('exposed full tang',[[0,.24,0,.062,.04],[0,.4,0,.072,.05],[0,.68,0,.064,.045],[0,.8,0,.09,.05]],12,w,12);
for(const side of [-1,1]){a.loft('carved handle scale',[[0,.34,side*.035,.06,.02],[0,.4,side*.04,.08,.026],[0,.5,side*.04,.075,.027],[0,.64,side*.04,.065,.024],[0,.76,side*.035,.09,.028],[0,.8,side*.03,.075,.02]],13,w,14);for(const y of [.42,.57,.73])a.eyelet('brass rivet',0,y,side*.07,0,.023,.009,7,[[joint,1]]);}
a.loft('bolster',[[0,.29,0,.08,.055],[0,.32,0,.09,.055],[0,.35,0,.08,.055]],12,w,12);
a.eyelet('hanging eye rim',-.22,.17,.033,.035,.048,.012,7,[[joint,1]]);
a.plate('hanging eye dark inset',[[-.245,.145,.04],[-.195,.145,.04],[-.195,.195,.04],[-.245,.195,.04]],.002,5,[[joint,1]]);
}
 if(name.startsWith('stamp')){a.plate('chamfered base',[[-.4,-.08,0],[.4,-.08,0],[.44,-.03,0],[.44,.08,0],[.38,.13,0],[-.38,.13,0],[-.44,.08,0],[-.44,-.03,0]],.35,13,[[joint,1]]);a.loft('turned grip',[[0,.12,0,.11,.11],[0,.25,0,.07,.07],[0,.38,0,.18,.18],[0,.48,0,.19,.19],[0,.55,0,.12,.12]],name.endsWith('fresh')?16:15,w,12);}
 if(name==='cutting-board')a.plate('chipped board',[[-.6,-.4,0],[.5,-.4,0],[.62,-.3,0],[.6,.3,0],[.46,.42,0],[-.5,.42,0],[-.62,.28,0]],.1,13,[[joint,1]]);
 if(name==='parcel')a.loft('folded paper',[[0,-.13,0,.42,.23],[0,-.1,0,.52,.28],[0,.1,0,.48,.25],[0,.15,0,.35,.18]],14,w,8);
 if(name==='hook')a.loft('curved hook',[[.26,-.18,0,.02,.02],[.22,-.27,0,.04,.035],[.07,-.29,0,.045,.035],[-.05,-.19,0,.045,.035],[-.06,0,0,.035,.035],[-.06,.55,0,.03,.03]],12,w,8);
 if(name==='worm')a.loft('worm body',Array.from({length:16},(_,i)=>[Math.sin(i*.45)*.12,i*.045,0,.045+Math.sin(i/15*Math.PI)*.02,.055]),4,w,8);
 if(name==='rod'){a.loft('tapered shaft',[[0,0,0,.065,.065],[0,.45,0,.06,.06],[.02,.5,0,.03,.03],[.1,1.5,0,.02,.02],[.24,2.5,0,.008,.008]],13,w,8);a.loft('reel',[[.1,.3,0,.12,.08],[.1,.35,0,.13,.09],[.1,.43,0,.12,.08]],12,w,10);}
 if(name.startsWith('stamp')){a.plate('rubber pad',[[-.4,-.1,0],[.4,-.1,0],[.4,-.06,0],[-.4,-.06,0]],.32,5,[[joint,1]]);a.plate('label inset',[[-.34,-.02,.182],[.34,-.02,.182],[.34,.08,.182],[-.34,.08,.182]],.008,14,[[joint,1]]);}
 if(name.startsWith('stamp')){const glyphs={F:['111','100','110','100','100'],R:['110','101','110','101','101'],E:['111','100','110','100','111'],S:['111','100','111','001','111'],H:['101','101','111','101','101'],X:['101','101','010','101','101'],P:['110','101','110','100','100'],I:['111','010','010','010','111'],D:['110','101','101','101','110']};const text=name==='stamp-fresh'?'FRESH':'EXPIRED',pixel=.014,total=text.length*4*pixel;for(let ch=0;ch<text.length;ch++)for(let row=0;row<5;row++)for(let col=0;col<3;col++)if(glyphs[text[ch]][row][col]==='1'){const x=-total/2+(ch*4+col)*pixel,y=.073-row*pixel;a.plate('stamp lettering',[[x,y,.19],[x+pixel*.85,y,.19],[x+pixel*.85,y-pixel*.85,.19],[x,y-pixel*.85,.19]],.003,name==='stamp-fresh'?16:15,[[joint,1]]);}}
 if(name==='cutting-board'){for(const y of [-.2,-.05,.14])a.sweep('knife groove',[[-.3,y,.055],[.3,y+.13,.055]],.004,6,[[joint,1]],5);a.eyelet('handle rim',0,.29,.054,.09,.12,.015,7,[[joint,1]]);}
 if(name==='parcel'){a.sweep('parcel twine',[[-.5,0,0],[-.47,.12,0],[0,.16,0],[.47,.12,0],[.5,0,0]],.012,7,[[joint,1]],6);a.sweep('parcel cross tie',[[0,0,-.27],[0,.16,-.2],[0,.17,.2],[0,0,.27]],.012,7,[[joint,1]],6);}
 if(name==='hook'){a.eyelet('line eye',-.06,.59,0,.04,.065,.055,12,[[joint,1]]);a.plate('barb',[[.23,-.18,0],[.31,-.08,0],[.23,-.1,0]],.025,12,[[joint,1]]);}
 if(name==='worm'){for(let i=1;i<13;i++)a.loft('worm segment',[[Math.sin(i*.45)*.12,i*.045,0,.065,.06],[Math.sin(i*.45)*.12,i*.045+.008,0,.068,.062]],4,w,12);}
 if(name==='rod'){for(const y of [.65,1.1,1.6,2.1,2.45])a.eyelet('line guide',.1*y,y,.04,.035,.047,.018,12,[[joint,1]]);a.sweep('fishing line',[[.1,.4,.12],[.065,.65,.1],[.11,1.1,.1],[.16,1.6,.1],[.21,2.1,.1],[.245,2.45,.1]],.003,7,[[joint,1]],5);a.sweep('reel crank',[[.17,.36,0],[.24,.36,.13],[.24,.25,.13]],.016,12,[[joint,1]],8);}
 manifest.push(a.save());
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));console.log(manifest.map(m=>`${m.name}: ${m.triangles} triangles, ${m.bones} bones, ${m.clips.join('/')}`).join('\n'));
