// ============================================================
// SCORE AI — SHARED APPLICATION SCRIPT
// Presentation & interaction refinements only.
// Original routes, content, storage keys and behavior preserved.
// ============================================================
(function () {
  'use strict';

  const THEME_KEY = 'score-ai-theme';
  const root = document.documentElement;
  let countdownInterval = null;
  let countdownRefs = null;

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ----------------------------------------------------------
  // Utilities
  // ----------------------------------------------------------
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function safeStorageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      /* Storage can be unavailable in private or embedded browsers. */
    }
  }

  function prefersReducedMotion() {
    return reducedMotionQuery.matches;
  }

  function formatNumber(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // ----------------------------------------------------------
  // Theme
  // ----------------------------------------------------------
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getInitialTheme() {
    return safeStorageGet(THEME_KEY) || getSystemTheme();
  }

  function applyTheme(theme, persist) {
    const isDark = theme === 'dark';
    root.classList.toggle('dark', isDark);

    if (persist) {
      safeStorageSet(THEME_KEY, theme);
    }

    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    });

    const themeColor = document.querySelector('meta[name="theme-color"]:not([media])');
    if (themeColor) {
      themeColor.setAttribute('content', isDark ? '#0B0B0A' : '#FAF9F6');
    }
  }

  function initTheme() {
    applyTheme(getInitialTheme(), false);

    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const next = root.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(next, true);
      });
    });

    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onSchemeChange = function (event) {
      if (!safeStorageGet(THEME_KEY)) {
        applyTheme(event.matches ? 'dark' : 'light', false);
      }
    };

    if (typeof colorSchemeQuery.addEventListener === 'function') {
      colorSchemeQuery.addEventListener('change', onSchemeChange);
    } else if (typeof colorSchemeQuery.addListener === 'function') {
      colorSchemeQuery.addListener(onSchemeChange);
    }
  }

  // ----------------------------------------------------------
  // Mobile menu
  // ----------------------------------------------------------
  function initMobileMenu() {
    const btn = document.querySelector('[data-mobile-menu-btn]');
    const menu = document.querySelector('[data-mobile-menu]');
    if (!btn || !menu) return;

    if (!menu.id) menu.id = 'mobile-navigation';
    btn.setAttribute('aria-controls', menu.id);
    menu.setAttribute('aria-hidden', 'true');

    const desktopQuery = window.matchMedia('(min-width: 768px)');

    function setMenuState(open, returnFocus) {
      menu.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');

      if (!open && returnFocus) {
        btn.focus({ preventScroll: true });
      }
    }

    btn.addEventListener('click', function () {
      setMenuState(!menu.classList.contains('open'), false);
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setMenuState(false, false);
      });
    });

    document.addEventListener('click', function (event) {
      if (!menu.classList.contains('open')) return;
      if (btn.contains(event.target) || menu.contains(event.target)) return;
      setMenuState(false, false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.classList.contains('open')) {
        setMenuState(false, true);
      }
    });

    const onDesktopChange = function (event) {
      if (event.matches) setMenuState(false, false);
    };

    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', onDesktopChange);
    } else if (typeof desktopQuery.addListener === 'function') {
      desktopQuery.addListener(onDesktopChange);
    }
  }

  // ----------------------------------------------------------
  // Countdown
  // ----------------------------------------------------------
  function initCountdown() {
    const container = document.querySelector('[data-countdown]');
    if (!container) return;

    const examDate = new Date('2027-02-17T09:00:00+05:30').getTime();

    container.setAttribute('role', 'timer');
    container.removeAttribute('aria-live');

    const units = [
      { key: 'days', label: 'DAYS', pad: 3 },
      { key: 'hours', label: 'HRS', pad: 2 },
      { key: 'minutes', label: 'MIN', pad: 2 },
      { key: 'seconds', label: 'SEC', pad: 2 }
    ];

    let markup = '';
    units.forEach(function (unit, index) {
      if (index > 0) {
        markup += '<span class="countdown-separator" aria-hidden="true">:</span>';
      }
      markup +=
        '<div class="countdown-unit">' +
        '<span class="countdown-value" data-' + unit.key + '>' +
        String(0).padStart(unit.pad, '0') +
        '</span>' +
        '<span class="countdown-label">' + unit.label + '</span>' +
        '</div>';
    });

    container.innerHTML = markup;

    countdownRefs = {
      days: container.querySelector('[data-days]'),
      hours: container.querySelector('[data-hours]'),
      minutes: container.querySelector('[data-minutes]'),
      seconds: container.querySelector('[data-seconds]')
    };

    function stopTimer() {
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    }

    function render() {
      const diff = examDate - Date.now();

      if (diff <= 0) {
        container.innerHTML = '<span class="display-1 text-urgent">EXAMS STARTED</span>';
        stopTimer();
        countdownRefs = null;
        return;
      }

      const values = {
        days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(3, '0'),
        hours: String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0'),
        minutes: String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0'),
        seconds: String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0')
      };

      Object.keys(values).forEach(function (key) {
        if (countdownRefs && countdownRefs[key] && countdownRefs[key].textContent !== values[key]) {
          countdownRefs[key].textContent = values[key];
        }
      });
    }

    function startTimer() {
      stopTimer();
      render();
      if (examDate - Date.now() > 0) {
        countdownInterval = setInterval(render, 1000);
      }
    }

    startTimer();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    });
  }

  // ----------------------------------------------------------
  // MCQ interactions
  // ----------------------------------------------------------
  function selectMcqOption(option) {
    const card = option.closest('[data-mcq-card]');
    if (!card) return;

    card.querySelectorAll('.mcq-option').forEach(function (item) {
      item.classList.remove('selected');
    });
    option.classList.add('selected');

    const input = option.querySelector('input');
    if (input) input.checked = true;
  }

  function initMCQInteractions() {
    document.querySelectorAll('.mcq-option').forEach(function (option) {
      option.addEventListener('click', function () {
        selectMcqOption(option);
      });
    });

    document.querySelectorAll('.mcq-option input[type="radio"]').forEach(function (input) {
      input.addEventListener('change', function () {
        const option = input.closest('.mcq-option');
        if (option) selectMcqOption(option);
      });
    });
  }

  // ----------------------------------------------------------
  // Smooth scroll
  // ----------------------------------------------------------
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (event) {
        const hash = anchor.getAttribute('href');
        if (!hash || hash === '#') return;

        let target = null;
        try {
          target = document.querySelector(hash);
        } catch (error) {
          return;
        }

        if (target) {
          event.preventDefault();
          target.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // ----------------------------------------------------------
  // Footer year
  // ----------------------------------------------------------
  function initCurrentYear() {
    document.querySelectorAll('[data-current-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  // ----------------------------------------------------------
  // Priority pill meter
  // ----------------------------------------------------------
  function initPriorityPills() {
    document.querySelectorAll('.priority-pill[data-score]').forEach(function (pill) {
      const score = parseInt(pill.dataset.score, 10);
      if (!Number.isFinite(score)) return;

      const clamped = Math.min(100, Math.max(0, score));
      pill.style.setProperty('--fill-pct', clamped + '%');
      pill.style.setProperty('--fill-ratio', String(clamped / 100));
      pill.setAttribute('data-fill', '');
    });
  }

  // ----------------------------------------------------------
  // Toast
  // ----------------------------------------------------------
  function initToast() {
    window.showToast = function (message, type) {
      let container = document.querySelector('[data-toast-container]');
      if (!container) {
        container = document.createElement('div');
        container.setAttribute('data-toast-container', '');
        container.className = 'toast-container';
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', 'Notifications');
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      if (type) toast.setAttribute('data-toast-type', type);
      toast.innerHTML =
        '<span>' + escapeHtml(message) + '</span>' +
        '<button class="toast-close" type="button" aria-label="Close">&times;</button>';

      toast.querySelector('.toast-close').addEventListener('click', function () {
        toast.remove();
      });

      container.appendChild(toast);
      window.setTimeout(function () {
        toast.remove();
      }, 5000);
    };
  }

  // ----------------------------------------------------------
  // Accurate active navigation (desktop + mobile + dashboards)
  // ----------------------------------------------------------
  function normalizePath(path) {
    let normalized = path;
    if (normalized.endsWith('/')) normalized += 'index.html';
    return normalized;
  }

  function highlightActiveNav() {
    const currentPath = normalizePath(window.location.pathname);

    document.querySelectorAll('.nav-link, .dashboard-nav-link').forEach(function (link) {
      const href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;

      let targetPath = '';
      try {
        targetPath = normalizePath(new URL(href, window.location.href).pathname);
      } catch (error) {
        return;
      }

      link.removeAttribute('aria-current');
      if (targetPath === currentPath) {
        link.setAttribute('aria-current', 'page');
      }
    });

    // On compact screens the dashboard nav scrolls horizontally. Keep the
    // current page visible without moving the document.
    const activeLink = document.querySelector('.dashboard-nav-link[aria-current="page"]');
    const nav = activeLink ? activeLink.closest('.dashboard-nav') : null;
    if (!nav) return;

    function updateNavFade() {
      nav.toggleAttribute('data-scrolled-start', nav.scrollLeft > 4);
    }

    function centerActiveLink() {
      if (nav.scrollWidth - nav.clientWidth >= 4) {
        const linkRect = activeLink.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        const target =
          nav.scrollLeft +
          (linkRect.left - navRect.left) -
          (navRect.width - linkRect.width) / 2;
        nav.scrollLeft = Math.max(0, Math.min(nav.scrollWidth - nav.clientWidth, target));
      }
      updateNavFade();
    }

    nav.addEventListener('scroll', updateNavFade, { passive: true });
    window.requestAnimationFrame(centerActiveLink);
    window.addEventListener('resize', centerActiveLink, { passive: true });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(centerActiveLink).catch(function () {});
    }
  }

  // ----------------------------------------------------------
  // Accessibility helpers
  // ----------------------------------------------------------
  function initAccessibilityHelpers() {
    const main = document.querySelector('main');
    if (main) {
      if (!main.id) main.id = 'main-content';

      if (!document.querySelector('.skip-link')) {
        const skipLink = document.createElement('a');
        skipLink.className = 'skip-link';
        skipLink.href = '#' + main.id;
        skipLink.textContent = 'Skip to content';
        skipLink.addEventListener('click', function (event) {
          event.preventDefault();
          main.setAttribute('tabindex', '-1');
          main.focus({ preventScroll: true });
          main.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'start'
          });
        });
        document.body.insertBefore(skipLink, document.body.firstChild);
      }
    }

    document.querySelectorAll('.table-wrap').forEach(function (wrap) {
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('role', 'region');

      if (!wrap.getAttribute('aria-label')) {
        const card = wrap.closest('.card');
        const cardTitle = card ? card.querySelector('.card-title, h1, h2, h3') : null;
        let label = cardTitle ? cardTitle.textContent.trim() : '';
        if (!label) {
          const pageTitle = document.querySelector('main h1');
          label = pageTitle ? pageTitle.textContent.trim() : '';
        }
        wrap.setAttribute('aria-label', label ? 'Table: ' + label : 'Scrollable data table');
      }
    });

    // Soft edge fade hint while a table can still scroll horizontally.
    function updateTableHints() {
      document.querySelectorAll('.table-wrap').forEach(function (wrap) {
        const scrollable = wrap.scrollWidth - wrap.clientWidth > 2;
        if (!scrollable) {
          wrap.removeAttribute('data-scrollable');
          wrap.removeAttribute('data-scroll-end');
          return;
        }
        wrap.setAttribute('data-scrollable', 'true');
        const atEnd = wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 2;
        if (atEnd) {
          wrap.setAttribute('data-scroll-end', 'true');
        } else {
          wrap.removeAttribute('data-scroll-end');
        }
      });
    }

    updateTableHints();
    window.addEventListener('resize', updateTableHints, { passive: true });
    document.addEventListener(
      'scroll',
      function (event) {
        if (event.target instanceof Element && event.target.matches('.table-wrap')) {
          updateTableHints();
        }
      },
      true
    );

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateTableHints).catch(function () {});
    }
  }

  // ----------------------------------------------------------
  // Motion system
  // ----------------------------------------------------------
  function splitHeading(heading) {
    if (heading.dataset.splitHeading === 'true') return;

    const text = heading.textContent.trim();
    if (!text) return;

    const words = text.split(/\s+/);
    const fragment = document.createDocumentFragment();

    words.forEach(function (word, index) {
      if (index > 0) fragment.appendChild(document.createTextNode(' '));

      const outer = document.createElement('span');
      outer.className = 'word';

      const inner = document.createElement('span');
      inner.className = 'word-inner';
      inner.textContent = word;
      inner.style.setProperty('--word-index', String(index));

      outer.appendChild(inner);
      fragment.appendChild(outer);
    });

    heading.textContent = '';
    heading.appendChild(fragment);
    heading.classList.add('reveal-heading', 'is-split');
    heading.dataset.splitHeading = 'true';
  }

  function initMotion() {
    const revealTargets = [];
    const staggerGroups = [];

    // Word reveals for every display heading.
    document.querySelectorAll('h1.display-2, h1.display-4').forEach(function (heading) {
      splitHeading(heading);
      revealTargets.push({ el: heading, type: 'heading' });
    });

    // Section headers — page headers containing an h1 keep their own heading reveal.
    document.querySelectorAll('.section-header').forEach(function (header) {
      if (header.querySelector('h1')) {
        header.classList.add('is-visible');
        return;
      }
      header.classList.add('reveal');
      header.style.setProperty('--reveal-y', '16px');
      revealTargets.push({ el: header, type: 'reveal' });
    });

    // Hero sequence.
    const hero = document.querySelector('.section-hero .hero');
    if (hero) {
      hero.classList.add('is-visible');

      ['.section-eyebrow', '.countdown-hero', '.section-lead', '.hero-actions'].forEach(function (selector) {
        const el = hero.querySelector(selector);
        if (!el) return;
        el.classList.add('reveal-soft');
        revealTargets.push({ el: el, type: 'reveal-soft' });
      });
    }

    // Stagger card grids.
    document.querySelectorAll('.card-grid, .dashboard-grid').forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, index) {
        child.classList.add('stagger-child');
        child.style.setProperty('--stagger-delay', Math.min(index, 6) * 65 + 'ms');
        staggerGroups.push(child);
      });
    });

    // Stat cards.
    document.querySelectorAll('.stat-grid > *').forEach(function (card, index) {
      card.style.setProperty('--stat-delay', Math.min(index, 6) * 70 + 'ms');
      staggerGroups.push(card);
    });

    // Standalone cards (outside grids) get a simple reveal.
    document.querySelectorAll('.site-main .card, .dashboard-main .card').forEach(function (card) {
      if (card.classList.contains('stagger-child') || card.classList.contains('stat-card')) return;
      if (card.closest('.card-grid, .dashboard-grid, .stat-grid')) return;
      card.classList.add('reveal');
      revealTargets.push({ el: card, type: 'reveal' });
    });

    // Table rows.
    document.querySelectorAll('.table tbody').forEach(function (tbody) {
      Array.prototype.forEach.call(tbody.rows, function (row, index) {
        row.classList.add('row-reveal');
        row.style.setProperty('--row-delay', Math.min(index, 8) * 40 + 'ms');
        revealTargets.push({ el: row, type: 'row-reveal' });
      });
    });

    // Activity rows.
    document.querySelectorAll('.activity-list').forEach(function (list) {
      Array.prototype.forEach.call(list.children, function (item, index) {
        item.classList.add('row-reveal');
        item.style.setProperty('--row-delay', Math.min(index, 8) * 45 + 'ms');
        revealTargets.push({ el: item, type: 'row-reveal' });
      });
    });

    // Reduced motion: leave everything visible and static.
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      revealTargets.forEach(function (target) {
        target.el.classList.add('is-visible');
      });
      staggerGroups.forEach(function (el) {
        el.classList.add('is-visible');
      });
      initProgressBars(true);
      initCounters(true);
      return;
    }

    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -7% 0px', threshold: 0.01 }
    );

    revealTargets.forEach(function (target) {
      revealObserver.observe(target.el);
    });

    staggerGroups.forEach(function (el) {
      revealObserver.observe(el);
    });

    // Safety: never leave content hidden if the observer fails to fire.
    window.setTimeout(function () {
      document.querySelectorAll('.reveal, .reveal-soft, .stagger-child, .row-reveal, .stat-card, .reveal-heading').forEach(function (el) {
        if (!el.classList.contains('is-visible')) el.classList.add('is-visible');
      });
    }, 2600);

    initProgressBars(false);
    initCounters(false);
    initWeekChart();
  }

  function initProgressBars(immediate) {
    document.querySelectorAll('.progress-bar').forEach(function (bar) {
      const fill = bar.querySelector('.progress-bar-fill');
      if (!fill) return;

      if (immediate || prefersReducedMotion() || !('IntersectionObserver' in window)) {
        fill.classList.remove('progress-armed');
        fill.classList.add('is-visible');
        return;
      }

      fill.classList.add('progress-armed');

      const observer = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            fill.classList.add('is-visible');
            obs.unobserve(entry.target);
          });
        },
        { threshold: 0.2 }
      );

      observer.observe(bar);
    });
  }

  function initCounters(immediate) {
    if (prefersReducedMotion()) return;

    document.querySelectorAll('.stat-value').forEach(function (el) {
      if (el.dataset.counterReady === 'true') return;

      const original = el.textContent.trim();
      const match = /^([0-9][0-9,]*)(.*)$/.exec(original);
      if (!match) return;

      const target = parseInt(match[1].replace(/,/g, ''), 10);
      if (!Number.isFinite(target)) return;

      const suffix = match[2];
      el.dataset.counterReady = 'true';

      function finish() {
        el.textContent = original;
      }

      if (immediate || !('IntersectionObserver' in window)) {
        finish();
        return;
      }

      function animate() {
        const duration = 850;
        const start = performance.now();

        function frame(now) {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = Math.round(target * eased);
          el.textContent = formatNumber(value) + suffix;

          if (progress < 1) {
            requestAnimationFrame(frame);
          } else {
            finish();
          }
        }

        requestAnimationFrame(frame);
      }

      const observer = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            animate();
            obs.unobserve(entry.target);
          });
        },
        { threshold: 0.35 }
      );

      observer.observe(el);
    });
  }

  function initWeekChart() {
    const chart = document.querySelector('.week-chart');
    if (!chart || prefersReducedMotion() || !('IntersectionObserver' in window)) {
      if (chart) chart.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          chart.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(chart);
  }

  // ----------------------------------------------------------
  // Scroll state + top progress line
  // ----------------------------------------------------------
  function initScrollState() {
    const headers = document.querySelectorAll('.site-header, .dashboard-header');
    let ticking = false;

    function update() {
      ticking = false;
      const scrollTop = window.scrollY || window.pageYOffset || 0;

      headers.forEach(function (header) {
        header.classList.toggle('is-scrolled', scrollTop > 6);
      });

      const maxScroll = root.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;
      root.style.setProperty('--scroll-progress', progress.toFixed(4));
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    window.addEventListener('load', requestUpdate);
    update();
  }

  // ----------------------------------------------------------
  // Boot
  // ----------------------------------------------------------
  function init() {
    initTheme();
    initMobileMenu();
    initCountdown();
    initMCQInteractions();
    initSmoothScroll();
    initCurrentYear();
    initPriorityPills();
    initToast();
    highlightActiveNav();
    initAccessibilityHelpers();
    initMotion();
    initScrollState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
