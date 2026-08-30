(function () {
  'use strict';

  function createButton(className, label, icon) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'desktop-carousel-arrow ' + className;
    button.setAttribute('aria-label', label);
    button.innerHTML = '<i class="fas ' + icon + '" aria-hidden="true"></i>';
    return button;
  }

  function createControls(label) {
    var controls = document.createElement('div');
    controls.className = 'desktop-carousel-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', label);

    var previous = createButton('desktop-carousel-prev', 'Anterior', 'fa-arrow-left');
    var dots = document.createElement('div');
    dots.className = 'desktop-carousel-dots';
    dots.setAttribute('role', 'tablist');
    dots.setAttribute('aria-label', label);
    var next = createButton('desktop-carousel-next', 'Seguinte', 'fa-arrow-right');

    controls.appendChild(previous);
    controls.appendChild(dots);
    controls.appendChild(next);

    var progress = document.createElement('div');
    progress.className = 'desktop-carousel-progress';
    progress.setAttribute('aria-hidden', 'true');
    progress.innerHTML = '<span></span>';

    return { controls: controls, previous: previous, dots: dots, next: next, progress: progress };
  }

  function commentsCarousel() {
    var grid = document.querySelector('#us_post_list_y2f6');
    if (!grid || grid.dataset.desktopCarouselReady === 'true') return;

    var viewport = grid.querySelector('.w-grid-list');
    if (!viewport) return;

    var cards = Array.prototype.slice.call(viewport.children).filter(function (item) {
      return item.classList.contains('w-grid-item');
    });
    if (!cards.length) return;

    grid.dataset.desktopCarouselReady = 'true';
    grid.classList.add('desktop-comments-carousel');
    viewport.classList.add('desktop-comments-viewport');
    viewport.style.height = 'auto';
    cards.forEach(function (card) {
      card.style.position = 'relative';
      card.style.left = 'auto';
      card.style.top = 'auto';
      card.style.transform = 'none';
      card.style.height = 'auto';
      var cardBody = card.querySelector('.w-grid-item-h');
      if (cardBody) cardBody.style.height = 'auto';
    });
    viewport.setAttribute('tabindex', '0');
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', 'Depoimentos de clientes');

    var ui = createControls('Navegação dos depoimentos');
    viewport.insertAdjacentElement('afterend', ui.controls);
    ui.controls.insertAdjacentElement('afterend', ui.progress);

    var starts = [];
    var positions = [];
    var active = 0;
    var resizeTimer;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function cardsPerPage() {
      return window.innerWidth <= 1199 ? 2 : 3;
    }

    function buildPages() {
      var size = cardsPerPage();
      starts = [];
      for (var i = 0; i < cards.length; i += size) starts.push(i);

      positions = starts.map(function (cardIndex) {
        return Math.max(0, Math.min(cards[cardIndex].offsetLeft - cards[0].offsetLeft, viewport.scrollWidth - viewport.clientWidth));
      });

      ui.dots.innerHTML = '';
      starts.forEach(function (_, pageIndex) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Ver página ' + (pageIndex + 1) + ' de ' + starts.length);
        dot.addEventListener('click', function () { go(pageIndex); });
        ui.dots.appendChild(dot);
      });

      ui.progress.firstElementChild.style.width = (100 / starts.length) + '%';
      active = Math.min(active, starts.length - 1);
      update(active);
    }

    function update(pageIndex) {
      active = Math.max(0, Math.min(starts.length - 1, pageIndex));
      Array.prototype.forEach.call(ui.dots.children, function (dot, index) {
        var selected = index === active;
        dot.classList.toggle('is-active', selected);
        dot.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
      ui.previous.disabled = active === 0;
      ui.next.disabled = active === starts.length - 1;
      ui.progress.firstElementChild.style.transform = 'translateX(' + (active * 100) + '%)';
    }

    function go(pageIndex, animate) {
      if (!starts.length) return;
      positions = starts.map(function (cardIndex) {
        return Math.max(0, Math.min(cards[cardIndex].offsetLeft - cards[0].offsetLeft, Math.max(0, viewport.scrollWidth - viewport.clientWidth)));
      });
      var target = Math.max(0, Math.min(starts.length - 1, pageIndex));
      if (animate === false || reducedMotion) {
        viewport.style.scrollBehavior = 'auto';
        viewport.scrollLeft = positions[target];
        viewport.style.scrollBehavior = '';
      } else {
        viewport.scrollLeft = positions[target];
      }
      update(target);
    }

    ui.previous.addEventListener('click', function () { go(active - 1); });
    ui.next.addEventListener('click', function () { go(active + 1); });
    viewport.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') { event.preventDefault(); go(active + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); go(active - 1); }
    });

    var ticking = false;
    viewport.addEventListener('scroll', function () {
      if (ticking) return;
      window.requestAnimationFrame(function () {
        var nearest = 0;
        var distance = Infinity;
        positions.forEach(function (position, index) {
          var current = Math.abs(viewport.scrollLeft - position);
          if (current < distance) { distance = current; nearest = index; }
        });
        update(nearest);
        ticking = false;
      });
      ticking = true;
    }, { passive: true });

    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        buildPages();
        go(active, false);
      }, 120);
    });

    buildPages();
    go(0, false);
  }

  function ecosystemCarousel() {
    var grid = document.querySelector('#us_post_list_hefb');
    if (!grid || grid.dataset.desktopControlsReady === 'true') return;

    var viewport = grid.querySelector('.w-grid-list');
    var owlDots = viewport && viewport.querySelector('.owl-dots');
    var owlNav = viewport && viewport.querySelector('.owl-nav');
    if (!viewport || !owlDots || !owlNav) return;

    var originalDots = Array.prototype.slice.call(owlDots.querySelectorAll('.owl-dot'));
    var originalPrev = owlNav.querySelector('.owl-prev');
    var originalNext = owlNav.querySelector('.owl-next');
    if (!originalDots.length || !originalPrev || !originalNext) return;

    grid.dataset.desktopControlsReady = 'true';
    var ui = createControls('Navegação das ferramentas');
    viewport.insertAdjacentElement('afterend', ui.controls);
    ui.controls.insertAdjacentElement('afterend', ui.progress);

    originalDots.forEach(function (_, index) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Ver página ' + (index + 1) + ' de ' + originalDots.length);
      dot.addEventListener('click', function () { originalDots[index].click(); });
      ui.dots.appendChild(dot);
    });

    ui.progress.firstElementChild.style.width = (100 / originalDots.length) + '%';
    ui.previous.addEventListener('click', function () { originalPrev.click(); });
    ui.next.addEventListener('click', function () { originalNext.click(); });

    function sync() {
      var active = originalDots.findIndex(function (dot) { return dot.classList.contains('active'); });
      if (active < 0) active = 0;
      Array.prototype.forEach.call(ui.dots.children, function (dot, index) {
        var selected = index === active;
        dot.classList.toggle('is-active', selected);
        dot.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
      ui.previous.disabled = originalPrev.classList.contains('disabled');
      ui.next.disabled = originalNext.classList.contains('disabled');
      ui.progress.firstElementChild.style.transform = 'translateX(' + (active * 100) + '%)';
    }

    var observer = new MutationObserver(sync);
    originalDots.forEach(function (dot) { observer.observe(dot, { attributes: true, attributeFilter: ['class'] }); });
    observer.observe(originalPrev, { attributes: true, attributeFilter: ['class'] });
    observer.observe(originalNext, { attributes: true, attributeFilter: ['class'] });
    sync();
  }

  function init() {
    if (!window.matchMedia('(min-width: 1025px)').matches) return;
    commentsCarousel();
    ecosystemCarousel();
    if (!document.querySelector('#us_post_list_hefb[data-desktop-controls-ready="true"]')) {
      window.setTimeout(ecosystemCarousel, 120);
    }
  }

  function initAfterLayout() {
    /* The theme lays out its isotope/Owl widgets after DOMContentLoaded. */
    window.setTimeout(init, 350);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAfterLayout);
  else initAfterLayout();
}());
