import * as T from 'three';
// Small, deterministic, material-specific painted maps. No per-frame texture generation.
const textures=new Map();
function texture(kind){if(textures.has(kind))return textures.get(kind);const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#e5e0d2';g.fillRect(0,0,64,64);let seed=kind.length*77;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
// Broad angled brush shapes rather than dirt speckles.
for(let i=0;i<24;i++){const x=rnd()*64,y=rnd()*64,w=5+rnd()*16,h=2+rnd()*9;g.fillStyle=i%3?'#c6c1b6':'#f4e8d0';g.globalAlpha=.28;g.beginPath();g.moveTo(x,y);g.lineTo(x+w,y-2);g.lineTo(x+w-3,y+h);g.lineTo(x+2,y+h+2);g.fill();}g.globalAlpha=1;
if(kind==='wood'){for(let i=0;i<11;i++){const x=i*6;g.strokeStyle=i%3?'#b9b2a2':'#ece0bb';g.lineWidth=i%3?1:2;g.beginPath();g.moveTo(x,0);g.lineTo(x+3,19);g.lineTo(x+1,42);g.lineTo(x+4,64);g.stroke();}g.strokeStyle='#a79c89';g.strokeRect(19,24,8,14);}
if(kind==='cloth'){g.fillStyle='#96928c';g.fillRect(1,0,2,64);g.fillRect(61,0,2,64);g.fillRect(0,3,64,1);g.fillRect(0,60,64,1);g.fillStyle='#e2d7bf';for(let i=0;i<64;i+=7){g.fillRect(5,i,1,3);g.fillRect(58,i,1,3);}}
if(kind==='scales'){g.fillStyle='#888e84';for(let y=0;y<64;y+=8)for(let x=0;x<64;x+=10){const xx=x+(y%16?5:0);g.beginPath();g.moveTo(xx,y);g.lineTo(xx+4,y+3);g.lineTo(xx+9,y);g.lineTo(xx+4,y+5);g.fill();}g.fillStyle='#e6ddc0';g.globalAlpha=.25;g.fillRect(0,40,64,24);g.globalAlpha=1;}
if(kind==='metal'){g.fillStyle='#e7e4ca';g.fillRect(0,0,4,64);g.fillRect(0,58,64,4);g.strokeStyle='#8a8b88';for(let i=0;i<9;i++){const x=rnd()*60,y=rnd()*60;g.beginPath();g.moveTo(x,y);g.lineTo(x+7,y-9);g.stroke();}}
if(kind==='hair'){g.strokeStyle='#948e88';for(let x=0;x<64;x+=7){g.beginPath();g.moveTo(x,0);g.lineTo(x+3,26);g.lineTo(x,51);g.stroke();}}
if(kind==='paper'){g.strokeStyle='#918b7d';g.beginPath();g.moveTo(0,0);g.lineTo(32,22);g.lineTo(64,0);g.moveTo(0,64);g.lineTo(32,42);g.lineTo(64,64);g.stroke();g.fillStyle='#716c5d';g.fillRect(30,0,2,64);}
const tex=new T.CanvasTexture(c);tex.name=kind+'-painted-64';tex.colorSpace=T.SRGBColorSpace;tex.magFilter=tex.minFilter=T.NearestFilter;tex.generateMipmaps=false;tex.wrapS=tex.wrapT=T.RepeatWrapping;textures.set(kind,tex);return tex;}
const gradient=new T.DataTexture(new Uint8Array([100,100,100,255,185,185,185,255,255,255,255,255]),3,1,T.RGBAFormat);gradient.minFilter=gradient.magFilter=T.NearestFilter;gradient.generateMipmaps=false;gradient.needsUpdate=true;
const palette={ '#ccd7d6':['#d5e5e5',null], '#d2a13a':['#d5a32c','cloth'],'#624351':['#733d68','cloth'],'#4b5136':['#344e43','cloth'],'#ad9f91':['#9f9893','hair'],'#c38b73':['#cc927b',null],'#242824':['#19292d',null],'#946441':['#925346','cloth'],'#c7b483':['#ddbf77','metal'],'#8d9659':['#839c58','scales'],'#836149':['#b46c5b','cloth'],'#d6cba1':['#e7d9ad',null],'#557d79':['#398f92','scales'],'#999b91':['#8aa6aa','metal'],'#76543b':['#986a48','wood'],'#c5b185':['#c7b185','paper'],'#87503e':['#b4564c','wood'],'#4f713e':['#42836b','wood']};
export function paintedMaterial(color,kind='wood'){return new T.MeshToonMaterial({color,map:kind?texture(kind):null,gradientMap:gradient,side:T.DoubleSide});}
export function dressModel(root){const cache=new Map();root.traverse(o=>{if(!o.isMesh)return;const old=o.material,key=old.name;if(!cache.has(key)){const spec=palette[key]||['#ac9778','wood'];const mat=paintedMaterial(...spec);mat.name=key;mat.flatShading=true;cache.set(key,mat);}o.material=cache.get(key);});}
export function createRetro(renderer){const target=new T.WebGLRenderTarget(384,216,{minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:true,stencilBuffer:false});const scene=new T.Scene(),cam=new T.OrthographicCamera(-1,1,1,-1,0,1);const uniforms={source:{value:target.texture},time:{value:0},drunk:{value:1.1},resolution:{value:new T.Vector2(384,216)},pixel:{value:1}};
const material=new T.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
uniform sampler2D source;uniform float time,drunk,pixel;uniform vec2 resolution;varying vec2 uv0;
void main(){vec2 p=uv0-.5;float edge=dot(p,p);float t=time;float roll=sin(t*.63)*.024*drunk;mat2 rotation=mat2(cos(roll),-sin(roll),sin(roll),cos(roll));vec2 uv=.5+rotation*p*(1.-.04*drunk);uv+=p*edge*.11*drunk;uv.x+=sin(uv.y*7.+t*.8)*.016*drunk;uv.y+=sin(uv.x*5.+t*.55)*.009*drunk;
float split=(.9+edge*12.)*drunk/resolution.x;vec2 stepUV=vec2(split,0.);vec2 margin=1./resolution;
vec3 col=vec3(texture2D(source,clamp(uv+stepUV,margin,1.-margin)).r,texture2D(source,clamp(uv,margin,1.-margin)).g,texture2D(source,clamp(uv-stepUV,margin,1.-margin)).b);
float bayer=mod(floor(uv0.x*resolution.x),2.)+2.*mod(floor(uv0.y*resolution.y),2.);col=clamp(col,0.,1.);
col*=1.-smoothstep(.1,.5,edge)*.24;col=mix(col,col*vec3(.94,.97,1.04),.3);gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});scene.add(new T.Mesh(new T.PlaneGeometry(2,2),material));return {uniforms,resize(w,h,pixel){const th=pixel?Math.min(300,h):Math.min(900,h),tw=Math.round(w/h*th);target.setSize(tw,th);uniforms.resolution.value.set(tw,th);uniforms.pixel.value=pixel?1:0;},render(world,camera,time){uniforms.time.value=time;renderer.setRenderTarget(target);renderer.render(world,camera);renderer.setRenderTarget(null);renderer.render(scene,cam);}};}
export function textureAtlasURL(){const canvas=document.createElement('canvas');canvas.width=448;canvas.height=64;const ctx=canvas.getContext('2d');['wood','cloth','scales','metal','hair','paper','plain'].forEach((kind,i)=>ctx.drawImage(texture(kind).image,i*64,0));return canvas.toDataURL('image/png');}
