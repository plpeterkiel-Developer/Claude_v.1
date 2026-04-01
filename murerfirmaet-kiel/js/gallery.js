(function () {
  'use strict';

  var grid = document.getElementById('gallery-grid');
  if (!grid) return;

  var filterBtns = document.querySelectorAll('.filter-btn');
  var items = grid.querySelectorAll('.gallery-item');

  // --- Category filter ---
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');

      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      items.forEach(function (item) {
        if (filter === 'all' || item.getAttribute('data-category') === filter) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });

  // --- Lightbox ---
  var lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.id = 'lightbox';
  lightbox.innerHTML =
    '<button class="lightbox-close" aria-label="Luk">&times;</button>' +
    '<button class="lightbox-prev" aria-label="Forrige">&#8249;</button>' +
    '<img src="" alt="">' +
    '<button class="lightbox-next" aria-label="Næste">&#8250;</button>';
  document.body.appendChild(lightbox);

  var lbImg = lightbox.querySelector('img');
  var lbClose = lightbox.querySelector('.lightbox-close');
  var lbPrev = lightbox.querySelector('.lightbox-prev');
  var lbNext = lightbox.querySelector('.lightbox-next');
  var currentIndex = 0;

  function getVisibleItems() {
    return Array.from(items).filter(function (item) {
      return !item.classList.contains('hidden');
    });
  }

  function openLightbox(index) {
    var visible = getVisibleItems();
    if (index < 0 || index >= visible.length) return;
    currentIndex = index;
    var img = visible[index].querySelector('img');
    var fullSrc = img.getAttribute('data-full') || img.src;
    lbImg.src = fullSrc;
    lbImg.alt = img.alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  function navigate(dir) {
    var visible = getVisibleItems();
    currentIndex = (currentIndex + dir + visible.length) % visible.length;
    var img = visible[currentIndex].querySelector('img');
    var fullSrc = img.getAttribute('data-full') || img.src;
    lbImg.src = fullSrc;
    lbImg.alt = img.alt;
  }

  // Click on gallery item to open
  items.forEach(function (item) {
    item.addEventListener('click', function () {
      var visible = getVisibleItems();
      var idx = visible.indexOf(item);
      if (idx !== -1) openLightbox(idx);
    });
  });

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', function () { navigate(-1); });
  lbNext.addEventListener('click', function () { navigate(1); });

  // Close on backdrop click
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard controls
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  // Basic swipe support
  var touchStartX = 0;
  lightbox.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', function (e) {
    var diff = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(diff) > 50) {
      navigate(diff > 0 ? -1 : 1);
    }
  }, { passive: true });
})();
