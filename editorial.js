const searchDialog = document.querySelector('#search-dialog');
document.querySelector('[data-search]').addEventListener('click', () => searchDialog.showModal());
searchDialog.addEventListener('click', event => {
  if (event.target !== searchDialog) return;
  const bounds = searchDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) searchDialog.close();
});


const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const collectionNames = {shoes:'Ayakkabı',clothing:'Giyim',care:'Bakım',accessories:'Aksesuar',intimates:'Pijama ve İç Giyim'};

function setupDial(root, catalog) {
  const stage = root.querySelector('[data-dial-stage]');
  const title = root.querySelector('[data-dial-title]');
  const current = root.querySelector('[data-dial-current]');
  const status = root.querySelector('[data-dial-status]');
  const prev = root.querySelector('[data-dial-prev]');
  const next = root.querySelector('[data-dial-next]');
  const groups = {clothing:['clothing','dresses','tops','bottoms'], accessories:['accessories','bags']};
  let items = [];
  let position = 0;
  let frame = 0;
  let drag = null;
  let ignoreClick = false;
  const links = Array.from({length:7}, () => {
    const link = document.createElement('a');
    const photo = new Image();
    photo.alt = '';
    photo.draggable = false;
    link.className = 'dial-item';
    link.draggable = false;
    link.append(photo);
    stage.append(link);
    return link;
  });
  function render() {
    if (!items.length) return;
    const center = Math.round(position);
    const indexOf = step => ((step % items.length) + items.length) % items.length;
    const middle = items[indexOf(center)];
    const size = Math.min(links.length, items.length);
    const shift = Math.floor(size / 2);
    links.forEach((tile, i) => {
      tile.hidden = i >= size;
      if (tile.hidden) return;
      const offset = i - shift;
      const step = center + offset;
      const product = items[indexOf(step)];
      const angle = (step - position) * (2 * Math.PI / Math.max(5, size));
      const depth = (1 + Math.cos(angle)) / 2;
      const x = 50 + Math.sin(angle) * 39;
      const y = 45 + Math.cos(angle) * 24;
      tile.style.left = x + '%';
      tile.style.top = y + '%';
      tile.style.scale = String(.41 + depth * .59);
      tile.style.zIndex = String(Math.round(depth * 100));
      tile.style.opacity = String(.5 + depth * .5);
      tile.classList.toggle('is-front', offset === 0);
      if (tile.dataset.product !== product.id) {
        tile.dataset.product = product.id;
        tile.href = product.href;
        tile.setAttribute('aria-label', product.name);
        tile.firstElementChild.src = product.image;
      }
    });
    current.href = middle.href;
    if (current.textContent !== middle.name) current.textContent = middle.name;
    status.textContent = (indexOf(center) + 1) + ' / ' + items.length;
  }
  function go(destination) {
    cancelAnimationFrame(frame);
    if (reducedMotion.matches) { position = destination; render(); return; }
    const origin = position;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / 320);
      position = origin + (destination - origin) * (1 - (1 - t) ** 3);
      render();
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }
  function setCategory(category) {
    cancelAnimationFrame(frame);
    items = catalog.filter(item => (groups[category] || [category]).includes(item.category)).slice(0, links.length);
    position = 0;
    title.textContent = collectionNames[category];
    prev.disabled = next.disabled = items.length < 2;
    stage.hidden = !items.length;
    if (items.length) render();
    else {
      current.href = 'products.html?cat=' + category;
      current.textContent = 'Kataloğu aç';
      status.textContent = 'Bu koleksiyonda ürün bulunamadı.';
    }
  }
  prev.onclick = () => go(Math.round(position) - 1);
  next.onclick = () => go(Math.round(position) + 1);
  root.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight'].includes(event.key) || items.length < 2) return;
    event.preventDefault();
    go(Math.round(position) + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || items.length < 2) return;
    cancelAnimationFrame(frame);
    ignoreClick = false;
    drag = {id:event.pointerId, x:event.clientX, origin:position};
  });
  stage.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const delta = event.clientX - drag.x;
    if (!ignoreClick && Math.abs(delta) < 6) return;
    if (!ignoreClick) stage.setPointerCapture(event.pointerId);
    ignoreClick = true;
    position = drag.origin - delta / Math.max(85, stage.clientWidth * .24);
    render();
  });
  function end(event) {
    if (!drag || drag.id !== event.pointerId) return;
    drag = null;
    go(Math.round(position));
    setTimeout(() => { ignoreClick = false; }, 0);
  }
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('lostpointercapture', end);
  stage.addEventListener('click', event => {
    if (ignoreClick) event.preventDefault();
  }, true);
  setCategory(root.dataset.dial);
  return setCategory;
}

document.addEventListener('aymelek:editorial-catalog', event => {
  const section = document.querySelector('#urun-vitrinleri');
  const sets = Object.fromEntries([...section.querySelectorAll('[data-dial]')].map(root =>
    [root.dataset.dial, setupDial(root, event.detail)]));
  document.querySelectorAll('[data-collection]').forEach(link => link.addEventListener('click', click => {
    if (click.ctrlKey || click.metaKey || click.shiftKey || click.altKey) return;
    click.preventDefault();
    const category = link.dataset.collection;
    const side = category === 'shoes' ? 'shoes' : 'clothing';
    sets[side](category);
    section.querySelector('[data-dial="' + side + '"]').scrollIntoView({block:'start'});
  }));
}, {once:true});
