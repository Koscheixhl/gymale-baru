/* ==========================================================
   GYMALE LANDING PAGE — JavaScript
   - Hero Full Slider (auto-play 5s, arrows, dots, swipe, pause on hover/touch)
   - Testimoni Carousel
   - FAQ Accordion
   - WhatsApp URL Builder with UTM tracking
   - Click tracking per section & package
   ========================================================== */

(function () {
  'use strict';

  /* ---------- CONFIG ---------- */
  // Nomor WhatsApp resmi Gymale (+62 859-5520-4028)
  var WA_NUMBER = '6285955204028';
  var SLIDER_INTERVAL = 5000; // 5 detik

  /* ==========================================================
     UTILITY: WhatsApp URL Builder
     ========================================================== */
  function getUtmSource() {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get('utm_source') || params.get('src') || 'direct';
    } catch (e) {
      return 'direct';
    }
  }

  function buildWaUrl(message) {
    var encoded = encodeURIComponent(message);
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encoded;
  }

  /* ==========================================================
     CLICK TRACKING
     ========================================================== */
  var clickCounts = {};

  function trackClick(section, label) {
    var key = section + (label ? ':' + label : '');
    clickCounts[key] = (clickCounts[key] || 0) + 1;
    console.log('[Gymale Track] WA click —', key, '| total:', clickCounts[key]);
  }

  /* ==========================================================
     WHATSAPP LINKS SETUP
     Semua elemen dengan data-wa-section akan diubah href-nya
     ========================================================== */
  function setupWaLinks() {
    var source = getUtmSource();
    var links = document.querySelectorAll('[data-wa-section]');

    links.forEach(function (el) {
      var section = el.getAttribute('data-wa-section') || 'unknown';
      var msg = el.getAttribute('data-wa-message') || 'Halo Gymale, saya tertarik (dari landing page).';

      // Append source info to message if from marketing link
      if (source !== 'direct' && msg.indexOf('dari ') > -1) {
        msg = msg.replace('dari landing page', 'dari landing page, sumber: ' + source);
      }

      el.setAttribute('href', buildWaUrl(msg));
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');

      el.addEventListener('click', function () {
        trackClick(section, el.getAttribute('data-wa-message'));
      });
    });
  }

  /* ==========================================================
     SLIDER CLASS
     CSS scroll-snap based, auto-play, arrows, dots & touch pause
     ========================================================== */
  function Slider(trackEl, dotsEl, options) {
    options = options || {};
    this.track = trackEl;
    this.dotsContainer = dotsEl;
    this.slideSelector = options.slideSelector || '.slider__slide';
    this.dotClass = options.dotClass || 'slider__dot';
    this.dotActiveClass = options.dotActiveClass || 'slider__dot--active';
    this.slides = trackEl.querySelectorAll(this.slideSelector);
    this.count = this.slides.length;
    this.current = 0;
    this.interval = options.interval || SLIDER_INTERVAL;
    this.timer = null;
    this.isPaused = false;

    if (this.count <= 1) return;

    this.createDots();
    this.bindEvents(options);
    this.startAutoPlay();
  }

  Slider.prototype.createDots = function () {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = '';
    for (var i = 0; i < this.count; i++) {
      var dot = document.createElement('button');
      dot.className = this.dotClass + (i === 0 ? ' ' + this.dotActiveClass : '');
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      dot.setAttribute('data-index', i);
      this.dotsContainer.appendChild(dot);
    }
    this.dots = this.dotsContainer.querySelectorAll('.' + this.dotClass);

    var self = this;
    this.dotsContainer.addEventListener('click', function (e) {
      var dot = e.target.closest('.' + self.dotClass);
      if (!dot) return;
      var idx = parseInt(dot.getAttribute('data-index'), 10);
      self.goTo(idx);
      self.resetAutoPlay();
    });
  };

  Slider.prototype.goTo = function (index) {
    if (index < 0) index = this.count - 1;
    if (index >= this.count) index = 0;
    this.current = index;

    var targetSlide = this.slides[index];
    if (targetSlide) {
      this.track.scrollTo({ left: targetSlide.offsetLeft, behavior: 'smooth' });
    }

    this.updateDots();
  };

  Slider.prototype.updateDots = function () {
    if (!this.dots) return;
    for (var i = 0; i < this.dots.length; i++) {
      this.dots[i].classList.toggle(this.dotActiveClass, i === this.current);
    }
  };

  Slider.prototype.next = function () {
    this.goTo(this.current + 1);
  };

  Slider.prototype.prev = function () {
    this.goTo(this.current - 1);
  };

  Slider.prototype.startAutoPlay = function () {
    var self = this;
    this.timer = setInterval(function () {
      if (!self.isPaused) {
        self.next();
      }
    }, this.interval);
  };

  Slider.prototype.stopAutoPlay = function () {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  };

  Slider.prototype.resetAutoPlay = function () {
    this.stopAutoPlay();
    this.startAutoPlay();
  };

  Slider.prototype.bindEvents = function (options) {
    var self = this;

    // Optional navigation arrows
    if (options && options.prevBtn) {
      options.prevBtn.addEventListener('click', function (e) {
        e.preventDefault();
        self.prev();
        self.resetAutoPlay();
      });
    }

    if (options && options.nextBtn) {
      options.nextBtn.addEventListener('click', function (e) {
        e.preventDefault();
        self.next();
        self.resetAutoPlay();
      });
    }

    // Pause on mobile touch
    this.track.addEventListener('touchstart', function () {
      self.isPaused = true;
    }, { passive: true });

    this.track.addEventListener('touchend', function () {
      self.isPaused = false;
      setTimeout(function () {
        self.syncFromScroll();
        self.resetAutoPlay();
      }, 150);
    }, { passive: true });

    // Pause on desktop mouse hover
    this.track.addEventListener('mouseenter', function () {
      self.isPaused = true;
    });

    this.track.addEventListener('mouseleave', function () {
      self.isPaused = false;
    });

    // Sync dots on scroll
    var scrollTimeout;
    this.track.addEventListener('scroll', function () {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function () {
        self.syncFromScroll();
      }, 100);
    }, { passive: true });

    // Adjust on window resize
    window.addEventListener('resize', function () {
      self.goTo(self.current);
    });
  };

  Slider.prototype.syncFromScroll = function () {
    if (!this.slides.length) return;
    var scrollLeft = this.track.scrollLeft;
    var closestIdx = 0;
    var minDiff = Infinity;

    for (var i = 0; i < this.slides.length; i++) {
      var diff = Math.abs(this.slides[i].offsetLeft - scrollLeft);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    if (closestIdx !== this.current) {
      this.current = closestIdx;
      this.updateDots();
    }
  };

  /* ==========================================================
     FAQ ACCORDION
     ========================================================== */
  function setupFaq() {
    var faqList = document.getElementById('faqList');
    if (!faqList) return;

    faqList.addEventListener('click', function (e) {
      var btn = e.target.closest('.faq__question');
      if (!btn) return;

      var item = btn.closest('.faq__item');
      var isActive = item.classList.contains('active');

      // Close all items
      var allItems = faqList.querySelectorAll('.faq__item');
      allItems.forEach(function (el) {
        el.classList.remove('active');
        var questionBtn = el.querySelector('.faq__question');
        if (questionBtn) questionBtn.setAttribute('aria-expanded', 'false');
      });

      // Open clicked item if previously closed
      if (!isActive) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  }

  /* ==========================================================
     INIT
     ========================================================== */
  function init() {
    // Setup WhatsApp links
    setupWaLinks();

    // 1. Full Hero Slider
    var heroTrack = document.querySelector('#heroSlider .hero-slider__track');
    var heroDots = document.getElementById('heroSliderDots');
    var heroPrev = document.getElementById('heroPrevBtn');
    var heroNext = document.getElementById('heroNextBtn');
    if (heroTrack) {
      new Slider(heroTrack, heroDots, {
        slideSelector: '.hero-slider__slide',
        dotClass: 'hero-slider__dot',
        dotActiveClass: 'hero-slider__dot--active',
        prevBtn: heroPrev,
        nextBtn: heroNext,
        interval: SLIDER_INTERVAL
      });
    }

    // 2. Testimoni Slider
    var testiTrack = document.querySelector('#testimoniSlider .slider__track');
    var testiDots = document.getElementById('testimoniSliderDots');
    if (testiTrack) {
      new Slider(testiTrack, testiDots, {
        slideSelector: '.slider__slide',
        dotClass: 'slider__dot',
        dotActiveClass: 'slider__dot--active',
        interval: SLIDER_INTERVAL
      });
    }

    // 3. FAQ Accordion
    setupFaq();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
