(function(){
function read(k){try{var v=JSON.parse(localStorage.getItem(k));return Array.isArray(v)?v:[]}catch(e){return[]}}
function counters(){
 var c=read('aymelek_cart').reduce(function(s,i){return s+(+i.qty||0)},0),w=read('aymelek_wishlist').length;
 document.querySelectorAll('[data-count=cart]').forEach(function(e){e.textContent=c;e.dataset.n=c});
 document.querySelectorAll('[data-count=wish]').forEach(function(e){e.textContent=w;e.dataset.n=w});
}
counters();window.addEventListener('storage',counters);window.AymelekCounters=counters;
var h=document.querySelector('.hdr');
function st(){h.classList.toggle('stuck',scrollY>40)}st();addEventListener('scroll',st,{passive:true});
var a=document.querySelectorAll('.ann p'),i=0;
if(a.length){a[0].classList.add('on');setInterval(function(){a[i].classList.remove('on');i=(i+1)%a.length;a[i].classList.add('on')},4000)}
var d=document.querySelector('.drawer');
function tg(o){d.classList.toggle('open',o);document.body.style.overflow=o?'hidden':''}
document.querySelector('.burger').addEventListener('click',function(){tg(true)});
d.querySelector('.bg').addEventListener('click',function(){tg(false)});
d.querySelector('.x').addEventListener('click',function(){tg(false)});
addEventListener('keydown',function(e){if(e.key==='Escape')tg(false)});
document.querySelector('.msearch').addEventListener('click',function(){var b=document.querySelector('.msb');b.classList.toggle('open');if(b.classList.contains('open'))b.querySelector('input').focus()});
})();
