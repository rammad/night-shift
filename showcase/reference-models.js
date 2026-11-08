// Approved clean, patched reference models. Showcase only.
export function createReferenceModels(T){
 const root=new T.Group(),materials=new Map();
 const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshLambertMaterial({color:c,flatShading:true}));return materials.get(c);};
 function part(g,geo,c,x=0,y=0,z=0){const m=new T.Mesh(geo,mat(c));m.position.set(x,y,z);g.add(m);return m;}
 const box=(g,c,x,y,z,w,h,d)=>part(g,new T.BoxGeometry(w,h,d),c,x,y,z);
 function oval(g,c,x,y,z,a,b,d){const m=part(g,new T.SphereGeometry(1,12,8),c,x,y,z);m.scale.set(a,b,d);return m;}
 function lathe(g,c,p,x,y,z){return part(g,new T.LatheGeometry(p.map(v=>new T.Vector2(...v)),12),c,x,y,z);}
 function rod(g,c,a,b,r){const v=new T.Vector3(...a),d=new T.Vector3(...b).sub(v),m=part(g,new T.CylinderGeometry(r,r,d.length(),8),c);m.position.copy(v.addScaledVector(d,.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 function patch(g,x,y,z,w,h){box(g,0x926542,x,y,z,w,h,.012);for(let i=0;i<4;i++){const a=x-w*.4+i*w*.27;box(g,0xd0b78a,a,y-h*.5,z+.01,.012,.05,.008);box(g,0xd0b78a,a,y+h*.5,z+.01,.012,.05,.008);}for(const a of [-1,1])for(let i=0;i<3;i++)box(g,0xd0b78a,x+a*w*.5,y-h*.3+i*h*.3,z+.01,.045,.012,.008);}
 function label(g,text,x,y,z,w=1){const c=document.createElement('canvas');c.width=256;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='#c8b88d';ctx.fillRect(0,0,256,64);ctx.fillStyle='#364337';ctx.font='bold 30px monospace';ctx.textAlign='center';ctx.fillText(text,128,43);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.NearestFilter;const m=new T.Mesh(new T.PlaneGeometry(w,w/4),new T.MeshBasicMaterial({map:tex}));m.position.set(x,y,z);g.add(m);}
 const man=new T.Group();root.add(man);man.position.set(-2,0,-.9);man.name='Fisherman';
 for(const s of [-1,1]){lathe(man,0xb79135,[[.2,0],[.23,.2],[.22,.8],[.25,1]],s*.25,.38,0);oval(man,0x484d32,s*.25,.18,.13,.25,.2,.4);lathe(man,0x50553a,[[.21,0],[.2,.45]],s*.25,.15,0);rod(man,0x604351,[s*.4,1.85,0],[s*.64,1.2,.06],.19);oval(man,0xc48c70,s*.65,1.04,.07,.16,.23,.13);oval(man,0xc48c70,s*.52,1.04,.17,.07,.12,.07);box(man,0xd2a63b,s*.27,1.8,.33,.11,.67,.05);box(man,0xcbb788,s*.27,1.63,.39,.18,.17,.06);box(man,0x614b32,s*.27,1.63,.425,.1,.09,.015);}
 oval(man,0x604351,0,1.72,0,.49,.55,.32);oval(man,0xc69b35,0,1.2,0,.46,.34,.3);box(man,0xc99e37,0,1.43,.29,.68,.55,.12);box(man,0xb78d31,0,1.4,.365,.32,.24,.025);
 oval(man,0x262823,0,2.19,0,.28,.3,.23);oval(man,0x94877f,0,2.03,.27,.44,.4,.34);oval(man,0xa89b90,-.14,2.23,.43,.19,.1,.08);oval(man,0xa89b90,.14,2.23,.43,.19,.1,.08);part(man,new T.ConeGeometry(.09,.18,4),0xc58b70,0,2.35,.38).rotation.x=Math.PI/2;
 lathe(man,0xd0a339,[[.05,0],[.3,.04],[.49,-.05],[.66,-.19],[.7,-.22]],0,2.55,0);lathe(man,0xd0a339,[[.44,0],[.37,.22],[.22,.5],[.1,.52],[0,.52]],0,2.55,0);
 patch(man,-.23,.7,.23,.24,.23);patch(man,.25,.73,.23,.23,.22);patch(man,-.28,1.09,.28,.19,.22);patch(man,.1,2.88,.3,.19,.18);patch(man,-.34,2.43,.51,.13,.1);
 function fish(type){const g=new T.Group();g.name=['Perch','Mackerel','Flatfish'][type];const col=[0x8b9251,0x64847c,0x9b7849][type],length=type===1?1.0:.65,height=type===2?.12:.3,width=type===2?.48:.25;oval(g,col,0,0,0,length,height,width);oval(g,0xb7ac78,.25,-height*.4,0,length*.55,height*.5,width*.8);
 for(const s of [-1,1]){const tail=part(g,new T.ConeGeometry(.23,.5,3),0x8f674e,-length-.14,s*.16,0);tail.rotation.z=Math.PI/2+s*.5;tail.scale.z=.32;}
 for(let i=0;i<5;i++){const fin=part(g,new T.ConeGeometry(.12,.25,3),0x8c654c,-.35+i*.16,height+.09,0);fin.scale.z=.35;}
 if(type===2){for(const z of [-.2,.2]){oval(g,0xd7cba1,.3,.16,z,.13,.1,.13);oval(g,0x292a24,.34,.23,z,.055,.025,.06);}}else for(const s of [-1,1]){oval(g,0xd8cda2,length*.65,.14,s*width,.14,.14,.08);oval(g,0x292a24,length*.7,.15,s*(width+.065),.06,.07,.025);}
 const mouth=part(g,new T.TorusGeometry(.13,.04,4,8),0x9f8065,length-.01,-.06,0);mouth.rotation.y=Math.PI/2;
 if(type===1)for(let i=0;i<7;i++)box(g,0x405a54,-.65+i*.2,.26,0,.06,.025,.23);
 return g;}
 const fishRow=new T.Group();root.add(fishRow);fishRow.position.set(.3,1.45,1.45);for(let i=0;i<3;i++){const f=fish(i);f.position.x=(i-1)*1.8;f.scale.setScalar(.75);fishRow.add(f);label(fishRow,f.name,(i-1)*1.8,-.47,.3,1.2);}
 const tools=new T.Group();root.add(tools);tools.position.set(.4,1.3,-.2);
 box(tools,0xa4844a,-.8,-.1,0,1.65,.12,1);const cleaver=new T.Group();tools.add(cleaver);cleaver.position.set(-.8,.38,0);box(cleaver,0xa8aaa0,0,0,0,.47,.6,.06);box(cleaver,0x745237,0,.48,0,.14,.4,.12);for(const y of [.36,.5,.62])oval(cleaver,0xbdb18d,0,y,.065,.025,.025,.012);
 for(let i=0;i<2;i++){const x=.6+i*.72;box(tools,0x795b35,x,.03,0,.6,.12,.4);lathe(tools,i?0x8c4a3b:0x60713d,[[.1,0],[.08,.16],[.17,.25],[.17,.35],[.1,.4],[0,.4]],x,.1,0);label(tools,i?'EXPIRED X':'FRESH ✓',x,.04,.21,.54);}
 const hook=new T.Group();tools.add(hook);hook.position.set(-2,.4,.2);const curve=new T.CatmullRomCurve3([[0,.7,0],[0,0,0],[.1,-.2,0],[.35,-.22,0],[.48,0,0]].map(p=>new T.Vector3(...p)));part(hook,new T.TubeGeometry(curve,16,.035,5,false),0xb4ad8d);part(hook,new T.ConeGeometry(.07,.2,4),0xb4ad8d,.48,.08,0);for(let i=0;i<7;i++)oval(hook,0xb97c70,-.3+Math.sin(i*.6)*.07,i*.075-.2,.1,.07,.07,.065);
 const pole=new T.Group();root.add(pole);pole.position.set(3.4,.3,1);rod(pole,0x8f713f,[0,0,0],[-.5,3.2,0],.035);rod(pole,0x5c4350,[0,0,0],[-.07,.5,0],.09);part(pole,new T.CylinderGeometry(.18,.18,.14,10),0x999a85,.1,.6,0).rotation.x=Math.PI/2;rod(pole,0xb5ae8b,[-.5,3.2,0],[-.2,1.2,0],.008);
 const parcel=new T.Group();tools.add(parcel);parcel.position.set(.9,-.02,.72);box(parcel,0xc1ad80,0,0,0,1.1,.2,.55);box(parcel,0x8d7953,0,.11,0,.025,.015,.55);box(parcel,0x8d7953,0,.11,0,1.1,.015,.025);
 box(root,0x795d3c,.4,1.04,.6,5.9,.16,2.7);for(const x of [-2.2,3])for(const z of [-.45,1.6])box(root,0x574330,x,.5,z,.15,1,.15);return {root,man,fishRow,tools};
}
