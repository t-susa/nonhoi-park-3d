
// Resolve Three.js relative to this page's directory even when the host strips the trailing slash.
const __threeUrl = new URL('three.module.js', location.href.replace(/\/?$/, '/') + '');
const THREE = await import(__threeUrl.href);
const D = window.OSM; // processed OpenStreetMap extract (© OpenStreetMap contributors, ODbL). 1 unit = 1.25 m, +x east, +z south

// ---------- basic setup ----------
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9cc9ec);
scene.fog = new THREE.Fog(0x9cc9ec, 160, 720);
const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 2400);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9a70, 1.0), new THREE.AmbientLight(0xffffff, 0.35));
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(200,320,130); sun.castShadow = true;
sun.shadow.mapSize.set(4096,4096);
Object.assign(sun.shadow.camera,{left:-460,right:460,top:340,bottom:-340,far:900});
scene.add(sun);

const M = c => new THREE.MeshLambertMaterial({color:c});
const mats = {water:new THREE.MeshLambertMaterial({color:0x4a90c2,transparent:true,opacity:.88}),
  wall:M(0xf2efe6), roof:M(0x9a5b3c), wood:M(0x8b5a2b), leaf:M(0x3f7d3a), rock:M(0x9e9a8f), glass:new THREE.MeshLambertMaterial({color:0xbfe6ff,transparent:true,opacity:.45}),
  grey:M(0x8a8a8a), dark:M(0x333333), white:M(0xffffff)};
const animated=[];
const hash=s=>{let h=2166136261; for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619); return (h>>>0)/4294967296;};
let seed=12345; const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647; // deterministic scatter

// ---------- geometry helpers ----------
const colliders=[]; // AABB colliders for decorations {minX,maxX,minZ,maxZ}
function box(w,h,d,mat,x,y,z,collide=false,parent=scene){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); m.castShadow=m.receiveShadow=true; parent.add(m);
  if(collide) colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
  return m;
}
function cyl(rt,rb,h,mat,x,y,z,seg=12,parent=scene){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat); m.position.set(x,y,z); m.castShadow=true; parent.add(m); return m;
}
function label(text,x,y,z,size=1,color='#ffffff',bg='rgba(30,60,30,0.78)'){
  const c=document.createElement('canvas'); const ctx=c.getContext('2d'); const fs=48;
  ctx.font=`bold ${fs}px sans-serif`; const w=ctx.measureText(text).width+40; c.width=w; c.height=fs+28;
  ctx.font=`bold ${fs}px sans-serif`; ctx.fillStyle=bg; ctx.beginPath(); ctx.roundRect(0,0,c.width,c.height,16); ctx.fill();
  ctx.fillStyle=color; ctx.textBaseline='middle'; ctx.fillText(text,20,c.height/2+2);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:true}));
  s.scale.set(c.width/c.height*3*size,3*size,1); s.position.set(x,y,z); scene.add(s); return s;
}
function inPoly(poly,x,z){ let c=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,zi]=poly[i],[xj,zj]=poly[j]; if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)c=!c;} return c; }
function segDist(x,z,ax,az,bx,bz){ const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1e-9; let t=((x-ax)*dx+(z-az)*dz)/l2; t=t<0?0:t>1?1:t; return Math.hypot(x-ax-t*dx,z-az-t*dz); }
function edgeDist(poly,x,z){ let d=1e9; for(let i=0,j=poly.length-1;i<poly.length;j=i++)d=Math.min(d,segDist(x,z,...poly[j],...poly[i])); return d; }
function bboxOf(p){ let a=1e9,b=-1e9,c=1e9,d=-1e9; for(const [x,z] of p){a=Math.min(a,x);b=Math.max(b,x);c=Math.min(c,z);d=Math.max(d,z);} return {minX:a,maxX:b,minZ:c,maxZ:d}; }
function areaOf(p){ let s=0; for(let i=0,j=p.length-1;i<p.length;j=i++)s+=p[j][0]*p[i][1]-p[i][0]*p[j][1]; return s/2; }
function centroid(p){ let x=0,z=0; p.forEach(q=>{x+=q[0];z+=q[1];}); return [x/p.length,z/p.length]; }
// up-facing triangle soup in XZ (with holes) -> V/I arrays
function addPoly(V,I,outer,holes=[],y=0){ if(outer.length<3)return;
  const v2=p=>p.map(([x,z])=>new THREE.Vector2(x,z)); const contour=v2(outer), hs=holes.filter(h=>h.length>=3).map(v2);
  const tris=THREE.ShapeUtils.triangulateShape(contour,hs); const all=[...contour,...hs.flat()]; const base=V.length/3;
  all.forEach(p=>V.push(p.x,y,p.y));
  tris.forEach(([a,b,c])=>{const A=all[a],B=all[b],C=all[c]; const cy=(B.y-A.y)*(C.x-A.x)-(B.x-A.x)*(C.y-A.y); cy>0?I.push(base+a,base+b,base+c):I.push(base+a,base+c,base+b);}); }
function flatMesh(V,I,mat,y,shadow=true){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(V,3));
  const N=new Float32Array(V.length); for(let i=1;i<N.length;i+=3)N[i]=1; g.setAttribute('normal',new THREE.BufferAttribute(N,3)); g.setIndex(I);
  const m=new THREE.Mesh(g,mat); m.position.y=y; m.receiveShadow=shadow; scene.add(m); return m; }
const layerMat=(c,o,extra={})=>new THREE.MeshLambertMaterial({color:c,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-o,polygonOffsetUnits:-o*2,...extra});
function fillLayer(polys,color,y,o){ const V=[],I=[]; polys.forEach(p=>Array.isArray(p[0])?addPoly(V,I,p):addPoly(V,I,p.o,p.h||[])); return flatMesh(V,I,layerMat(color,o),y); }

// ---------- ground & OSM area layers ----------
const PARK=D.park;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(2600,2000), M(0x8ea677)); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
fillLayer([PARK],0x7fb069,.01,1);                                   // leisure=park boundary (way 38757407)
const zones=D.zones.map(z=>({name:z.n,sub:z.s,color:z.c,poly:z.p}));
zones.forEach((z,i)=>{ const V=[],I=[]; addPoly(V,I,z.poly); flatMesh(V,I,layerMat(new THREE.Color(z.color).lerp(new THREE.Color(0x7fb069),.72),1.5+i*.1),.015); });
fillLayer(D.gardens,0x93c47a,.02,2.5);                               // leisure=garden
fillLayer(D.forest,0x5c9a52,.025,3);                                 // landuse=forest
fillLayer(D.parking,0xa9a69c,.03,3.5);                               // amenity=parking
fillLayer(D.water.map(w=>w.o),0x4a90c2,.04,4).material.color.set(0x4a90c2); // natural=water / fountains
D.water.filter(w=>w.f).forEach(w=>{const [x,z]=centroid(w.o); const f=cyl(.3,.6,3,mats.water,x,1.6,z,8); animated.push(t=>f.scale.y=1+Math.sin(t*3+x)*.15);});
const waterPolys=D.water.map(w=>({p:w.o,bb:bboxOf(w.o)}));

// ---------- OSM highways -> spline ribbons merged into 2 meshes (surface + curb) ----------
const PV=[],PI=[],BV=[],BI=[];
function addStrip(V,I,pts,w){ const base=V.length/3,n=pts.length;
  for(let i=0;i<n;i++){const p=pts[i],a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)]; let tx=b[0]-a[0],tz=b[1]-a[1]; const l=Math.hypot(tx,tz)||1; const nx=-tz/l*w/2,nz=tx/l*w/2; V.push(p[0]+nx,0,p[1]+nz,p[0]-nx,0,p[1]-nz);}
  for(let i=0;i<n-1;i++){const k=base+i*2; I.push(k,k+2,k+1,k+1,k+2,k+3);} }
function addDisc(V,I,x,z,r,seg=14){ const c=V.length/3; V.push(x,0,z); for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2; V.push(x+Math.cos(a)*r,0,z+Math.sin(a)*r);} for(let i=0;i<seg;i++)I.push(c,c+1+(i+1)%seg,c+1+i); }
const GRID=10, pathGrid=new Map(); // spatial hash of path segments: walkability + tree avoidance
function gridAdd(x1,z1,x2,z2,hw){ const s={x1,z1,x2,z2,hw}; const a=Math.floor((Math.min(x1,x2)-hw)/GRID),b=Math.floor((Math.max(x1,x2)+hw)/GRID),c=Math.floor((Math.min(z1,z2)-hw)/GRID),d=Math.floor((Math.max(z1,z2)+hw)/GRID);
  for(let i=a;i<=b;i++)for(let j=c;j<=d;j++){const k=i+','+j; (pathGrid.get(k)||pathGrid.set(k,[]).get(k)).push(s);} }
function pathDist(x,z){ const L=pathGrid.get(Math.floor(x/GRID)+','+Math.floor(z/GRID)); if(!L)return 1e9; let best=1e9; for(const s of L)best=Math.min(best,segDist(x,z,s.x1,s.z1,s.x2,s.z2)-s.hw); return best; }
const pathLines=[], degree=new Map();
D.ways.forEach(w=>{ const k=p=>p[0]+','+p[1]; [w.p[0],w.p[w.p.length-1]].forEach(p=>degree.set(k(p),(degree.get(k(p))||0)+1)); });
const pathCol={steps:0xc8c0b0, service:0xd2c7ad};
const SV=[],SI=[];  // steps / service darker surface
D.ways.forEach(w=>{ let p=w.p.map(q=>q.slice()); if(p.length<2)return;
  const closed=p.length>3&&Math.hypot(p[0][0]-p[p.length-1][0],p[0][1]-p[p.length-1][1])<.05; if(closed)p.pop();
  let pts=p;
  if(p.length>2){ const c=new THREE.CatmullRomCurve3(p.map(([x,z])=>new THREE.Vector3(x,0,z)),closed,'centripetal');
    pts=c.getSpacedPoints(Math.max(4,Math.ceil(c.getLength()/1.5))).map(v=>[v.x,v.z]); }
  const V=w.t==='steps'||w.t==='service'?SV:PV, I=w.t==='steps'||w.t==='service'?SI:PI;
  addStrip(V,I,pts,w.w); addStrip(BV,BI,pts,w.w+1.2);
  if(!closed)[pts[0],pts[pts.length-1]].forEach(([x,z])=>{addDisc(V,I,x,z,w.w/2+.05);addDisc(BV,BI,x,z,w.w/2+.65);});
  pathLines.push({pts,w:w.w,t:w.t,closed}); for(let i=0;i<pts.length-1;i++)gridAdd(...pts[i],...pts[i+1],w.w/2+.3);
});
D.areas.forEach(a=>{ addPoly(PV,PI,a.o,a.h); for(let i=0,j=a.o.length-1;i<a.o.length;j=i++)gridAdd(...a.o[j],...a.o[i],.5); }); // highway=pedestrian areas (plazas)
const curbMat=layerMat(0xb3a07a,5), pathMat=layerMat(0xdccca6,6), svcMat=layerMat(0xcdbf9f,6.5);
flatMesh(BV,BI,curbMat,.05); flatMesh(PV,PI,pathMat,.07); flatMesh(SV,SI,svcMat,.075);
const plazaPolys=D.areas.map(a=>({p:a.o,h:a.h,bb:bboxOf(a.o)}));
function onWalk(x,z,extra=0){ if(pathDist(x,z)<extra)return true; return plazaPolys.some(a=>x>a.bb.minX&&x<a.bb.maxX&&z>a.bb.minZ&&z<a.bb.maxZ&&inPoly(a.p,x,z)&&!a.h.some(h=>inPoly(h,x,z))); }
// streams (waterway) as thin blue ribbons
{ const V=[],I=[]; D.streams.forEach(s=>addStrip(V,I,s.p,s.w)); flatMesh(V,I,layerMat(0x4a90c2,4.5),.045); }
// miniature railway (こども汽車) track + small train
const rail=D.rail[0];
if(rail&&rail.length>3){ const V=[],I=[]; addStrip(V,I,rail,1.6); flatMesh(V,I,layerMat(0x6b5a4a,7),.09);
  const rc=new THREE.CatmullRomCurve3(rail.slice(0,-1).map(([x,z])=>new THREE.Vector3(x,0,z)),true,'centripetal'); const rl=rc.getLength();
  const cars=[0,1,2].map(i=>{const g=new THREE.Group(); box(2.6,1.3,1.3,M(i?0xe0b030:0x2f6f3f),0,.9,0,false,g); scene.add(g); return g;}); const _p=new THREE.Vector3(),_t=new THREE.Vector3();
  animated.push(t=>cars.forEach((g,i)=>{const u=(((t*3-i*3.1)%rl)+rl)%rl/rl; rc.getPointAt(u,_p); rc.getTangentAt(u,_t); g.position.copy(_p); g.rotation.y=-Math.atan2(_t.z,_t.x);})); }

// ---------- OSM buildings: extruded footprints merged (vertex colours) ----------
const U=1/1.25; // units per metre
const bldColliders=[];
const wallCols=[0xf2efe6,0xe9e1cf,0xdfe7ec,0xf0e2cc,0xe5e0d8], roofCols=[0x9a5b3c,0x6f7c86,0x5e7d5a,0x8a7a6a,0x7a8fa0];
const bV=[],bN=[],bC=[], gV=[],gN=[]; const _c=new THREE.Color();
function pushTri(V,N,C,col,...p){ for(let i=0;i<3;i++){V.push(...p[i].pos);N.push(...p[i].n); if(C){_c.set(col);C.push(_c.r,_c.g,_c.b);}} }
function extrude(o,y0,y1,wallCol,roofCol,glass=false){
  const V=glass?gV:bV,N=glass?gN:bN,C=glass?null:bC; const ccw=areaOf(o)>0;
  if(y1-y0>.05) for(let i=0;i<o.length;i++){ const a=o[i],b=o[(i+1)%o.length]; let nx=b[1]-a[1],nz=-(b[0]-a[0]); const l=Math.hypot(nx,nz)||1; nx/=l;nz/=l; if(!ccw){nx=-nx;nz=-nz;}
    const n=[nx,0,nz],A={pos:[a[0],y0,a[1]],n},B={pos:[b[0],y0,b[1]],n},A2={pos:[a[0],y1,a[1]],n},B2={pos:[b[0],y1,b[1]],n};
    // winding must agree with the outward normal (DoubleSide flips normals on back faces)
    const ux=b[0]-a[0],uz=b[1]-a[1], cx=-uz*(y1-y0), cz=ux*(y1-y0); // cross((B-A),(A2-A)) in xz
    if(cx*nx+cz*nz>=0){ pushTri(V,N,C,wallCol,A,B2,B); pushTri(V,N,C,wallCol,A,A2,B2); } else { pushTri(V,N,C,wallCol,A,B,B2); pushTri(V,N,C,wallCol,A,B2,A2); } }
  const v2=o.map(([x,z])=>new THREE.Vector2(x,z)); THREE.ShapeUtils.triangulateShape(v2,[]).forEach(([a,b,c])=>{const P=i=>({pos:[o[i][0],y1,o[i][1]],n:[0,1,0]}); const A=o[a],B=o[b],Cc=o[c]; const cy=(B[1]-A[1])*(Cc[0]-A[0])-(B[0]-A[0])*(Cc[1]-A[1]); cy>0?pushTri(V,N,C,roofCol,P(a),P(b),P(c)):pushTri(V,N,C,roofCol,P(a),P(c),P(b));});
}
const namedB=[];
D.buildings.forEach(b=>{ const o=b.o; if(o.length<3)return; const am=Math.abs(areaOf(o))*1.5625; // m²
  let hm=b.ht?parseFloat(b.ht):b.lv?(+b.lv)*3.5+1:(am<40?3:am>1500?9:am>400?7:5);
  if(b.n==='展望塔')hm=8; const h=hm*U, r=hash(b.id);
  const glass=b.n==='温室'; const bb=bboxOf(o);
  // a footway running through the footprint => gate / passage / canopy: render as roof on pillars, no collider
  let passes=0; for(const L of pathLines){ for(let i=0;i<L.pts.length;i+=2){const [x,z]=L.pts[i]; if(x>bb.minX&&x<bb.maxX&&z>bb.minZ&&z<bb.maxZ&&inPoly(o,x,z)&&edgeDist(o,x,z)>1.2)passes++;} if(passes>2)break; }
  const canopy=b.b==='roof'||(passes>2&&am<1500);
  if(canopy){ const y=Math.max(3.4,hm*.75)*U; extrude(o,y,y+.35,0xd8d2c4,roofCols[(r*5|0)%5]);
    const step=Math.max(1,Math.floor(o.length/8)); for(let i=0;i<o.length;i+=step){ const [x,z]=o[i]; const pz=new THREE.Mesh(new THREE.BoxGeometry(.45,y,.45),mats.wall); pz.position.set(x,y/2,z); pz.castShadow=true; scene.add(pz);} }
  else { extrude(o,0,h,wallCols[(r*5|0)%5],glass?0:roofCols[(r*7|0)%5],glass); bldColliders.push({p:o,bb}); }
  if(b.n){ const [x,z]=centroid(o); namedB.push({name:b.n.replace('豊橋総合動植物公園　',''),x,z,h,r:Math.max(14,Math.sqrt(am)*U*.7+8),o}); }
});
{ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(bV,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(bN,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(bC,3));
  g.computeVertexNormals(); // non-indexed => per-face normals matching winding; DoubleSide flips them toward the viewer
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide})); m.castShadow=m.receiveShadow=true; scene.add(m); }
if(gV.length){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(gV,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(gN,3)); g.computeVertexNormals(); const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0xbfe6ff,transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false})); scene.add(m); }

// ---------- landmarks & labels (OSM names) ----------
const landmarks=[];
const LABEL_SKIP=/汚水処理場|動物病院|休憩所/;
namedB.forEach(b=>{ landmarks.push(b); if(!LABEL_SKIP.test(b.name)&&!/門$/.test(b.name))label(b.name,b.x,b.h+5,b.z,.7); });
const POI={}; D.pois.forEach(p=>POI[p.n]=p.p);
D.pois.filter(p=>/attraction|big_wheel|roller_coaster|museum|watermill|locomotive|cafe|gift/.test(p.k)).forEach(p=>{ label(p.n,p.p[0],9,p.p[1],.6,'#fff','rgba(40,70,110,.8)'); landmarks.push({name:p.n,x:p.p[0],z:p.p[1],r:14}); });
// 野外恐竜ランド: dinosaur artwork nodes (tourism=artwork) get stylised models at their OSM positions
const dinoNodes=D.pois.filter(p=>p.k==='artwork');
if(dinoNodes.length){ const [cx,cz]=centroid(dinoNodes.map(p=>p.p)); label('野外恐竜ランド',cx,16,cz,.9); landmarks.push({name:'野外恐竜ランド',x:cx,z:cz,r:30}); }

// ---------- gates (OSM gate buildings 西門 / 中央門 / 東門) ----------
const parkC=centroid(PARK);
function walkableNear(x,z,maxR=40,needPath=true){ for(let r=0;r<maxR;r+=1)for(let a=0;a<16;a++){const px=x+Math.cos(a/16*Math.PI*2)*r,pz=z+Math.sin(a/16*Math.PI*2)*r; if((!needPath||pathDist(px,pz)<-.3)&&!blocked(px,pz))return [px,pz];} return [x,z]; }
const gates=[];
D.gates.forEach(g=>{ const nm=g.n; const [gx,gz]=g.p;
  label(nm+' エントランス',gx,12,gz,1.1,'#fff','rgba(20,90,50,.85)'); landmarks.push({name:nm+' エントランス',x:gx,z:gz,r:26});
  gates.push({n:nm,gx,gz}); });

// ---------- trees (instanced): OSM forest polygons + sparse park trees + boundary ----------
const treeSpots=[];
function freeForTree(x,z,clear=3){ if(pathDist(x,z)<clear)return false; for(const b of bldColliders){if(x>b.bb.minX-2&&x<b.bb.maxX+2&&z>b.bb.minZ-2&&z<b.bb.maxZ+2&&(inPoly(b.p,x,z)||edgeDist(b.p,x,z)<2))return false;}
  for(const w of waterPolys){if(x>w.bb.minX&&x<w.bb.maxX&&z>w.bb.minZ&&z<w.bb.maxZ&&inPoly(w.p,x,z))return false;} return !onWalk(x,z,clear); }
D.forest.forEach(f=>{ const bb=bboxOf(f),a=Math.abs(areaOf(f)); const n=Math.min(260,Math.round(a/90)); for(let i=0;i<n;i++){const x=bb.minX+rnd()*(bb.maxX-bb.minX),z=bb.minZ+rnd()*(bb.maxZ-bb.minZ); if(inPoly(f,x,z)&&freeForTree(x,z))treeSpots.push([x,z,.8+rnd()*.6]);} });
{ const bb=bboxOf(PARK); for(let i=0;i<500;i++){const x=bb.minX+rnd()*(bb.maxX-bb.minX),z=bb.minZ+rnd()*(bb.maxZ-bb.minZ); if(inPoly(PARK,x,z)&&freeForTree(x,z,5))treeSpots.push([x,z,.7+rnd()*.5]);} }
for(let i=0;i<PARK.length;i++){ const a=PARK[i],b=PARK[(i+1)%PARK.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]); for(let t=0;t<L;t+=12){ const x=a[0]+(b[0]-a[0])*t/L,z=a[1]+(b[1]-a[1])*t/L; const nx=(b[1]-a[1])/L,nz=-(b[0]-a[0])/L, s=areaOf(PARK)>0?-1:1; const tx=x+nx*s*9,tz=z+nz*s*9; if(!inPoly(PARK,tx,tz)&&pathDist(tx,tz)>3)treeSpots.push([tx,tz,1.1]); } }
{ const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.3,.4,3,6),mats.wood,treeSpots.length), crown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.2,0),mats.leaf,treeSpots.length);
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),ps=new THREE.Vector3(); const col=new THREE.Color();
  treeSpots.forEach(([x,z,s],i)=>{ sc.set(s,s,s); m.compose(ps.set(x,1.5*s,z),q,sc); trunk.setMatrixAt(i,m); q.setFromAxisAngle(new THREE.Vector3(0,1,0),i); m.compose(ps.set(x,4*s,z),q,sc); crown.setMatrixAt(i,m); q.identity(); crown.setColorAt(i,col.setHSL(.29+hash(i)*.06,.38+hash(i+1)*.15,.3+hash(i+2)*.1)); });
  trunk.castShadow=crown.castShadow=true; scene.add(trunk,crown); }

// ---------- decorations at OSM-named places (stylised, not to scale) ----------
function elephant(x,z,ry=0){const g=new THREE.Group(),m=M(0x8d8d92);box(5,3,2.6,m,0,3.6,0,false,g);[[-1.8,-.9],[-1.8,.9],[1.8,-.9],[1.8,.9]].forEach(([a,b])=>cyl(.5,.5,2.4,m,a,1.2,b,8,g));box(1.8,2,2,m,3,4.4,0,false,g);const tr=cyl(.25,.4,2.6,m,3.9,2.8,0,6,g);box(.2,1.8,1.6,m,2.4,4.6,1.4,false,g);box(.2,1.8,1.6,m,2.4,4.6,-1.4,false,g);g.position.set(x,0,z);g.rotation.y=ry;g.scale.setScalar(.8);scene.add(g);animated.push(t=>tr.rotation.z=Math.sin(t*1.5+x)*.25);}
function quad(x,z,c,s=1,ry=0){const g=new THREE.Group(),m=M(c);box(2*s,1*s,1*s,m,0,1.1*s,0,false,g);[[-.7,-.35],[-.7,.35],[.7,-.35],[.7,.35]].forEach(([a,b])=>box(.25*s,.8*s,.25*s,m,a*s,.4*s,b*s,false,g));box(.8*s,.8*s,.7*s,m,1.1*s,1.6*s,0,false,g);g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);return g;}
function lion(x,z,ry){const g=quad(x,z,0xc8913f,1.4,ry);box(1.4,1.4,1.4,M(0x7a4b1e),1.4,2.2,0,false,g);}
function penguin(x,z){const g=new THREE.Group();cyl(.35,.45,1.1,mats.dark,0,.55,0,8,g);box(.5,.7,.1,mats.white,0,.55,.4,false,g);g.position.set(x,0,z);scene.add(g);animated.push(t=>g.rotation.y=Math.sin(t+x*3));}
function monkey(x,z){const g=quad(x,z,0x6b5440,.6,rnd()*6); animated.push(t=>g.position.y=Math.max(0,Math.sin(t*2+x))*.5);}
function brachio(x,z,s=1,ry=0){const g=new THREE.Group(),m=M(0x6f8c5a);box(8*s,4*s,3.5*s,m,0,6*s,0,false,g);[[-3,-1.3],[-3,1.3],[3,-1.3],[3,1.3]].forEach(([a,b])=>cyl(.7*s,.8*s,5*s,m,a*s,2.5*s,b*s,8,g));const n=box(1.2*s,10*s,1.2*s,m,5*s,12*s,0,false,g);n.rotation.z=-.35;box(2.4*s,1.2*s,1.4*s,m,7.2*s,16.8*s,0,false,g);const t=box(8*s,1*s,1*s,m,-7*s,4.5*s,0,false,g);t.rotation.z=.25;g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);}
function trex(x,z,ry,c=0x7a5a3a,s=1){const g=new THREE.Group(),m=M(c);box(5,2.4,2,m,0,4.5,0,false,g);box(2.6,1.8,1.6,m,3,6,0,false,g);[[-.5,-.7],[-.5,.7]].forEach(([a,b])=>box(.8,3.5,.8,m,a,1.8,b,false,g));const t=box(5,1,1,m,-4.5,4.5,0,false,g);t.rotation.z=.2;g.position.set(x,0,z);g.rotation.y=ry;g.scale.setScalar(s);scene.add(g);animated.push(tt=>g.children[1].rotation.z=Math.sin(tt*2+x)*.15);}
// free spot next to a named building (outside its footprint, off the paths)
function besideB(name,k=0){ const b=namedB.find(b=>b.name===name); if(!b)return null; const bb=bboxOf(b.o); const R=Math.max(bb.maxX-bb.minX,bb.maxZ-bb.minZ)/2;
  for(let r=R+2;r<R+30;r+=1.5)for(let a=0;a<24;a++){const an=a/24*Math.PI*2+k*1.3,x=b.x+Math.cos(an)*r,z=b.z+Math.sin(an)*r; if(freeForTree(x,z,3.5)&&inPoly(PARK,x,z))return [x,z];} return null; }
const deco=(name,fn,n=1)=>{for(let i=0;i<n;i++){const p=besideB(name,i*2.1); if(p)fn(p[0],p[1],i);}};
deco('アジアゾウ',(x,z,i)=>elephant(x,z,i*2),2);
deco('カバ舎',(x,z)=>quad(x,z,0x8a7f86,1.8,1));
deco('猛獣舎',(x,z,i)=>lion(x,z,i*2.4),2);
['ツキノワグマ舎','クマ舎'].forEach(n=>deco(n,(x,z)=>quad(x,z,0x2a2420,1.5,rnd()*6)));
deco('極地動物館',(x,z)=>{for(let i=0;i<6;i++)penguin(x-4+i*1.6,z+(i%2)*1.5); quad(x+7,z,0xf5f5f0,1.6,1);});
['ニホンザル舎','パタスザル舎','マンドリル舎'].forEach(n=>deco(n,(x,z)=>{for(let i=0;i<3;i++)monkey(x+i*1.6,z+(i%2));}));
deco('爬虫類・オランウータン舎',(x,z)=>quad(x,z,0xb5561e,.9,1));
dinoNodes.forEach(p=>{const [x,z]=p.p,ry=hash(p.n)*6; if(/ブラキオ/.test(p.n))brachio(x,z,.55,ry); else if(/トリケラ|アンキロ|トウジャンゴ/.test(p.n))quad(x,z,0x7d8a5a,2.2,ry); else if(/メガロドン/.test(p.n)){const f=box(6,2,2,M(0x6a7a88),x,2.5,z);f.rotation.y=ry;} else trex(x,z,ry,0x7a5a3a,.55);});
if(POI['マイアサウラ']) trex(...POI['マイアサウラ'],1,0x8a6a4a,.6);
if(POI['D51 89']){ const [x,z]=POI['D51 89']; const g=new THREE.Group(); box(10,2.6,2.4,mats.dark,0,2.2,0,false,g); box(3,3.6,2.6,mats.dark,-4,3,0,false,g); cyl(.5,.5,1.4,mats.dark,3.6,4.1,0,8,g); [-3,-1,1,3].forEach(a=>{const w=cyl(.9,.9,.3,M(0x992222),a,.9,1.25,12,g);w.rotation.x=Math.PI/2;}); g.position.set(x,0,z); g.rotation.y=hash('d51')*3; scene.add(g); colliders.push({minX:x-5,maxX:x+5,minZ:z-5,maxZ:z+5}); }
if(POI['水車']){ const [x,z]=POI['水車']; const w=new THREE.Mesh(new THREE.TorusGeometry(2.4,.3,6,16),mats.wood); w.position.set(x,2.6,z); scene.add(w); animated.push(t=>w.rotation.z=t*.8); }
// 大観覧車 at its OSM node
if(POI['大観覧車']){ const [wx,wz]=POI['大観覧車']; const R=18, H=R+3; const wheelG=new THREE.Group(); wheelG.position.set(wx,H,wz); scene.add(wheelG);
  [[-2,-3],[2,-3],[-2,3],[2,3]].forEach(([dx,dz])=>{const l=box(1.2,H+1,1.2,mats.grey,wx+dx*1.5,H/2,wz+dz*.6); l.rotation.x=dz*.06;});
  colliders.push({minX:wx-4,maxX:wx+4,minZ:wz-3,maxZ:wz+3});
  const rim=new THREE.Mesh(new THREE.TorusGeometry(R,.4,6,48),M(0xe04848)); rim.rotation.y=Math.PI/2; const spokes=new THREE.Group(); wheelG.add(spokes); spokes.add(rim);
  const gondolas=[]; for(let i=0;i<20;i++){const a=i/20*Math.PI*2; const sp=new THREE.Mesh(new THREE.BoxGeometry(.25,R*2,.25),mats.white); sp.position.set(0,0,0); sp.rotation.x=a; spokes.add(sp);
    const g=new THREE.Mesh(new THREE.BoxGeometry(1.8,2,1.8),M([0xff6b6b,0xffd93d,0x6bcbff,0x8ce07a][i%4])); wheelG.add(g); gondolas.push({g,a});}
  animated.push(t=>{const r=t*.08; spokes.rotation.x=-r; gondolas.forEach(o=>{o.g.position.y=Math.sin(o.a+r)*R-1.2;o.g.position.z=Math.cos(o.a+r)*R;});}); }
// のんほいコースター near its OSM node (elevated so it never blocks paths)
if(POI['のんほいコースター']){ const [cx,cz]=POI['のんほいコースター']; const pts=[]; for(let i=0;i<=64;i++){const a=i/64*Math.PI*2; pts.push(new THREE.Vector3(cx+Math.cos(a)*14, 5+Math.sin(a*3)*1.8, cz+Math.sin(a)*7));}
  const curve=new THREE.CatmullRomCurve3(pts,true); scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve,160,.3,6,true),M(0x2f6fdf)));
  for(let i=0;i<14;i++){const p=curve.getPoint(i/14); cyl(.18,.18,p.y,mats.grey,p.x,p.y/2,p.z,4);}
  const car=box(2.4,1.1,1.3,M(0xffcc00),0,0,0); animated.push(t=>{const u=(t*.08)%1; const p=curve.getPoint(u),q=curve.getPoint((u+.01)%1); car.position.copy(p).y+=.8; car.lookAt(q.x,q.y+.8,q.z); car.rotateY(Math.PI/2);}); }
// 展望塔: slender tower on the OSM footprint
{ const b=namedB.find(b=>b.name==='展望塔'); if(b){ cyl(2,2.6,24,mats.wall,b.x,12,b.z,10); box(7,3,7,mats.glass,b.x,25.5,b.z); box(8,.6,8,mats.roof,b.x,27.3,b.z); } }

// ---------- park lamps along main ways (instanced) ----------
{ const spots=[]; pathLines.filter(l=>l.t==='pedestrian'||l.t==='service').forEach(({pts,w})=>{for(let i=6;i<pts.length-6;i+=18){const a=pts[i-1],b=pts[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,sd=(i/18|0)%2?1:-1; const x=pts[i][0]-(b[1]-a[1])/l*(w/2+.9)*sd,z=pts[i][1]+(b[0]-a[0])/l*(w/2+.9)*sd; if(inPoly(PARK,x,z)&&pathDist(x,z)>0)spots.push([x,z]);}});
  const pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.1,.14,3.6,5),M(0x3b4a3f),spots.length), head=new THREE.InstancedMesh(new THREE.BoxGeometry(.5,.4,.5),M(0xfff4cf),spots.length);
  const mm=new THREE.Matrix4(); spots.forEach(([x,z],i)=>{mm.makeTranslation(x,1.8,z);pole.setMatrixAt(i,mm);mm.makeTranslation(x,3.8,z);head.setMatrixAt(i,mm);}); scene.add(pole,head); }

// ---------- park bus: closed loop computed from the OSM path graph (gates + main circular road) ----------
const busCurve=new THREE.CatmullRomCurve3(D.bus.map(([x,z])=>new THREE.Vector3(x,0,z)),true,'centripetal');
D.busStops.forEach(([x,z])=>{ const u=0; let bi=0,bd=1e9; D.bus.forEach((p,i)=>{const d=Math.hypot(p[0]-x,p[1]-z); if(d<bd){bd=d;bi=i;}}); const a=D.bus[Math.max(0,bi-1)],b=D.bus[Math.min(D.bus.length-1,bi+1)],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,tx=(b[0]-a[0])/l,tz=(b[1]-a[1])/l;
  let ox=-tz*5,oz=tx*5; if(!freeForTree(x+ox,z+oz,1)){ox=-ox;oz=-oz;}
  const g=new THREE.Group(); g.position.set(x+ox,0,z+oz); g.rotation.y=-Math.atan2(tz,tx); scene.add(g);
  box(3,2.6,.2,M(0x2a6fb5),0,1.3,.8,false,g); box(3.4,.2,1.6,M(0x2a6fb5),0,2.7,0,false,g); label('園内バス停',g.position.x,4.4,g.position.z,.5,'#fff','rgba(40,90,170,.85)'); });
const bus=new THREE.Group(); box(7,2.6,2.6,M(0x3d8fd6),0,1.7,0,false,bus); box(7.1,.8,2.7,M(0xffffff),0,2.4,0,false,bus);
[-2.4,2.4].forEach(x=>[-1.3,1.3].forEach(z=>{const w=cyl(.55,.55,.3,mats.dark,x,.55,z,10,bus);w.rotation.x=Math.PI/2;})); scene.add(bus);
const busLen=busCurve.getLength(), _bp=new THREE.Vector3(), _bt=new THREE.Vector3();
animated.push(t=>{const u=((t*6)%busLen)/busLen; busCurve.getPointAt(u,_bp); busCurve.getTangentAt(u,_bt);
  bus.position.set(_bp.x+_bt.z*1.2,0,_bp.z-_bt.x*1.2); bus.rotation.y=-Math.atan2(_bt.z,_bt.x);});

// ---------- collision ----------
const PB=bboxOf(PARK), B={minX:PB.minX-25,maxX:PB.maxX+25,minZ:PB.minZ-25,maxZ:PB.maxZ+25};
function blocked(x,z){ const r=.5;
  if(x<B.minX||x>B.maxX||z<B.minZ||z>B.maxZ)return true;
  const onP=pathDist(x,z)<0; if(onP)return false;               // OSM paths are always walkable (passages, bridges)
  if(!inPoly(PARK,x,z))return true;                               // stay inside the OSM park boundary unless on a path
  for(const b of bldColliders){ if(x>b.bb.minX-r&&x<b.bb.maxX+r&&z>b.bb.minZ-r&&z<b.bb.maxZ+r&&(inPoly(b.p,x,z)||edgeDist(b.p,x,z)<r))return true; }
  for(const w of waterPolys){ if(x>w.bb.minX&&x<w.bb.maxX&&z>w.bb.minZ&&z<w.bb.maxZ&&inPoly(w.p,x,z)&&!onWalk(x,z))return true; }
  return colliders.some(c=>x>c.minX-r&&x<c.maxX+r&&z>c.minZ-r&&z<c.maxZ+r); }
// gate spawn points: nearest walkable path point to the OSM gate building, facing the park centre
const gateSpawns=gates.map(g=>{ const [x,z]=walkableNear(g.gx,g.gz,60); let dx=parkC[0]-x,dz=parkC[1]-z;
  let best=null,bd=1e9; pathLines.forEach(L=>{for(let i=0;i<L.pts.length-1;i++){const d=segDist(x,z,...L.pts[i],...L.pts[i+1]); if(d<bd){bd=d;best=[L.pts[i+1][0]-L.pts[i][0],L.pts[i+1][1]-L.pts[i][1]];}}});
  if(best){ const sgn=best[0]*dx+best[1]*dz>=0?1:-1; dx=best[0]*sgn; dz=best[1]*sgn; } // look along the path, towards the park centre
  return {x,z,yaw:Math.atan2(-dx,-dz)}; });

// ---------- controls ----------
const player={eye:1.4,pitch:0,...gateSpawns[1]};
let fly=false; const keys={};
const helpEl=document.getElementById('help');
function showHelp(v){helpEl.style.display=v?'flex':'none';}
const tipEl=document.getElementById('tip');
function enableTouchUI(){ if(document.body.classList.contains('touch'))return; document.body.classList.add('touch'); tipEl.textContent='「ヘルプ」ボタンで操作説明 ／ 非公式・OSMデータに基づく再現'; }
if(matchMedia('(pointer: coarse)').matches||innerWidth<=900)enableTouchUI();
let lastPtr='mouse';
addEventListener('pointerdown',e=>{lastPtr=e.pointerType; if(e.pointerType==='touch')enableTouchUI();},true);
document.getElementById('start').onclick=()=>{showHelp(false); if(lastPtr==='mouse')renderer.domElement.requestPointerLock?.();};
const warp=i=>{fly=false; Object.assign(player,gateSpawns[i]);};
addEventListener('keydown',e=>{keys[e.code]=true;
  if(e.code==='KeyH')showHelp(helpEl.style.display==='none');
  if(e.code==='KeyF')fly=!fly;
  if(e.code==='Digit1')warp(0); if(e.code==='Digit2')warp(1); if(e.code==='Digit3')warp(2);
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();});
addEventListener('keyup',e=>keys[e.code]=false);
{const m=location.hash.match(/g([0-2])/); if(m)Object.assign(player,gateSpawns[+m[1]]);} if(location.hash.includes('fly')){fly=true;player.pitch=-1.0;} if(location.hash.includes('nohelp'))showHelp(false);
renderer.domElement.addEventListener('click',()=>{if(helpEl.style.display==='none'&&lastPtr==='mouse')renderer.domElement.requestPointerLock?.();});
let dragging=false,lx=0,ly=0;
renderer.domElement.addEventListener('mousedown',e=>{dragging=true;lx=e.clientX;ly=e.clientY;});
addEventListener('mouseup',()=>dragging=false);
addEventListener('mousemove',e=>{let dx=0,dy=0; if(document.pointerLockElement){dx=e.movementX;dy=e.movementY;} else if(dragging){dx=e.clientX-lx;dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;} else return;
  player.yaw-=dx*.0025; player.pitch=Math.max(-1.4,Math.min(1.4,player.pitch-dy*.0025));});
let lookId=null,tlx=0,tly=0;
const cv=renderer.domElement;
cv.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||lookId!==null)return; e.preventDefault(); lookId=e.pointerId; tlx=e.clientX; tly=e.clientY; cv.setPointerCapture(e.pointerId);});
cv.addEventListener('pointermove',e=>{if(e.pointerId!==lookId)return; const dx=e.clientX-tlx,dy=e.clientY-tly; tlx=e.clientX; tly=e.clientY;
  player.yaw-=dx*.005; player.pitch=Math.max(-1.4,Math.min(1.4,player.pitch-dy*.005));});
const endLook=e=>{if(e.pointerId===lookId)lookId=null;};
cv.addEventListener('pointerup',endLook); cv.addEventListener('pointercancel',endLook);
const stickEl=document.getElementById('stick'), knob=document.getElementById('knob');
const stick={id:null,cx:0,cy:0,f:0,s:0};
function stickMove(e){ const R=stickEl.offsetWidth/2; let dx=e.clientX-stick.cx, dy=e.clientY-stick.cy; const d=Math.hypot(dx,dy);
  if(d>R){dx*=R/d;dy*=R/d;} knob.style.transform=`translate(${dx}px,${dy}px)`;
  const m=Math.min(1,d/R); if(m<.15){stick.f=stick.s=0;return;} const k=(m-.15)/.85/(d||1);
  stick.f=-dy*k; stick.s=dx*k; }
stickEl.addEventListener('pointerdown',e=>{if(stick.id!==null)return; e.preventDefault(); stick.id=e.pointerId; const r=stickEl.getBoundingClientRect(); stick.cx=r.left+r.width/2; stick.cy=r.top+r.height/2; stickEl.setPointerCapture(e.pointerId); stickMove(e);});
stickEl.addEventListener('pointermove',e=>{if(e.pointerId===stick.id)stickMove(e);});
const endStick=e=>{if(e.pointerId!==stick.id)return; stick.id=null; stick.f=stick.s=0; knob.style.transform='';};
stickEl.addEventListener('pointerup',endStick); stickEl.addEventListener('pointercancel',endStick);
let runToggle=false; const bRun=document.getElementById('bRun');
bRun.onclick=()=>{runToggle=!runToggle; bRun.classList.toggle('on',runToggle);};
document.getElementById('bFly').onclick=()=>{fly=!fly;};
document.getElementById('bHelp').onclick=()=>showHelp(helpEl.style.display==='none');
document.querySelectorAll('#btns [data-gate]').forEach(b=>b.onclick=()=>warp(+b.dataset.gate));
document.getElementById('touch').addEventListener('pointerdown',e=>e.preventDefault());
document.addEventListener('touchmove',e=>{if(!helpEl.contains(e.target))e.preventDefault();},{passive:false});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

// ---------- minimap (north up, uniform scale, pre-rendered from OSM layers) ----------
const mini=document.getElementById('mini'), mc=mini.getContext('2d');
const ms=Math.min(mini.width/(B.maxX-B.minX), mini.height/(B.maxZ-B.minZ)), mox=(mini.width-(B.maxX-B.minX)*ms)/2, moz=(mini.height-(B.maxZ-B.minZ)*ms)/2;
const toMap=(x,z)=>[mox+(x-B.minX)*ms, moz+(z-B.minZ)*ms];
const miniBg=document.createElement('canvas'); miniBg.width=mini.width; miniBg.height=mini.height;
{ const g=miniBg.getContext('2d'); const poly=(p,fill)=>{g.fillStyle=fill; g.beginPath(); p.forEach(([x,z],i)=>{const [a,b]=toMap(x,z); i?g.lineTo(a,b):g.moveTo(a,b);}); g.closePath(); g.fill();};
  poly(PARK,'#6fa35acc'); zones.forEach(z=>poly(z.poly,z.color+'66')); D.forest.forEach(f=>poly(f,'#3f7d3a88')); D.water.forEach(w=>poly(w.o,'#4a90c2'));
  D.buildings.forEach(b=>poly(b.o,'#5a4a46'));
  g.strokeStyle='#f3e6c0'; g.lineCap=g.lineJoin='round';
  pathLines.forEach(({pts,w,closed})=>{g.lineWidth=Math.max(.8,w*ms); g.beginPath(); pts.forEach(([x,z],i)=>{const [a,b]=toMap(x,z); i?g.lineTo(a,b):g.moveTo(a,b);}); if(closed)g.closePath(); g.stroke();});
  D.areas.forEach(a=>poly(a.o,'#f3e6c0'));
  g.fillStyle='#fff'; g.font='bold 10px sans-serif'; g.shadowColor='#000'; g.shadowBlur=3;
  zones.forEach(z=>{const [cx,cz]=centroid(z.poly); const [a,b]=toMap(cx,cz); g.fillText(z.name,a-g.measureText(z.name).width/2,b);});
  g.font='9px sans-serif'; gates.forEach(gt=>{const [a,b]=toMap(gt.gx,gt.gz); g.fillText(gt.n,a-10,b-4);}); }
function drawMini(){ mc.clearRect(0,0,mini.width,mini.height); mc.drawImage(miniBg,0,0);
  const [bx,bz]=toMap(bus.position.x,bus.position.z); mc.fillStyle='#3d8fd6'; mc.fillRect(bx-2,bz-2,4,4);
  const [px,pz]=toMap(player.x,player.z); mc.save(); mc.translate(px,pz); mc.rotate(-player.yaw); mc.fillStyle='#ff3b3b'; mc.beginPath(); mc.moveTo(0,-7); mc.lineTo(5,5); mc.lineTo(-5,5); mc.fill(); mc.restore();
  mc.fillStyle='#fff'; mc.font='10px sans-serif'; mc.fillText('N↑',mini.width-20,12);}
mini.addEventListener('click',e=>{const r=mini.getBoundingClientRect(); const x=B.minX+((e.clientX-r.left)*(mini.width/r.width)-mox)/ms, z=B.minZ+((e.clientY-r.top)*(mini.height/r.height)-moz)/ms;
  if(!blocked(x,z)){player.x=x;player.z=z;} else {fly=true;player.x=Math.max(B.minX,Math.min(B.maxX,x));player.z=Math.max(B.minZ,Math.min(B.maxZ,z));}});

// ---------- loop ----------
const areaEl=document.getElementById('area'), subEl=document.getElementById('sub');
let last=performance.now(), flyH=player.eye;
function loop(now){ const dt=Math.min(.05,(now-last)/1000); last=now; const t=now/1000;
  const sp=(keys.ShiftLeft||keys.ShiftRight||runToggle?14:6)*(fly?3:1)*dt;
  let f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0), s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  if(!f&&!s){f=stick.f;s=stick.s;}
  if(f||s){ const fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw),rx=Math.cos(player.yaw),rz=-Math.sin(player.yaw);
    const nx=player.x+(fx*f+rx*s)*sp, nz=player.z+(fz*f+rz*s)*sp;
    if(fly){player.x=Math.max(B.minX,Math.min(B.maxX,nx));player.z=Math.max(B.minZ,Math.min(B.maxZ,nz));}
    else{ if(!blocked(nx,player.z))player.x=nx; if(!blocked(player.x,nz))player.z=nz; } }
  if(!fly&&blocked(player.x,player.z)){ const [x,z]=walkableNear(player.x,player.z,120,false); player.x=x; player.z=z; }
  flyH+=((fly?230:player.eye)-flyH)*Math.min(1,dt*3);
  camera.position.set(player.x,flyH,player.z);
  camera.rotation.set(fly?Math.min(player.pitch,-.6):player.pitch,player.yaw,0,'YXZ');
  animated.forEach(fn=>fn(t));
  const z=zones.find(z=>inPoly(z.poly,player.x,player.z));
  const near=landmarks.filter(l=>Math.hypot(l.x-player.x,l.z-player.z)<l.r).sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z))[0];
  const nearGate=near&&/門/.test(near.name);
  areaEl.textContent=nearGate?'エントランス':(z?z.name:(inPoly(PARK,player.x,player.z)?'園内':'園外'));
  subEl.textContent=(near?near.name+'　':'')+(fly?'［上空ビュー］':'');
  renderer.render(scene,camera); drawMini(); requestAnimationFrame(loop);}
requestAnimationFrame(loop);
