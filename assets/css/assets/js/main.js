/* ============================================================
   AYMELEK — Header & Hero interactivity
   Sticky header, mobil drawer, arama, sepet/istek listesi badge API
   ============================================================ */
(function () {
  'use strict';

  var header    = document.getElementById('siteHeader');
  var navToggle = document.getElementById('navToggle');
  var scrim     = document.getElementById('navScrim');
  var searchBtn = document.getElementById('searchToggle');
  var searchInp = document.getElementById('searchInput');

  /* --- Sticky header gölgesi --- */
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- Mobil menü drawer --- */
  function setNav(open) {
    document.body.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    scrim.hidden = !open;
  }
  navToggle.addEventListener('click', function () {
    setNav(!document.body.classList.contains('nav-open'));
  });
  scrim.addEventListener('click', function () { setNav(false); });

  /* --- Arama çekmecesi --- */
  function setSearch(open) {
    header.classList.toggle('search-open', open);
    searchBtn.setAttribute('aria-expanded', String(open));
    if (open && searchInp) searchInp.focus();
  }
  searchBtn.addEventListener('click', function () {
    setSearch(!header.classList.contains('search-open'));
  });
  var searchForm = document.querySelector('.search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault(); // mevcut arama entegrasyonunuza bağlayın
      console.info('[AYMELEK] search:', searchInp.value);
    });
  }

  /* --- Esc ile kapat --- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setNav(false); setSearch(false); }
  });

  /* --- Sepet / istek listesi badge API (global) --- */
  function setCount(kind, n) {
    var el = document.querySelector('[data-badge="' + kind + '"]');
    if (!el) return;
    el.textContent = String(n);
    el.hidden = n <= 0;
    try { localStorage.setItem('aymelik_' + kind + '_count', String(n)); } catch (e) {}
  }
  window.AYMELEK = {
    setCartCount:     function (n) { setCount('cart', n); },
    setWishlistCount: function (n) { setCount('wishlist', n); }
  };
  try {
    setCount('cart',     parseInt(localStorage.getItem('aymelik_cart_count')     || '0', 10));
    setCount('wishlist', parseInt(localStorage.getItem('aymelik_wishlist_count') || '0', 10));
  } catch (e) {}

  /* --- Hero giriş animasyonu tetikleyici --- */
  window.addEventListener('DOMContentLoaded', function () {
    requestAnimationFrame(function () {
      document.body.classList.add('is-loaded');
    });
  });

  /* --- Footer yılı --- */
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = String(new Date().getFullYear());
})();
