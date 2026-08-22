(function() {
  'use strict';

  const THEME_KEY = 'score-ai-theme';
  let countdownInterval = null;

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getInitialTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }

  function initTheme() {
    applyTheme(getInitialTheme());

    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(next);
      });
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
    });
  }

  function initMobileMenu() {
    const btn = document.querySelector('[data-mobile-menu-btn]');
    const menu = document.querySelector('[data-mobile-menu]');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });

    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', e => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initCountdown() {
    const container = document.querySelector('[data-countdown]');
    if (!container) return;

    const examDate = new Date('2027-03-01T09:00:00+05:30').getTime();

    function render() {
      const now = Date.now();
      const diff = examDate - now;

      if (diff <= 0) {
        container.innerHTML = '<span class="display-1 text-urgent">EXAMS STARTED</span>';
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      container.innerHTML = `
        <div class="countdown-unit"><span class="countdown-value" data-days>${String(days).padStart(3, '0')}</span><span class="countdown-label">DAYS</span></div>
        <span class="countdown-separator" aria-hidden="true">:</span>
        <div class="countdown-unit"><span class="countdown-value" data-hours>${String(hours).padStart(2, '0')}</span><span class="countdown-label">HRS</span></div>
        <span class="countdown-separator" aria-hidden="true">:</span>
        <div class="countdown-unit"><span class="countdown-value" data-minutes>${String(minutes).padStart(2, '0')}</span><span class="countdown-label">MIN</span></div>
        <span class="countdown-separator" aria-hidden="true">:</span>
        <div class="countdown-unit"><span class="countdown-value" data-seconds>${String(seconds).padStart(2, '0')}</span><span class="countdown-label">SEC</span></div>
      `;
    }

    render();
    countdownInterval = setInterval(render, 1000);
  }

  function initMCQInteractions() {
    document.querySelectorAll('.mcq-option').forEach(option => {
      option.addEventListener('click', () => {
        const card = option.closest('[data-mcq-card]');
        if (!card) return;
        card.querySelectorAll('.mcq-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        const input = option.querySelector('input');
        if (input) input.checked = true;
      });
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        const id = anchor.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function initCurrentYear() {
    document.querySelectorAll('[data-current-year]').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

  function initPriorityPills() {
    document.querySelectorAll('.priority-pill[data-score]').forEach(pill => {
      const score = parseInt(pill.dataset.score, 10);
      if (!isNaN(score)) {
        pill.style.setProperty('--fill-pct', `${Math.min(100, Math.max(0, score))}%`);
        pill.setAttribute('data-fill', '');
      }
    });
  }

  function initToast() {
    window.showToast = function(message, type = 'default') {
      let container = document.querySelector('[data-toast-container]');
      if (!container) {
        container = document.createElement('div');
        container.setAttribute('data-toast-container', '');
        container.className = 'toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `<span>${escapeHtml(message)}</span><button class="toast-close" aria-label="Close">&times;</button>`;
      toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 5000);
    };
  }

  function highlightActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const isAdmin = window.location.pathname.includes('/admin/');
    const isStudent = window.location.pathname.includes('/student/');

    document.querySelectorAll('.nav-link, .dashboard-nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      let match = false;
      if (isAdmin && href.startsWith('admin/')) {
        match = href === path;
      } else if (isStudent && href.startsWith('student/')) {
        match = href === path;
      } else if (!isAdmin && !isStudent) {
        match = href === path || (path === 'index.html' && href === 'index.html');
      }

      if (match) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileMenu();
    initCountdown();
    initMCQInteractions();
    initSmoothScroll();
    initCurrentYear();
    initPriorityPills();
    initToast();
    highlightActiveNav();
  });
})();