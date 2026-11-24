(() => {
  const menu = document.querySelector('#collection-menu');
  const trigger = document.querySelector('.burger');
  const closeMenu = () => {
    menu.classList.remove('open');
    menu.close();
    document.body.classList.remove('collection-menu-open');
    trigger.setAttribute('aria-expanded', 'false');
  };

  trigger.addEventListener('click', () => {
    menu.showModal();
    menu.classList.add('open');
    document.body.classList.add('collection-menu-open');
    trigger.setAttribute('aria-expanded', 'true');
  });
  menu.querySelector('.x').addEventListener('click', closeMenu);
  menu.querySelector('.bg').addEventListener('click', closeMenu);
  menu.addEventListener('cancel', event => {
    event.preventDefault();
    closeMenu();
  });

  const track = document.querySelector('#collection-track');
  const controls = document.querySelector('.collection-edit-controls');
  if (!track || !controls) return;
  const [previous, next] = controls.querySelectorAll('button');

  function updateControls() {
    const end = track.scrollWidth - track.clientWidth;
    controls.hidden = end < 2;
    previous.setAttribute('aria-disabled', String(track.scrollLeft < 2));
    next.setAttribute('aria-disabled', String(track.scrollLeft >= end - 2));
  }

  controls.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.getAttribute('aria-disabled') === 'true') return;

    const [first, second] = track.children;
    const step = second.offsetLeft - first.offsetLeft;
    track.scrollBy({ left: step * Number(button.dataset.direction) });
  });
  track.addEventListener('scroll', updateControls, { passive: true });
  new ResizeObserver(updateControls).observe(track);
  updateControls();
})();
