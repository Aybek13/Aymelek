const searchDialog = document.querySelector('#search-dialog');
document.querySelector('[data-search]').addEventListener('click', () => searchDialog.showModal());
searchDialog.addEventListener('click', event => {
  if (event.target !== searchDialog) return;
  const bounds = searchDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) searchDialog.close();
});

const strip = document.querySelector('#shoe-strip');
const prev = document.querySelector('[data-shoe-prev]');
const next = document.querySelector('[data-shoe-next]');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
function moveShoes(direction) {
  const first = strip.children[0].getBoundingClientRect().left;
  const second = strip.children[1].getBoundingClientRect().left;
  strip.scrollBy({left: (second - first) * direction, behavior: motionPreference.matches ? 'instant' : 'smooth'});
}
function syncGalleryControls() {
  prev.disabled = strip.scrollLeft < 2;
  next.disabled = strip.scrollWidth - strip.clientWidth - strip.scrollLeft < 2;
}
prev.addEventListener('click', () => moveShoes(-1));
next.addEventListener('click', () => moveShoes(1));
strip.addEventListener('scroll', syncGalleryControls, {passive: true});
new ResizeObserver(syncGalleryControls).observe(strip);

const campaign = document.querySelector('.campaign');
const orbit = campaign.querySelector('.orbit-mark');
campaign.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || motionPreference.matches) return;
  const {left, top, width, height} = campaign.getBoundingClientRect();
  orbit.style.setProperty('--drift-x', ((event.clientX - left) / width - .5) * 26 + 'px');
  orbit.style.setProperty('--drift-y', ((event.clientY - top) / height - .5) * 20 + 'px');
}, {passive: true});
campaign.addEventListener('pointerleave', () => {
  orbit.style.removeProperty('--drift-x');
  orbit.style.removeProperty('--drift-y');
});
