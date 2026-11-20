const searchDialog = document.querySelector('#search-dialog');
document.querySelector('[data-search]').addEventListener('click', () => searchDialog.showModal());
searchDialog.addEventListener('click', event => {
  if (event.target !== searchDialog) return;
  const bounds = searchDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) searchDialog.close();
});


