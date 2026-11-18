/* AYMELEK — site arka planı: d\u00f6nen 3D hilal ve y\u0131ld\u0131zlar */
(function(){var c=document.createElement('canvas');c.setAttribute('aria-hidden','true');c.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none';document.body.insertBefore(c,document.body.firstChild);
var x=c.getContext('2d'),W=0,H=0,dpr=Math.min(devicePixelRatio||1,1.5),pts=[],st=[],red=matchMedia('(prefers-reduced-motion:reduce)').matches,mx=0,my=0,tx=0,ty=0,sc=0,fr=0,ft=performance.now(),cut=0;
var col=['244,191,208','244,191,208','252,232,239','184,69,107'];
function build(n){pts=[];while(pts.length<n){var px=Math.random()*2-1,py=Math.random()*2-1,bx=px-.42,by=py-.08;if(px*px+py*py>1||bx*bx+by*by<=.6084)continue;var d=Math.sqrt(px*px+py*py),t=.16*(1-d*d*.6);pts.push([px,py,(Math.random()*2-1)*t,col[Math.random()*4|0],1+Math.random()*1.1])}}
for(var k=0;k<190;k++)st.push([Math.random(),Math.random(),.4+Math.random()*1.2,Math.random()*6.28,.3+Math.random()*.7]);
function size(){W=innerWidth;H=innerHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);build(W<700?900:1900);draw(performance.now())}
function draw(t){x.clearRect(0,0,W,H);var m=W<700,s=Math.min(W,H)*(m?.3:.36),cx=W*.5,cy=H*(m?.42:.5),al=m?.42:.55;
 for(var i=0;i<st.length;i++){var q=st[i],yy=((q[1]*H-sc*.04*q[2])%H+H)%H,a=q[4]*(.45+.55*Math.sin(t*.0015+q[3]));x.fillStyle='rgba(255,255,255,'+(a*.7)+')';x.beginPath();x.arc(q[0]*W,yy,q[2],0,6.283);x.fill()}
 var g=x.createRadialGradient(cx,cy,0,cx,cy,s*1.6);g.addColorStop(0,'rgba(244,191,208,.12)');g.addColorStop(1,'rgba(244,191,208,0)');x.fillStyle=g;x.fillRect(0,0,W,H);
 var ry=(red?0:t*.00016)+sc*.0014+mx*.6,rx=-.15+my*.35,cyy=Math.cos(ry),sy=Math.sin(ry),cxx=Math.cos(rx),sx=Math.sin(rx),o=[];
 for(i=0;i<pts.length;i++){var p=pts[i],a1=p[0]*cyy+p[2]*sy,z=-p[0]*sy+p[2]*cyy,b=p[1]*cxx-z*sx,z2=p[1]*sx+z*cxx,f=3/(3+z2);o.push([cx+a1*s*f,cy-b*s*f,z2,p,f])}
 o.sort(function(u,v){return v[2]-u[2]});
 for(i=0;i<o.length;i++){var e=o[i];x.fillStyle='rgba('+e[3][3]+','+(Math.max(.12,Math.min(1,.55+(-e[2])*.45))*al)+')';x.beginPath();x.arc(e[0],e[1],e[3][4]*e[4]*(m?.9:1.15),0,6.283);x.fill()}}
function loop(t){if(!document.hidden){mx+=(tx-mx)*.05;my+=(ty-my)*.05;draw(t);fr++;if(fr==90){var d=(performance.now()-ft)/90;if(d>32&&cut<2){cut++;build(Math.max(400,pts.length>>1))}fr=0;ft=performance.now()}}requestAnimationFrame(loop)}
addEventListener('resize',size);addEventListener('scroll',function(){sc=scrollY;if(red)draw(0)},{passive:true});
addEventListener('pointermove',function(e){if(e.pointerType==='mouse'){tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5}},{passive:true});
size();if(!red)requestAnimationFrame(loop)})();
