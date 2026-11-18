/* AYMELEK 3D ürün görüntüleyici — kütüphanesiz, canvas ile gerçek zamanlı dönen şişe ve kutu */
(function(){
function mk(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c}
function dark(hex,k){var n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;return'rgb('+Math.round(r*k)+','+Math.round(g*k)+','+Math.round(b*k)+')'}
function sprig(x,cx,y0,h,col,lw){x.strokeStyle=col;x.lineWidth=lw;x.lineCap='round';x.beginPath();x.moveTo(cx,y0+h);x.lineTo(cx,y0);x.stroke();
 for(var i=0;i<12;i++){var y=y0+h*(0.08+i*0.075),L=h*0.16*(1-i*0.045);[-1,1].forEach(function(s){x.beginPath();x.moveTo(cx,y);x.lineTo(cx+s*L*0.75,y-L*0.8);x.stroke()})}}
function wlogo(img,col,w){var c=mk(w,Math.round(w*img.height/img.width)),x=c.getContext('2d');x.drawImage(img,0,0,c.width,c.height);x.globalCompositeOperation='source-in';x.fillStyle=col;x.fillRect(0,0,c.width,c.height);return c}
function mount(cv,o){o=o||{};var color=o.color||'#2E7D32',label=o.label||'BİBERİYE SUYU',logo=null,x=cv.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2),W=0,H=0,u=1,ang=0,vel=.006,drag=false,lx=0,vis=true,raf=0,dead=false,red=matchMedia('(prefers-reduced-motion:reduce)').matches;
 var BW=2048,BH=1762,body=mk(BW,BH),fF=mk(420,1560),fS=mk(300,1560);
 function build(){
  var b=body.getContext('2d'),g=b.createLinearGradient(0,0,0,BH);g.addColorStop(0,dark(color,1.25));g.addColorStop(.5,color);g.addColorStop(1,dark(color,.72));b.fillStyle=g;b.fillRect(0,0,BW,BH);
  b.fillStyle='#fff';b.textAlign='center';for(var i=-1;i<=1;i++)b.fillRect(1024+i*96-16,80,32,330);
  if(logo){var l=wlogo(logo,'#fff',560);b.drawImage(l,1024-280,470)}
  b.font='bold 92px Georgia,serif';b.fillText(label,1024,1080);sprig(b,1024,1170,380,'#fff',10);
  b.font='60px Arial,sans-serif';b.fillText('Hidrosel Saç ve Cilt Bakımı',1024,1650);b.font='56px Arial,sans-serif';b.fillText('100 ml',1024,1730);
  var f=fF.getContext('2d');f.fillStyle='#fbfbfb';f.fillRect(0,0,420,1560);f.strokeStyle='#e3e3e3';f.lineWidth=4;f.strokeRect(2,2,416,1556);
  f.fillStyle=color;for(i=-1;i<=1;i++)f.fillRect(210+i*60-12,90,24,360);
  if(logo){var l2=wlogo(logo,color,230);f.drawImage(l2,95,560)}
  f.fillStyle='#222';f.textAlign='center';f.font='bold 58px Georgia,serif';var w=label.split(' ');f.fillText(w[0],210,900);f.fillText(w.slice(1).join(' '),210,972);sprig(f,210,1030,330,color,7);
  f.fillStyle='#777';f.font='38px Arial,sans-serif';f.fillText('Hidrosel',210,1440);f.fillText('Saç ve Cilt Bakımı',210,1490);
  var s=fS.getContext('2d');s.fillStyle='#f3f3f3';s.fillRect(0,0,300,1560);s.fillStyle=color;s.fillRect(0,0,300,26);s.fillStyle='#999';s.textAlign='center';s.font='34px Arial,sans-serif';s.fillText('AYMELEK',150,800);s.font='26px Arial,sans-serif';s.fillText('100 ml',150,850)}
 build();if(o.logo){var im=new Image();im.onload=function(){logo=im;build();if(W)draw()};im.src=o.logo}
 function size(){var r=cv.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);cv.width=W*dpr;cv.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);u=Math.min(H/100,W/58)}
 function shade(px,py,w,h,k){var g=x.createLinearGradient(px,0,px+w,0);g.addColorStop(0,'rgba(0,0,0,'+.55*k+')');g.addColorStop(.2,'rgba(0,0,0,0)');g.addColorStop(.26,'rgba(255,255,255,'+.38*k+')');g.addColorStop(.32,'rgba(255,255,255,0)');g.addColorStop(.7,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+.6*k+')');x.fillStyle=g;x.fillRect(px,py,w,h)}
 function cyl(cx,ybot,R,h,fill,k){var g=x.createLinearGradient(cx-R,0,cx+R,0);g.addColorStop(0,dark(fill,.5));g.addColorStop(.28,dark(fill,1.1));g.addColorStop(.55,fill);g.addColorStop(1,dark(fill,.45));x.fillStyle=g;x.fillRect(cx-R,ybot-h,2*R,h)}
 function draw(){x.clearRect(0,0,W,H);var gy=H/2+40*u,bx=W*.66,cxb=W*.34;
  var sh=x.createRadialGradient(W/2,gy+2*u,2,W/2,gy+2*u,34*u);sh.addColorStop(0,'rgba(23,19,23,.28)');sh.addColorStop(1,'rgba(23,19,23,0)');x.save();x.translate(0,0);x.scale(1,1);x.fillStyle=sh;x.beginPath();x.ellipse(W/2,gy+2*u,34*u,4*u,0,0,6.283);x.fill();x.restore();
  /* kutu */
  var bw=10.5*u,bd=7.5*u,bh=78*u,c=Math.cos(ang),s=Math.sin(ang),fc=[
   {n:c,a:[-bw,bd],b:[bw,bd],t:fF},{n:-s,a:[bw,bd],b:[bw,-bd],t:fS},{n:-c,a:[bw,-bd],b:[-bw,-bd],t:fS},{n:s,a:[-bw,-bd],b:[-bw,bd],t:fS}];
  fc.forEach(function(f){if(f.n<=.001)return;var x1=cxb+f.a[0]*c+f.a[1]*s,x2=cxb+f.b[0]*c+f.b[1]*s,l=Math.min(x1,x2),w=Math.abs(x2-x1);if(w<1)return;x.drawImage(f.t,l,gy-bh,w,bh);x.fillStyle='rgba(0,0,0,'+(.34*(1-f.n)+(f.t===fS?.12:0))+')';x.fillRect(l,gy-bh,w,bh)});
  /* şişe */
  var R=7.4*u,bodyH=40*u,top=gy-bodyH,Rpx=R;
  x.save();x.beginPath();x.moveTo(bx-R,top);x.lineTo(bx-R,gy-R*.35);x.quadraticCurveTo(bx-R,gy,bx-R*.65,gy);x.lineTo(bx+R*.65,gy);x.quadraticCurveTo(bx+R,gy,bx+R,gy-R*.35);x.lineTo(bx+R,top);x.closePath();x.clip();
  for(var dx=-Math.floor(Rpx);dx<=Math.floor(Rpx);dx++){var t=dx/Rpx,ph=Math.asin(Math.max(-.999,Math.min(.999,t))),fx=(((ph-ang)/6.2832+.5)%1+1)%1;x.drawImage(body,fx*BW,0,2.2,BH,bx+dx,top,1.5,bodyH)}
  shade(bx-R,top,2*R,bodyH,1);x.restore();
  /* omuz */
  var sy=top-7*u,Rn=3.6*u;x.save();x.beginPath();x.moveTo(bx-R,top);x.bezierCurveTo(bx-R,top-4.5*u,bx-Rn,sy+2*u,bx-Rn,sy);x.lineTo(bx+Rn,sy);x.bezierCurveTo(bx+Rn,sy+2*u,bx+R,top-4.5*u,bx+R,top);x.closePath();x.clip();
  var g=x.createLinearGradient(0,sy,0,top);g.addColorStop(0,dark(color,1.15));g.addColorStop(1,color);x.fillStyle=g;x.fillRect(bx-R,sy,2*R,7*u);shade(bx-R,sy,2*R,7*u,1);x.restore();
  cyl(bx,sy,Rn,5*u,color);shade(bx-Rn,sy-5*u,2*Rn,5*u,1);
  /* altın boyun halkası */
  var gy2=sy-5*u,Rg=4.3*u;cyl(bx,gy2,Rg,7*u,'#c9a14a');shade(bx-Rg,gy2-7*u,2*Rg,7*u,1.1);x.fillStyle='rgba(255,255,255,.35)';x.fillRect(bx-Rg,gy2-7*u,2*Rg,.5*u);
  /* pompa başlığı */
  var gy3=gy2-7*u,Rp=3*u;cyl(bx,gy3,Rp,10*u,'#f4f4f4');shade(bx-Rp,gy3-10*u,2*Rp,10*u,.9);
  x.fillStyle='#e6e6e6';x.fillRect(bx-Rp*1.15,gy3-12.4*u,Rp*2.3,2.4*u);x.fillStyle='#d9d9d9';x.fillRect(bx+Rp*.6,gy3-11.8*u,Rp*1.6,1.4*u)}
 function loop(){if(dead)return;if(vis){if(!drag){ang+=vel;vel+=(.006-vel)*.03}draw()}raf=requestAnimationFrame(loop)}
 function dn(e){drag=true;lx=e.clientX;cv.setPointerCapture&&cv.setPointerCapture(e.pointerId)}
 function mv(e){if(!drag)return;var d=e.clientX-lx;ang+=d*.012;vel=d*.004;lx=e.clientX;if(red)draw()}
 function up(){drag=false}
 cv.addEventListener('pointerdown',dn);cv.addEventListener('pointermove',mv);cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
 var onr=function(){size();draw()};addEventListener('resize',onr);size();draw();
 var io=null;if('IntersectionObserver'in window){io=new IntersectionObserver(function(e){vis=e[0].isIntersecting});io.observe(cv)}
 if(!red)raf=requestAnimationFrame(loop);
 return{setColor:function(c){color=c;build();draw()},stop:function(){dead=true;cancelAnimationFrame(raf);removeEventListener('resize',onr);io&&io.disconnect()}}}
window.Bottle3D={mount:mount}})();
