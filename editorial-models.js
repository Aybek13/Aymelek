import * as T from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

const collections = {
  shoes: ['Koşu sneaker','Bantlı topuklu','Kısa bot','Loafer','Platform sneaker','Babet'],
  clothing: ['Midi elbise','Blazer','Geniş paça pantolon','Kısa ceket','Uzun etek','Trençkot'],
  care: ['Serum','Parfüm','Yüz kremi','Dudak ruju','Temizleme jeli','Vücut losyonu'],
  accessories: ['Omuz çantası','İnci kolye','Halka küpe','Zincir bileklik','El çantası','Yüzük'],
  intimates: ['Uzun pijama','Gecelik','Dantel takım','Kısa pijama','Saten sabahlık','Ev giyim takımı']
};
const colors = [0xdabcaa,0x762e48,0x4e77a0,0xb87b85,0x6f584e,0x2d283d];
const gold = 0xe0ac67;
const cream = 0xe6d7ca;
const mat = (color, metalness = .12, roughness=.47) => new T.MeshStandardMaterial({color,metalness,roughness});
function add(group, geometry, material, x=0, y=0, z=0) {
  const mesh = new T.Mesh(geometry, material); mesh.position.set(x,y,z); group.add(mesh); return mesh;
}
function sphere(group, material, x,y,z, sx,sy,sz) {
  const m=add(group,new T.SphereGeometry(1,18,12),material,x,y,z);m.scale.set(sx,sy,sz);return m;
}
function ring(group, material, radius, tube, x=0,y=0,z=0) {
  return add(group,new T.TorusGeometry(radius,tube,10,42),material,x,y,z);
}
function line(group, material, points, radius=.024) {
  const curve = new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
  return add(group,new T.TubeGeometry(curve,20,radius,8,false),material);
}
function outline(group, points, depth, material, bevel=.045) {
  const shape=new T.Shape();
  points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y)); shape.closePath();
  const mesh=add(group,new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,steps:1}),material,0,0,-depth/2);
  return mesh;
}
function shoe(g,i,m) {
  const tall = i===2, heel = i===1, sneaker = i===0||i===4;
  const sole = mat(i===4?0x63556c:cream), trim=mat(i===3?0x4f302f:0xf2d7d1);
  const foot=[[-1.08,-.25],[-1.03,.04],[-.77,.23],[-.28,.18],[.06,.04],[.83,.02],[1.03,-.11],[.99,-.25]];
  outline(g,foot,.66,sole,.095);
  outline(g,[[-1.02,-.16],[-.89,.27],[-.64,tall?.92:.41],[-.39,tall?.91:.44],[-.15,.29],[.19,.12],[.80,.10],[.98,-.10],[.83,-.19]],.53,m,.11);
  if(heel) {
    const high=add(g,new T.CylinderGeometry(.08,.055,.62,12),m,-.88,-.49,0);high.rotation.z=-.13;
    line(g,trim,[[-.72,.2,-.28],[-.57,.60,0],[-.43,.2,.28]],.045);
  }
  if(sneaker||tall) for(let n=0;n<4;n++) {
    const x=-.48+n*.20;
    line(g,trim,[[x,.16,.32],[x+.11,.33-n*.035,0],[x+.02,.16,-.32]],.023);
  }
  else line(g,trim,[[-.5,.16,.32],[.08,.28,.16],[.11,.28,-.18],[-.5,.16,-.32]],.035);
  if(i===4) add(g,new T.BoxGeometry(1.65,.1,.56),trim,-.04,-.32,0);
}
function garment(g,i,m,inner) {
  const seam=mat(inner?0xd1a0ab:0x27232a), button=mat(gold,.62,.29);
  const skirt = !inner&&i===4, pants=!inner&&i===2;
  if(pants||skirt) {
    const shape=skirt?[[-.48,.64],[.48,.64],[.83,-.92],[-.83,-.92]]:
      [[-.62,.72],[.62,.72],[.64,-.94],[.16,-.94],[0,-.09],[-.16,-.94],[-.64,-.94]];
    outline(g,shape,.13,m,.065);
    line(g,seam,[[-.56,.57,.10],[0,.55,.10],[.56,.57,.10]],.025);
    return;
  }
  const sleeveless=(inner&&[1,2].includes(i))||(!inner&&i===0);
  const length=(!inner&&[0,5].includes(i))||(inner&&[1,4].includes(i)) ? .96 : .52;
  const style=sleeveless?[[-.46,.67],[-.25,.75],[-.11,.49],[.11,.49],[.25,.75],[.46,.67],[.28,.20],[.55,-length],[-.55,-length],[-.28,.20]]:
    [[-.33,.71],[-.59,.59],[-.94,.13],[-.70,-.03],[-.48,.23],[-.47,-length],[.47,-length],[.48,.23],[.70,-.03],[.94,.13],[.59,.59],[.33,.71],[.17,.59],[-.17,.59]];
  outline(g,style,.14,m,.065);
  line(g,seam,[[-.22,.62,.12],[0,.42,.13],[.22,.62,.12]],.022);
  if(!sleeveless) for(let n=0;n<4;n++) sphere(g,button,.03,.30-n*.18,.126,.035,.035,.024);
  if(inner&&i===2) {
    sphere(g,m,-.23,.23,.13,.25,.2,.16);sphere(g,m,.23,.23,.13,.25,.2,.16);
  }
  if(inner&&[0,3,5].includes(i)) {
    const bottom=new T.Group();outline(bottom,[[-.44,.25],[.44,.25],[.46,-.55],[.13,-.55],[0,-.03],[-.13,-.55],[-.46,-.55]],.10,m);
    bottom.position.set(.59,-.46,-.31);bottom.scale.setScalar(i===3?.42:.56);g.add(bottom);
  }
}
function container(g,i,m) {
  const cap=mat(gold,.65,.28), label=mat(cream);
  const height=[.88,.78,.45,.84,1.02,1.06][i], radius=[.34,.53,.61,.25,.43,.48][i];
  const profile=[[0,-.60],[radius*.83,-.60],[radius,-.52],[radius,-.55+height*.74],[radius*.8,-.55+height],[0,-.55+height]]
    .map(([a,b])=>new T.Vector2(a,b));
  add(g,new T.LatheGeometry(profile,34),m);
  add(g,new T.CylinderGeometry(i===2?radius*.94:radius*.49,i===2?radius*.96:radius*.54,i===2?.14:.25,28),cap,0,-.43+height,0);
  if(i===0) sphere(g,mat(0x3c2930),0,.72,0,.115,.18,.115);
  if(i===3) add(g,new T.CylinderGeometry(radius*.59,radius*.61,.35,24),mat(0xa33551),0,.58,0).rotation.z=.13;
  if(i>=4) line(g,cap,[[0,.56,0],[0,.75,0],[.28,.75,0]],.055);
  add(g,new T.BoxGeometry(radius*1.08,height*.26,.018),label,0,-.25,radius*.98);
}
function accessory(g,i,m) {
  const metal=mat(gold,.73,.24), pearl=mat(0xf4ebe4,.27,.24);
  if(i===0||i===4) {
    outline(g,[[-.76,-.58],[-.67,.31],[.67,.31],[.76,-.58]],.39,m,.11);
    outline(g,[[-.65,.33],[.65,.33],[.52,-.07],[0,-.19],[-.52,-.07]],.037,m,.05).position.z=.25;
    line(g,metal,[[-.42,.30,0],[-.36,.73,0],[0,.91,0],[.36,.73,0],[.42,.3,0]],.045);
    add(g,new T.BoxGeometry(.21,.12,.078),metal,0,-.03,.32);
  } else if(i===1||i===3) {
    ring(g,metal,.62,.035).scale.y=.76;
    for(let n=0;n<18;n++){
      const a=n*2*Math.PI/18;
      if(i===1) sphere(g,pearl,.62*Math.cos(a),.48*Math.sin(a),0,.064,.064,.064);
      else ring(g,metal,.076,.018,.62*Math.cos(a),.48*Math.sin(a)).rotation.y=n%2?.74:0;
    }
  } else if(i===2) {
    ring(g,metal,.34,.065,-.39,.07);
    ring(g,metal,.34,.065,.39,-.07).rotation.y=.31;
  } else {
    ring(g,metal,.46,.065).rotation.x=.43;
    add(g,new T.OctahedronGeometry(.22),mat(0xb4aee1,.32,.22),0,.48,.11);
  }
}
export function modelFor(category,index) {
  const group=new T.Group(), material=mat(colors[index],.15,.41);
  if(category==='shoes') shoe(group,index,material);
  else if(category==='care') container(group,index,material);
  else if(category==='accessories') accessory(group,index,material);
  else garment(group,index,material,category==='intimates');
  const bounds=new T.Box3().setFromObject(group);
  const size=bounds.getSize(new T.Vector3());
  group.position.sub(bounds.getCenter(new T.Vector3()));
  const normalized = new T.Group(); normalized.add(group);
  normalized.scale.setScalar(1.82/Math.max(size.x,size.y,size.z));
  return normalized;
}

const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const categoryTitle={shoes:'Ayakkabı',clothing:'Giyim',care:'Bakım',accessories:'Aksesuar',intimates:'Pijama ve İç Giyim'};
function install(root) {
  const stage=root.querySelector('[data-dial-stage]');
  const status=root.querySelector('[data-dial-status]');
  const title=root.querySelector('[data-dial-title]');
  const current=root.querySelector('[data-dial-current]');
  const prev=root.querySelector('[data-dial-prev]');
  const next=root.querySelector('[data-dial-next]');
  const scene=new T.Scene();
  const camera=new T.OrthographicCamera(-4,4,4,-4,.1,100);camera.position.z=15;
  let renderer;
  try { renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'}); }
  catch {
    stage.hidden=true;
    prev.disabled=next.disabled=true;
    return category=>{
      title.textContent=categoryTitle[category];
      current.href='products.html?cat='+category;
      current.textContent=categoryTitle[category]+' kataloğu';
      status.textContent='3D vitrin için WebGL destekli bir tarayıcı gerekir.';
    };
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.setClearColor(0,0);
  renderer.domElement.setAttribute('aria-hidden','true');
  stage.append(renderer.domElement);
  scene.add(new T.HemisphereLight(0xfff2ef,0x827794,2.5));
  const key=new T.DirectionalLight(0xffe0de,3.4);key.position.set(3,6,7);scene.add(key);
  const rim=new T.DirectionalLight(0xdd95c3,2);rim.position.set(-6,1,-2);scene.add(rim);
  let category, models=[], centerModel, angle=0, frame=0, visible=false, drag;
  const cache=new Map();
  const hotspots = Array.from({length:6},(_,i)=>{
    const button=document.createElement('button');button.type='button';button.className='model-hotspot';
    button.addEventListener('click',()=>{if (!drag?.moved) {angle=i; paint();}});
    stage.append(button); return button;
  });
  function paint(now=0) {
    const selected=((Math.round(angle)%6)+6)%6;
    const step=2*Math.PI/6;
    const width=stage.clientWidth,height=stage.clientHeight;
    if(!width||!height)return;
    const wide=width/height;
    const radius=Math.min(2.65,3.15*wide);
    const spin=reduce.matches?0:Math.sin(now*.0009)*.26;
    models.forEach((m,i)=>{
      const a=(i-angle)*step;
      const x=Math.sin(a)*radius,y=Math.cos(a)*radius;
      m.position.set(x,y,0);
      m.rotation.set(.16,.35+Math.sin(a)*.32,0);
      m.scale.setScalar(.69);
      hotspots[i].style.left=(50+x*100/(8*wide))+'%';
      hotspots[i].style.top=(50-y*100/8)+'%';
      hotspots[i].setAttribute('aria-pressed',String(i===selected));
    });
    const active=models[selected];
    if(centerModel.userData.selection!==selected) {
      centerModel.clear();centerModel.add(active.userData.original.clone());
      centerModel.userData.selection=selected;
      status.textContent=collections[category][selected]+' · '+(selected+1)+' / 6 · 3D vitrin örneği';
    }
    centerModel.rotation.set(.10,.32+spin,0);
    centerModel.scale.setScalar(1.18);
    renderer.render(scene,camera);
  }
  function animate(now) {
    if(!visible||reduce.matches){frame=0;return;}
    paint(now);frame=requestAnimationFrame(animate);
  }
  function select(categoryKey) {
    category=categoryKey;
    for(const model of models)scene.remove(model);
    if(centerModel)scene.remove(centerModel);
    if(!cache.has(category)) cache.set(category,collections[category].map((_,i)=>modelFor(category,i)));
    models=cache.get(category).map(original=>{const holder=new T.Group();holder.add(original.clone());holder.userData.original=original;scene.add(holder);return holder;});
    centerModel=new T.Group();centerModel.position.z=1;scene.add(centerModel);
    angle=0;title.textContent=categoryTitle[category];
    current.href='products.html?cat='+category;
    current.textContent=categoryTitle[category]+' kataloğu';
    hotspots.forEach((button,i)=>button.setAttribute('aria-label',collections[category][i]));
    paint();
  }
  function rotate(delta){angle=Math.round(angle)+delta;paint();}
  prev.onclick=()=>rotate(-1);
  next.onclick=()=>rotate(1);
  root.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
    e.preventDefault();rotate(e.key==='ArrowLeft'?-1:1);
  });
  stage.addEventListener('pointerdown',e=>{
    if(e.isPrimary&&e.button===0)drag={id:e.pointerId,x:e.clientX,start:angle,moved:false};
  });
  stage.addEventListener('pointermove',e=>{
    if(drag?.id!==e.pointerId)return;
    const dx=e.clientX-drag.x;
    if(!drag.moved&&Math.abs(dx)<6)return;
    if(!drag.moved)stage.setPointerCapture(e.pointerId);
    drag.moved=true;angle=drag.start-dx/65;paint();
  });
  function finish(e){
    if(drag?.id!==e.pointerId)return;
    angle=Math.round(angle);paint();setTimeout(()=>{drag=null},0);
  }
  stage.addEventListener('pointerup',finish);
  stage.addEventListener('pointercancel',finish);
  new ResizeObserver(()=>{
    const w=stage.clientWidth,h=stage.clientHeight;
    if(!w||!h)return;
    camera.left=-4*w/h;camera.right=4*w/h;camera.updateProjectionMatrix();
    renderer.setSize(w,h,false);paint();
  }).observe(stage);
  new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;
    if(visible&&!frame&&!reduce.matches)frame=requestAnimationFrame(animate);
    if(!visible&&frame){cancelAnimationFrame(frame);frame=0;}
  },{threshold:.08}).observe(stage);
  reduce.addEventListener('change',()=>{
    if(visible&&!frame&&!reduce.matches)frame=requestAnimationFrame(animate);
    if(reduce.matches)paint();
  });
  return select;
}

if(typeof document!=='undefined') {
  const dials=[...document.querySelectorAll('[data-dial]')];
  const select=dials.map(install);
  select[0]?.('shoes');select[1]?.('clothing');
  document.querySelectorAll('[data-collection]').forEach(link=>link.addEventListener('click',e=>{
    if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    const category=link.dataset.collection;
    if(!collections[category])return;
    e.preventDefault(); const index=category==='shoes'?0:1;
    select[index](category);dials[index].scrollIntoView({block:'start'});
  }));
}
