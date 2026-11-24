/* AYMELEK Luxury Motion: no third-party services or dependencies. */
(()=>{'use strict';
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const main=document.querySelector('main');
if(!main)return;
const marquee=document.createElement('div');
marquee.className='motion-marquee';
marquee.setAttribute('aria-label','AYMELEK — Yeni sezon, özel seçkiler, stilini keşfet');
const track=document.createElement('div');track.className='motion-marquee-track';track.setAttribute('aria-hidden','true');
const phrase='✦ AYMELEK  ✦ YENİ SEZON  ✦ ÖZEL SEÇKİLER  ✦ STİLİNİ KEŞFET  ';
for(let i=0;i<4;i++){const s=document.createElement('span');s.textContent=phrase;track.append(s)}
marquee.append(track);
const hero=main.querySelector('.hero');
if(hero)hero.insertAdjacentElement('afterend',marquee);else main.prepend(marquee);
const sections=[...main.querySelectorAll('section.s, .category-section, .pv, .d3')].filter(el=>!el.closest('.home-runway'));
const cards=main.querySelectorAll('.cc');
cards.forEach(el=>el.classList.add('motion-category'));
if(!reduced.matches&&'IntersectionObserver'in window){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('motion-visible');observer.unobserve(entry.target)}}),{threshold:.08,rootMargin:'0px 0px 60px 0px'});
 sections.forEach(el=>{el.classList.add('motion-reveal');observer.observe(el)});
}else{sections.forEach(el=>el.classList.add('motion-visible'))}
reduced.addEventListener?.('change',e=>{if(e.matches)sections.forEach(el=>el.classList.add('motion-visible'))});
})();
