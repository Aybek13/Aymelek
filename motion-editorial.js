
(()=>{'use strict';
const root=document.querySelector('#aymelek-motion-root');if(!root)return;
const items=[
{name:'Rose Elixir',type:'Işıltı serumu',color:'#c56b95',url:'products.html?cat=care'},
{name:'Moon Glow',type:'Nemlendirici bakım',color:'#a989cf',url:'products.html?cat=care'},
{name:'Silk Essence',type:'Günlük bakım',color:'#d5aa74',url:'products.html?cat=care'}
];
const looks=[
{title:'Yeni bir siluet',tag:'01 / STİL',image:'url("hero-woman.jpg")',url:'products.html?cat=dresses'},
{title:'Adımların ritmi',tag:'02 / AYAKKABI',image:'url("shoe-assets/sneaker-1.webp")',url:'products.html?cat=shoes'},
{title:'Küçük detaylar',tag:'03 / AKSESUAR',image:'url("category-assets/kids-1.webp")',url:'products.html?cat=accessories'}
];
root.innerHTML=`<div class="motion-editorial">
<section class="motion-stage" id="bakim-vitrini" aria-label="Etkileşimli bakım vitrini">
 <div class="motion-stage-head"><p class="motion-kicker">AYMELEK / BEAUTY LAB</p><h2 class="motion-title">Bakımın <em>yeni boyutu.</em></h2><p class="motion-lead">Işığı yakala. Şişeyi döndür. Koleksiyonu keşfet.</p></div>
 <div class="motion-gallery" aria-label="Üç boyutlu ürün seçimi"></div>
 <div class="motion-stage-foot"><div aria-live="polite"><p class="motion-kicker">SEÇİLİ KOLEKSİYON</p><h3 id="motion-name"></h3><p id="motion-type"></p></div><div class="motion-controls"><button class="motion-control" type="button" data-prev aria-label="Önceki ürün">‹</button><button class="motion-control" type="button" data-next aria-label="Sonraki ürün">›</button><a class="motion-cta" id="motion-shop" href="products.html?cat=care">KOLEKSİYONU KEŞFET ↗</a></div></div>
</section>
<section class="motion-story" id="aymelek-hikayesi" aria-label="AYMELEK marka hikayesi"><div class="motion-story-sticky"><div class="motion-story-art" aria-hidden="true"></div><div class="motion-story-copy"><p class="motion-kicker">BİZİM HİKÂYEMİZ</p><h2 class="motion-title">Her detayda <em>sen.</em></h2><p class="motion-lead">AYMELEK, kendi stilini özgürce ifade etmek isteyenler için tasarlanmış bir moda keşif alanı. Yeni favorilerini bul, kombinini tamamla, kendi hikâyeni yaz.</p><a class="motion-cta" href="about.html">AYMELEK'İ TANI ↗</a></div></div></section>
<section class="motion-lookbook" id="lookbook" aria-label="Etkileşimli stil lookbook"><div class="motion-lookbook-head"><div><p class="motion-kicker">THE EDIT / 2027</p><h2 class="motion-title">Stil, <em>hareket halinde.</em></h2></div><p class="motion-lead">Yeni sezonun enerjisini keşfet. Her görünüm başka bir hikâye.</p></div><div class="motion-lookbook-frame"><div class="motion-lookbook-photo" aria-hidden="true"></div><div class="motion-lookbook-info" aria-live="polite"><p class="motion-kicker" id="motion-look-tag"></p><h3 id="motion-look-title"></h3><a class="motion-cta" id="motion-look-link" href="products.html">STİLİ KEŞFET ↗</a></div><div class="motion-lookbook-nav"><button class="motion-control" type="button" data-look-prev aria-label="Önceki görünüm">‹</button><button class="motion-control" type="button" data-look-next aria-label="Sonraki görünüm">›</button></div></div><div class="motion-lookbook-dots" aria-label="Görünüm seçimi"></div></section>
</div>`;
const gallery=root.querySelector('.motion-gallery');
items.forEach((item,i)=>{const btn=document.createElement('button');btn.type='button';btn.className='motion-product';btn.setAttribute('aria-label',item.name+' ürününü seç veya döndür');btn.innerHTML=`<span class="motion-bottle"><span class="motion-cap"></span><span class="motion-glass" style="--liquid:${item.color}"><span class="motion-label"><b>AYMELEK</b><small>BEAUTY COLLECTION</small><i>${item.name}</i></span></span></span>`;gallery.append(btn)});
let active=1,turns=[0,0,0],drag=null;const buttons=[...gallery.querySelectorAll('.motion-product')];const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function paint(){buttons.forEach((btn,i)=>{let offset=i-active;btn.style.setProperty('--slot',offset);btn.style.setProperty('--distance',Math.abs(offset));btn.style.setProperty('--turn',turns[i]+'deg');btn.style.setProperty('--glint',Math.abs(Math.sin(turns[i]*Math.PI/180)).toFixed(2));btn.setAttribute('aria-pressed',String(i===active));btn.tabIndex=0});root.querySelector('#motion-name').textContent=items[active].name;root.querySelector('#motion-type').textContent=items[active].type;root.querySelector('#motion-shop').href=items[active].url}
function choose(i){active=(i+items.length)%items.length;paint()}
buttons.forEach((btn,i)=>{btn.addEventListener('click',()=>{if(drag?.moved)return;if(i===active)turns[i]+=45;else active=i;paint()});btn.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();choose(active+(e.key==='ArrowRight'?1:-1));buttons[active].focus()}else if(e.key==='Enter'&&i===active){turns[i]+=45;paint()}});btn.addEventListener('pointerdown',e=>{if(i!==active)return;drag={x:e.clientX,start:turns[i],moved:false};btn.setPointerCapture(e.pointerId)});btn.addEventListener('pointermove',e=>{if(!drag||i!==active)return;let d=e.clientX-drag.x;if(Math.abs(d)>6)drag.moved=true;turns[i]=drag.start+d*.75;paint()});btn.addEventListener('pointerup',()=>{setTimeout(()=>drag=null,80)});btn.addEventListener('pointercancel',()=>drag=null)});
root.querySelector('[data-prev]').addEventListener('click',()=>choose(active-1));root.querySelector('[data-next]').addEventListener('click',()=>choose(active+1));paint();
const story=root.querySelector('.motion-story'),art=root.querySelector('.motion-story-art');
function onScroll(){if(reduced.matches)return;const r=story.getBoundingClientRect();const span=Math.max(1,r.height-innerHeight);const p=Math.max(0,Math.min(1,-r.top/span));art.style.setProperty('--progress',p.toFixed(3))}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();
let look=0,swapTimer;const frame=root.querySelector('.motion-lookbook-frame'),photo=root.querySelector('.motion-lookbook-photo'),dots=root.querySelector('.motion-lookbook-dots');
looks.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Görünüm '+(i+1));b.addEventListener('click',()=>setLook(i));dots.append(b)});
function setLook(i){look=(i+looks.length)%looks.length;const apply=()=>{const x=looks[look];photo.style.setProperty('--look-image',x.image);root.querySelector('#motion-look-tag').textContent=x.tag;root.querySelector('#motion-look-title').textContent=x.title;root.querySelector('#motion-look-link').href=x.url;[...dots.children].forEach((b,j)=>b.setAttribute('aria-current',String(j===look)));frame.classList.remove('is-changing')};clearTimeout(swapTimer);if(reduced.matches){apply();return}frame.classList.add('is-changing');swapTimer=setTimeout(apply,220)}
root.querySelector('[data-look-prev]').addEventListener('click',()=>setLook(look-1));root.querySelector('[data-look-next]').addEventListener('click',()=>setLook(look+1));setLook(0);
})();
