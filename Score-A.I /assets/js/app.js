// ============================================================
//  SCORE.AI — MASTER APPLICATION JAVASCRIPT
//  Includes: theme, mobile menu, countdown, MCQ, smooth scroll,
//  current year, priority pills, toast, nav highlight, scroll reveal,
//  table stagger, progress, stat entrance, number counters,
//  stagger grid, bookmarks, Codi chat, keyboard nav, hero sequence,
//  English/Hinglish language system, versioned policy gate,
//  frontend login session and access guard.
//  ============================================================

(function() {
  'use strict';

  // ---------- CONSTANTS ----------
  const THEME_KEY = 'score-ai-theme';
  const LANG_KEY = 'score-ai-language';
  const POLICY_KEY = 'score-ai-student-policy';
  const SESSION_KEY = 'score-ai-student-session';
  const CURRENT_POLICY_VERSION = '1.0';

  let countdownInterval = null;

  // ---------- UTILITY ----------
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ---------- ORIGINAL FUNCTIONS (preserved) ----------
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

  // ---------- PHASE 2 / INTERACTION SYSTEMS ----------
  function observeElements(selector, className, options = {}) {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(className);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px', ...options });
      elements.forEach(el => observer.observe(el));
    } else {
      elements.forEach(el => el.classList.add(className));
    }
  }

  function initScrollReveal() {
    observeElements('[data-reveal]', 'is-visible');
  }

  function initTableStagger() {
    observeElements('[data-table-stagger]', 'is-visible', { threshold: 0.1 });
  }

  function initProgressBar() {
    const containers = document.querySelectorAll('[data-progress-animate]');
    if (!containers.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const container = entry.target;
          const fill = container.querySelector('.progress-bar-fill');
          if (fill) {
            const target = container.dataset.target || fill.style.width || '0%';
            container.style.setProperty('--target-width', target);
            container.classList.add('is-animated');
          }
          observer.unobserve(container);
        }
      });
    }, { threshold: 0.1 });
    containers.forEach(el => observer.observe(el));
  }

  function initStatEntrance() {
    observeElements('[data-stat-entrance]', 'is-visible', { threshold: 0.1 });
  }

  function initNumberCounter() {
    const elements = document.querySelectorAll('[data-counter]');
    if (!elements.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.textContent, 10) || 0;
          let current = 0;
          const step = Math.max(1, Math.floor(target / 40));
          const interval = setInterval(() => {
            current += step;
            if (current >= target) {
              el.textContent = target;
              clearInterval(interval);
            } else {
              el.textContent = current;
            }
          }, 30);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    elements.forEach(el => observer.observe(el));
  }

  function initStaggerGrid() {
    const containers = document.querySelectorAll('[data-stagger]');
    if (!containers.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const container = entry.target;
          const children = container.children;
          Array.from(children).forEach((child, index) => {
            child.style.transitionDelay = (index * 60) + 'ms';
            child.classList.add('is-visible');
          });
          observer.unobserve(container);
        }
      });
    }, { threshold: 0.1 });
    containers.forEach(el => observer.observe(el));
  }

  function initBookmarkToggle() {
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.bookmark-btn');
      if (btn) {
        e.preventDefault();
        btn.classList.toggle('is-bookmarked');
        const isBookmarked = btn.classList.contains('is-bookmarked');
        const msgKey = isBookmarked ? 'bookmarks.added' : 'bookmarks.removed';
        const msg = translations[getCurrentLanguage()][msgKey] || (isBookmarked ? 'Bookmarked' : 'Removed bookmark');
        if (window.showToast) showToast(msg);
      }
    });
  }

  function initChatForm() {
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const messages = document.getElementById('chat-messages');
    if (!form || !input || !messages) return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const message = input.value.trim();
      if (!message) return;
                          // User message
                          const userMsg = document.createElement('div');
      userMsg.className = 'chat-message chat-message-user';
      userMsg.innerHTML = `
      <div class="chat-bubble" style="background: var(--blueprint); color: var(--paper);">
      <p class="text-sm">${escapeHtml(message)}</p>
      </div>
      <p class="chat-timestamp">Just now</p>
      `;
      messages.appendChild(userMsg);
      input.value = '';
      messages.scrollTop = messages.scrollHeight;
      // AI mock response
      setTimeout(() => {
        const aiMsg = document.createElement('div');
        aiMsg.className = 'chat-message chat-message-ai';
        aiMsg.innerHTML = `
        <div class="chat-avatar">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        </div>
        <div class="chat-bubble">
        <p class="text-sm text-ink">I'm here to help! I'm still learning, but I can assist with study questions. Try asking about a specific topic.</p>
        </div>
        `;
        messages.appendChild(aiMsg);
        messages.scrollTop = messages.scrollHeight;
      }, 600);
    });
  }

  function initKeyboardNav() {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') document.body.classList.add('keyboard-navigation');
    });
      document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
      });
  }

  function initHeroSequence() {
    const seq = document.querySelector('.hero-sequence');
    if (!seq) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          seq.classList.add('is-visible');
          observer.unobserve(seq);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(seq);
  }

  // ---------- STUDENT LANGUAGE SYSTEM ----------
  const translations = {
    en: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.questions': 'Questions',
      'nav.mcqs': 'MCQs',
      'nav.tests': 'Tests',
      'nav.progress': 'Progress',
      'nav.bookmarks': 'Bookmarks',
      'nav.codi': 'Codi AI',
      'nav.logout': 'Logout',

      // Dashboard
      'dashboard.welcome': 'Welcome back, Arjun',
      'dashboard.subtitle': "Here's your progress overview. Keep going — the boards are coming.",
      'dashboard.questionsPracticed': 'Questions Practiced',
      'dashboard.mcqsSolved': 'MCQs Solved',
      'dashboard.testsCompleted': 'Tests Completed',
      'dashboard.currentStreak': 'Current Streak',
      'dashboard.continue': 'Continue Where You Left Off',
      'dashboard.hcfPractice': 'Real Numbers — HCF Practice',
      'dashboard.lastPracticed': 'Last practiced 2 hours ago · 75% complete',
      'dashboard.lifeProcesses': 'Life Processes MCQ Set',
      'dashboard.remainingQuestions': '3 questions remaining · Priority: 78',
      'dashboard.recommended': 'Recommended for You',
      'dashboard.polynomials': 'Polynomials — Zeroes & Coefficients',
      'dashboard.notStarted': 'Not started',
      'dashboard.chemicalReactions': 'Chemical Reactions — Balancing Equations',
      'dashboard.nationalism': 'Nationalism in India — Non-Cooperation',
      'dashboard.inProgress': 'In progress',
      'dashboard.weeklyProgress': 'Weekly Progress',
      'dashboard.math': 'Mathematics',
      'dashboard.science': 'Science',
      'dashboard.social': 'Social Science',
      'dashboard.english': 'English',
      'dashboard.upcomingTests': 'Upcoming Tests',
      'dashboard.linearEquations': 'Chapter 3: Pair of Linear Equations',
      'dashboard.scheduledTomorrow': 'Scheduled: Tomorrow 10:00 AM',
      'dashboard.upcoming': 'Upcoming',
      'dashboard.fullSyllabus': 'Full Syllabus Mock Test',
      'dashboard.scheduledNextSunday': 'Scheduled: Next Sunday',
      'dashboard.scheduled': 'Scheduled',

      // Common
      'common.startTest': 'Start Test',
      'common.practice': 'Practice',
      'common.remove': 'Remove',
      'common.filterBy': 'Filter by',
      'common.allTypes': 'All Types',
      'common.question': 'Question',
      'common.mcq': 'MCQ',
      'common.paper': 'Paper',
      'common.noBookmarks': 'No more bookmarks',
      'common.startPracticing': 'Start practicing and bookmark questions you want to revisit.',
      'common.exploreQuestions': 'Explore Questions',
      'common.takeTest': 'Take Test',
      'common.locked': 'Locked',
      'common.review': 'Review',
      'common.available': 'Available',
      'common.practiced': 'Practiced',
      'common.practiceAgain': 'Practice Again',
      'common.startPractice': 'Start Practice',
      'common.shortAnswer': 'Short answer',
      'common.medium': 'Medium',
      'common.hard': 'Hard',
      'common.easy': 'Easy',
      'common.marks_2': '2 marks',
      'common.marks_3': '3 marks',
      'common.marks_5': '5 marks',
      'common.longAnswer': 'Long answer',
      'common.bookmarked': 'Bookmarked',
      'common.allSubjects': 'All Subjects',
      'common.allChapters': 'All Chapters',

      // Subjects
      'subjects.math': 'Mathematics',
      'subjects.science': 'Science',
      'subjects.social': 'Social Science',
      'subjects.english': 'English',
      'subjects.hindi': 'Hindi',
      'subjects.it': 'Information Technology',

      // Chapters (sample)
      'chapters.realNumbers': 'Real Numbers',
      'chapters.chemicalReactions': 'Chemical Reactions',
      'chapters.nationalism': 'Nationalism in India',
      'chapters.polynomials': 'Polynomials',
      'chapters.lifeProcesses': 'Life Processes',
      'chapters.development': 'Development',
      'chapters.ch1': 'Chapter 1',
      'chapters.ch2': 'Chapter 2',

      // Questions page
      'questions.title': 'Questions',
      'questions.subtitle': 'Browse and practice standard questions.',

      // MCQs page
      'mcqs.title': 'MCQs',
      'mcqs.subtitle': 'Test your knowledge with multiple choice questions.',
      'mcq.priority': 'Priority',

      // MCQ options
      'options.transportOxygen': 'Transport of oxygen',
      'options.transportHormones': 'Transport of hormones',
      'options.productionUrine': 'Production of urine',
      'options.transportNutrients': 'Transport of nutrients',
      'options.gdpGrowth': 'GDP growth',
      'options.literacyRate': 'Literacy rate',
      'options.perCapitaIncome': 'Per capita income',
      'options.lifeExpectancy': 'Life expectancy',

      // Tests page
      'tests.title': 'Tests',
      'tests.subtitle': 'Take tests and assessments to measure your preparation.',
      'tests.realNumbers': 'Chapter 1: Real Numbers',
      'tests.realNumbersDesc': 'Mathematics · 15 questions · 30 minutes',
      'tests.polynomials': 'Chapter 2: Polynomials',
      'tests.polynomialsDesc': 'Mathematics · 12 questions · 25 minutes',
      'tests.lifeProcesses': 'Life Processes - Full Chapter',
      'tests.lifeProcessesDesc': 'Science · 20 questions · 40 minutes',
      'tests.attempts': 'Attempts',
      'tests.bestScore': 'Best Score',
      'tests.lastAttempt': 'Last Attempt',
      'tests.lockedMessage': 'Complete Chapter 1 & 2 practice to unlock',
      'tests.history': 'Test History',
      'tests.table.test': 'Test',
      'tests.table.subject': 'Subject',
      'tests.table.date': 'Date',
      'tests.table.score': 'Score',
      'tests.table.time': 'Time Taken',
      'tests.table.actions': 'Actions',
      'tests.realNumbersTest': 'Real Numbers - Chapter Test',
      'tests.polynomialsTest': 'Polynomials - Chapter Test',

      // Progress page
      'progress.title': 'Your Progress',
      'progress.subtitle': 'Track your performance across all subjects.',
      'progress.overallProgress': 'Overall Progress',
      'progress.questionsCompleted': 'Questions Completed',
      'progress.averageScore': 'Average Score',
      'progress.daysActive': 'Days Active',
      'progress.subjectProgress': 'Subject-wise Progress',

      // Bookmarks page
      'bookmarks.title': 'Bookmarks',
      'bookmarks.subtitle': 'Your saved questions, MCQs, and resources for quick access.',
      'bookmarks.paperTitle': 'Mathematics Standard — Set 2',
      'bookmarks.paperMeta': 'Mathematics · 2027 · 80 marks · 180 min',
      'bookmarks.added': 'Bookmarked',
      'bookmarks.removed': 'Removed bookmark',

      // Codi page
      'codi.title': 'Codi AI',
      'codi.subtitle': 'Your AI study companion. Ask questions, get explanations, generate practice.',
      'codi.welcome': "Hello! I'm Codi, your AI study companion. I can help you with:",
      'codi.feature1': '• Explaining concepts step-by-step',
      'codi.feature2': '• Generating practice questions',
      'codi.feature3': '• Solving problems with you',
      'codi.feature4': '• Creating study plans',
      'codi.feature5': '• Answering doubts instantly',
      'codi.prompt': 'What would you like help with today?',
      'codi.exampleQuestion': 'Can you explain how to find HCF using Euclid\'s algorithm?',
      'codi.justNow': 'Just now',
      'codi.exampleAnswer': "Euclid's division algorithm finds the HCF of two numbers by repeatedly applying the division lemma:",
      'codi.step1': 'Divide the larger number by the smaller',
      'codi.step2': 'If remainder is 0, the divisor is the HCF',
      'codi.step3': 'If remainder ≠ 0, divide the previous divisor by the remainder',
      'codi.step4': 'Repeat until remainder is 0',
      'codi.exampleResult': 'For 135 and 225:\n225 = 135 × 1 + 90\n135 = 90 × 1 + 45\n90 = 45 × 2 + 0\nHCF = 45',
      'codi.inputPlaceholder': 'Ask Codi anything...',
      'codi.quickActions': 'Quick Actions',
      'codi.action1': 'Generate Practice Questions',
      'codi.action2': 'Create Study Plan',
      'codi.action3': 'Explain a Concept',
      'codi.action4': 'Review My Mistakes',
      'codi.recentConversations': 'Recent Conversations',
      'codi.convo1': "Euclid's Division Algorithm",
      'codi.convo1meta': 'Mathematics · 2 hours ago',
      'codi.convo2': 'Balancing Chemical Equations',
      'codi.convo2meta': 'Science · Yesterday',
      'codi.convo3': 'Non-Cooperation Movement Causes',
      'codi.convo3meta': 'Social Science · 2 days ago',

      // Login
      'login.title': 'Student Login',
      'login.subtitle': 'Score AI',
      'login.email': 'Email',
      'login.password': 'Password',
      'login.remember': 'Remember me',
      'login.forgot': 'Forgot password?',
      'login.button': 'Login',
      'login.noAccount': "Don't have an account? Contact Void or Codi.",
      'login.success': 'Login successful',
      'login.error': 'Invalid login details',
      'login.emailRequired': 'Please enter your email',
      'login.passwordRequired': 'Please enter your password',

      // Access & Session
      'access.required': 'You need to log in to access the student area',
      'logout.success': 'Logged out successfully',

      // Policy
      'policy.title': 'Student Policy',
      'policy.version': 'Version',
      'policy.p1_title': 'Data Privacy',
      'policy.p1_text': 'Your data is safe and private and is not shared anywhere.',
      'policy.p2_title': 'Sample Papers',
      'policy.p2_text': 'Our sample papers are made from pure statistics.',
      'policy.p3_title': 'Activity & Security',
      'policy.p3_text': 'We have every right to be involved in your activity. If our data is leaked, legal action will be taken.',
      'policy.p4_title': 'File Sharing',
      'policy.p4_text': 'Sharing of provided files is not allowed.',
      'policy.p5_title': 'Emails & Notifications',
      'policy.p5_text': 'We will send users Gmail messages and notifications.',
      'policy.p6_title': 'File Viewer',
      'policy.p6_text': 'Our file viewer is safe and secure.',
      'policy.accept': 'I have read and agree to the Student Policy.',
      'policy.acceptButton': 'Accept Policy',
      'policy.accepted': 'Policy accepted.',
      'policy.continue': 'Continue',
      'session.logout': 'Logout'
    },
    hinglish: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.questions': 'Questions',
      'nav.mcqs': 'MCQs',
      'nav.tests': 'Tests',
      'nav.progress': 'Aapki Progress',
      'nav.bookmarks': 'Bookmarks',
      'nav.codi': 'Codi AI',
      'nav.logout': 'Logout',

      // Dashboard
      'dashboard.welcome': 'Welcome back, Arjun',
      'dashboard.subtitle': 'Yeh raha aapka progress overview. Keep going — boards aane wale hain.',
      'dashboard.questionsPracticed': 'Questions Practice Kiye',
      'dashboard.mcqsSolved': 'MCQs Solve Kiye',
      'dashboard.testsCompleted': 'Tests Complete Kiye',
      'dashboard.currentStreak': 'Current Streak',
      'dashboard.continue': 'Wahan se continue karein jahan chhoda tha',
      'dashboard.hcfPractice': 'Real Numbers — HCF Practice',
      'dashboard.lastPracticed': 'Last practice 2 hours pehle · 75% complete',
      'dashboard.lifeProcesses': 'Life Processes MCQ Set',
      'dashboard.remainingQuestions': '3 questions baaki · Priority: 78',
      'dashboard.recommended': 'Aapke liye recommended',
      'dashboard.polynomials': 'Polynomials — Zeroes & Coefficients',
      'dashboard.notStarted': 'Start nahi hua',
      'dashboard.chemicalReactions': 'Chemical Reactions — Balancing Equations',
      'dashboard.nationalism': 'Nationalism in India — Non-Cooperation',
      'dashboard.inProgress': 'Progress mein',
      'dashboard.weeklyProgress': 'Weekly Progress',
      'dashboard.math': 'Mathematics',
      'dashboard.science': 'Science',
      'dashboard.social': 'Social Science',
      'dashboard.english': 'English',
      'dashboard.upcomingTests': 'Upcoming Tests',
      'dashboard.linearEquations': 'Chapter 3: Pair of Linear Equations',
      'dashboard.scheduledTomorrow': 'Scheduled: Kal 10:00 AM',
      'dashboard.upcoming': 'Upcoming',
      'dashboard.fullSyllabus': 'Full Syllabus Mock Test',
      'dashboard.scheduledNextSunday': 'Scheduled: Agli Sunday',
      'dashboard.scheduled': 'Scheduled',

      // Common
      'common.startTest': 'Test Shuru Karein',
      'common.practice': 'Practice',
      'common.remove': 'Hatao',
      'common.filterBy': 'Filter karein',
      'common.allTypes': 'Sabhi Types',
      'common.question': 'Question',
      'common.mcq': 'MCQ',
      'common.paper': 'Paper',
      'common.noBookmarks': 'Aur koi bookmarks nahi',
      'common.startPracticing': 'Practice shuru karein aur questions bookmark karein jo aap dubara dekhna chahein.',
      'common.exploreQuestions': 'Questions Explore Karein',
      'common.takeTest': 'Test Shuru Karein',
      'common.locked': 'Locked',
      'common.review': 'Review Karein',
      'common.available': 'Available',
      'common.practiced': 'Practiced',
      'common.practiceAgain': 'Dubara Practice Karein',
      'common.startPractice': 'Practice Shuru Karein',
      'common.shortAnswer': 'Chhota answer',
      'common.medium': 'Medium',
      'common.hard': 'Mushkil',
      'common.easy': 'Aasan',
      'common.marks_2': '2 marks',
      'common.marks_3': '3 marks',
      'common.marks_5': '5 marks',
      'common.longAnswer': 'Lamba answer',
      'common.bookmarked': 'Bookmarked',
      'common.allSubjects': 'Sabhi Subjects',
      'common.allChapters': 'Sabhi Chapters',

      // Subjects
      'subjects.math': 'Mathematics',
      'subjects.science': 'Science',
      'subjects.social': 'Social Science',
      'subjects.english': 'English',
      'subjects.hindi': 'Hindi',
      'subjects.it': 'Information Technology',

      // Chapters
      'chapters.realNumbers': 'Real Numbers',
      'chapters.chemicalReactions': 'Chemical Reactions',
      'chapters.nationalism': 'Nationalism in India',
      'chapters.polynomials': 'Polynomials',
      'chapters.lifeProcesses': 'Life Processes',
      'chapters.development': 'Development',
      'chapters.ch1': 'Chapter 1',
      'chapters.ch2': 'Chapter 2',

      // Questions
      'questions.title': 'Questions',
      'questions.subtitle': 'Browse karein aur practice karein standard questions.',

      // MCQs
      'mcqs.title': 'MCQs',
      'mcqs.subtitle': 'Multiple choice questions se apna test karein.',
      'mcq.priority': 'Priority',

      // Options
      'options.transportOxygen': 'Oxygen ka transport',
      'options.transportHormones': 'Hormones ka transport',
      'options.productionUrine': 'Urine ka production',
      'options.transportNutrients': 'Nutrients ka transport',
      'options.gdpGrowth': 'GDP growth',
      'options.literacyRate': 'Literacy rate',
      'options.perCapitaIncome': 'Per capita income',
      'options.lifeExpectancy': 'Life expectancy',

      // Tests
      'tests.title': 'Tests',
      'tests.subtitle': 'Tests aur assessments lein apni preparation measure karne ke liye.',
      'tests.realNumbers': 'Chapter 1: Real Numbers',
      'tests.realNumbersDesc': 'Mathematics · 15 questions · 30 minutes',
      'tests.polynomials': 'Chapter 2: Polynomials',
      'tests.polynomialsDesc': 'Mathematics · 12 questions · 25 minutes',
      'tests.lifeProcesses': 'Life Processes - Full Chapter',
      'tests.lifeProcessesDesc': 'Science · 20 questions · 40 minutes',
      'tests.attempts': 'Attempts',
      'tests.bestScore': 'Best Score',
      'tests.lastAttempt': 'Last Attempt',
      'tests.lockedMessage': 'Chapter 1 & 2 practice complete karein unlock karne ke liye',
      'tests.history': 'Test History',
      'tests.table.test': 'Test',
      'tests.table.subject': 'Subject',
      'tests.table.date': 'Date',
      'tests.table.score': 'Score',
      'tests.table.time': 'Time Taken',
      'tests.table.actions': 'Actions',
      'tests.realNumbersTest': 'Real Numbers - Chapter Test',
      'tests.polynomialsTest': 'Polynomials - Chapter Test',

      // Progress
      'progress.title': 'Aapki Progress',
      'progress.subtitle': 'Sabhi subjects mein apna performance track karein.',
      'progress.overallProgress': 'Overall Progress',
      'progress.questionsCompleted': 'Questions Complete Kiye',
      'progress.averageScore': 'Average Score',
      'progress.daysActive': 'Days Active',
      'progress.subjectProgress': 'Subject-wise Progress',

      // Bookmarks
      'bookmarks.title': 'Bookmarks',
      'bookmarks.subtitle': 'Aapke saved questions, MCQs, aur resources quick access ke liye.',
      'bookmarks.paperTitle': 'Mathematics Standard — Set 2',
      'bookmarks.paperMeta': 'Mathematics · 2027 · 80 marks · 180 min',
      'bookmarks.added': 'Bookmark ho gaya',
      'bookmarks.removed': 'Bookmark hata diya',

      // Codi
      'codi.title': 'Codi AI',
      'codi.subtitle': 'Aapka AI study companion. Questions poochhein, explanations paayein, practice generate karein.',
      'codi.welcome': "Hello! Main Codi hoon, aapka AI study companion. Main aapki madad kar sakta hoon:",
      'codi.feature1': '• Concepts step-by-step explain karna',
      'codi.feature2': '• Practice questions generate karna',
      'codi.feature3': '• Aapke saath problems solve karna',
      'codi.feature4': '• Study plans banana',
      'codi.feature5': '• Doubts instantly answer karna',
      'codi.prompt': 'Aaj main aapki kya madad kar sakta hoon?',
      'codi.exampleQuestion': 'Kya aap bata sakte hain HCF kaise find karein Euclid\'s algorithm se?',
      'codi.justNow': 'Abhi',
      'codi.exampleAnswer': "Euclid's division algorithm do numbers ka HCF nikaalta hai repeatedly division lemma apply karke:",
      'codi.step1': 'Bade number ko chhote se divide karein',
      'codi.step2': 'Agar remainder 0 hai, divisor HCF hai',
      'codi.step3': 'Agar remainder ≠ 0, previous divisor ko remainder se divide karein',
      'codi.step4': 'Jab tak remainder 0 na ho repeat karein',
      'codi.exampleResult': '135 aur 225 ke liye:\n225 = 135 × 1 + 90\n135 = 90 × 1 + 45\n90 = 45 × 2 + 0\nHCF = 45',
      'codi.inputPlaceholder': 'Codi se kuch bhi poochhein...',
      'codi.quickActions': 'Quick Actions',
      'codi.action1': 'Practice Questions Generate Karein',
      'codi.action2': 'Study Plan Banayein',
      'codi.action3': 'Concept Explain Karein',
      'codi.action4': 'Meri Mistakes Review Karein',
      'codi.recentConversations': 'Recent Conversations',
      'codi.convo1': "Euclid's Division Algorithm",
      'codi.convo1meta': 'Mathematics · 2 hours ago',
      'codi.convo2': 'Balancing Chemical Equations',
      'codi.convo2meta': 'Science · Yesterday',
      'codi.convo3': 'Non-Cooperation Movement Causes',
      'codi.convo3meta': 'Social Science · 2 days ago',

      // Login
      'login.title': 'Student Login',
      'login.subtitle': 'Score AI',
      'login.email': 'Email',
      'login.password': 'Password',
      'login.remember': 'Remember me',
      'login.forgot': 'Password bhool gaye?',
      'login.button': 'Login',
      'login.noAccount': "Account nahi hai? Void ya Codi se contact karein.",
      'login.success': 'Login successful',
      'login.error': 'Galat login details',
      'login.emailRequired': 'Kripya email likhein',
      'login.passwordRequired': 'Kripya password likhein',

      // Access & Session
      'access.required': 'Student area access karne ke liye pehle login karein',
      'logout.success': 'Logout ho gaya',

      // Policy
      'policy.title': 'Student Policy',
      'policy.version': 'Version',
      'policy.p1_title': 'Data Privacy',
      'policy.p1_text': 'Aapka data safe aur private hai, kisi ko share nahi kiya jaata.',
      'policy.p2_title': 'Sample Papers',
      'policy.p2_text': 'Hamare sample papers pure statistics se bane hain.',
      'policy.p3_title': 'Activity & Security',
      'policy.p3_text': 'Hamein aapki activity mein involved hone ka poora haq hai. Agar hamara data leak hota hai toh legal action liya jaayega.',
      'policy.p4_title': 'File Sharing',
      'policy.p4_text': 'Diye gaye files ko share karna allowed nahi hai.',
      'policy.p5_title': 'Emails & Notifications',
      'policy.p5_text': 'Hum users ko Gmail messages aur notifications bhejenge.',
      'policy.p6_title': 'File Viewer',
      'policy.p6_text': 'Hamara file viewer safe aur secure hai.',
      'policy.accept': 'Maine Student Policy padh li aur sehmat hoon.',
      'policy.acceptButton': 'Policy Accept Karein',
      'policy.accepted': 'Policy accept ho gayi.',
      'policy.continue': 'Continue',
      'session.logout': 'Logout'
    }
  };

  function getCurrentLanguage() {
    return localStorage.getItem(LANG_KEY) || 'en';
  }

  function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'hinglish') lang = 'en';
    localStorage.setItem(LANG_KEY, lang);
    applyTranslations(lang);
  }

  function applyTranslations(lang) {
    const dict = translations[lang] || translations.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });
    const selector = document.getElementById('lang-selector');
    if (selector) selector.value = lang;
    const loginSelector = document.getElementById('login-lang-selector');
    if (loginSelector) loginSelector.value = lang;
    // Update policy gate if visible
    const policyGate = document.getElementById('policy-gate-container');
    if (policyGate) {
      updatePolicyGate(policyGate, lang);
    }
  }

  function initLanguage() {
    const selector = document.getElementById('lang-selector');
    const loginSelector = document.getElementById('login-lang-selector');
    const current = getCurrentLanguage();

    if (selector) {
      selector.value = current;
      applyTranslations(current);
      selector.addEventListener('change', function() {
        setLanguage(this.value);
      });
    }
    if (loginSelector) {
      loginSelector.value = current;
      applyTranslations(current);
      loginSelector.addEventListener('change', function() {
        setLanguage(this.value);
      });
    }
    // If neither exists, still apply translations to any data-i18n elements
    if (!selector && !loginSelector) {
      applyTranslations(current);
    }
  }

  // ---------- STUDENT POLICY GATE ----------
  function getPolicyAcceptance() {
    try {
      const data = JSON.parse(localStorage.getItem(POLICY_KEY));
      if (data && data.accepted && data.version === CURRENT_POLICY_VERSION) {
        return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  function setPolicyAccepted() {
    localStorage.setItem(POLICY_KEY, JSON.stringify({
      accepted: true,
      version: CURRENT_POLICY_VERSION
    }));
  }

  function updatePolicyGate(container, lang) {
    const dict = translations[lang] || translations.en;
    container.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });
  }

  function renderPolicyGate() {
    if (document.getElementById('policy-gate-container')) return;
    const lang = getCurrentLanguage();
    const dict = translations[lang] || translations.en;

    const overlay = document.createElement('div');
    overlay.id = 'policy-gate-container';
    overlay.className = 'policy-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'policy-title');

    overlay.innerHTML = `
    <div class="policy-container">
    <h2 id="policy-title" data-i18n="policy.title">${dict['policy.title']}</h2>
    <p class="policy-version" data-i18n="policy.version">${dict['policy.version']} ${CURRENT_POLICY_VERSION}</p>
    <ul class="policy-list">
    <li><strong data-i18n="policy.p1_title">${dict['policy.p1_title']}</strong><span data-i18n="policy.p1_text">${dict['policy.p1_text']}</span></li>
    <li><strong data-i18n="policy.p2_title">${dict['policy.p2_title']}</strong><span data-i18n="policy.p2_text">${dict['policy.p2_text']}</span></li>
    <li><strong data-i18n="policy.p3_title">${dict['policy.p3_title']}</strong><span data-i18n="policy.p3_text">${dict['policy.p3_text']}</span></li>
    <li><strong data-i18n="policy.p4_title">${dict['policy.p4_title']}</strong><span data-i18n="policy.p4_text">${dict['policy.p4_text']}</span></li>
    <li><strong data-i18n="policy.p5_title">${dict['policy.p5_title']}</strong><span data-i18n="policy.p5_text">${dict['policy.p5_text']}</span></li>
    <li><strong data-i18n="policy.p6_title">${dict['policy.p6_title']}</strong><span data-i18n="policy.p6_text">${dict['policy.p6_text']}</span></li>
    </ul>
    <div class="policy-accept">
    <input type="checkbox" id="policy-checkbox">
    <label for="policy-checkbox" data-i18n="policy.accept">${dict['policy.accept']}</label>
    </div>
    <div class="policy-actions">
    <button class="btn btn-primary" id="policy-accept-btn" disabled data-i18n="policy.acceptButton">${dict['policy.acceptButton']}</button>
    </div>
    </div>
    `;

    document.body.appendChild(overlay);

    const checkbox = document.getElementById('policy-checkbox');
    const acceptBtn = document.getElementById('policy-accept-btn');

    checkbox.addEventListener('change', function() {
      acceptBtn.disabled = !this.checked;
    });

    acceptBtn.addEventListener('click', function() {
      if (!checkbox.checked) return;
      setPolicyAccepted();
      const gate = document.getElementById('policy-gate-container');
      if (gate) gate.remove();
      if (window.showToast) {
        const msgKey = 'policy.accepted';
        const msg = translations[getCurrentLanguage()][msgKey] || 'Policy accepted.';
        showToast(msg);
      }
    });
  }

  function checkPolicyAndRender() {
    if (!window.location.pathname.includes('/student/')) return;
    if (getPolicyAcceptance()) return;
    renderPolicyGate();
  }

  // ---------- STUDENT SESSION MANAGEMENT ----------
  function startSession(email) {
    const session = {
      loggedIn: true,
      email: email,
      timestamp: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function endSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function isLoggedIn() {
    try {
      const data = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (data && data.loggedIn === true) {
        return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  function getSessionEmail() {
    try {
      const data = JSON.parse(localStorage.getItem(SESSION_KEY));
      return data ? data.email : null;
    } catch (e) { return null; }
  }

  // ---------- STUDENT ACCESS GUARD ----------
  function initStudentAccessGuard() {
    if (!window.location.pathname.includes('/student/')) return;
    if (!isLoggedIn()) {
      if (window.location.pathname.includes('login.html')) return;
      localStorage.setItem('score-ai-intended', window.location.pathname);
      window.location.href = '../login.html';
      return;
    }
    checkPolicyAndRender();
  }

  // ---------- LOGOUT HANDLER ----------
  function initLogout() {
    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        endSession();
        if (window.showToast) {
          const msgKey = 'logout.success';
          const msg = translations[getCurrentLanguage()][msgKey] || 'Logged out successfully.';
          showToast(msg);
        }
        window.location.href = '../login.html';
      });
    });
  }

  // ---------- LOGIN FORM HANDLER ----------
  function initLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const emailInput = document.getElementById('login-email');
      const passwordInput = document.getElementById('login-password');
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';

      if (!email) {
        const msgKey = 'login.emailRequired';
        const msg = translations[getCurrentLanguage()][msgKey] || 'Please enter your email.';
        if (window.showToast) showToast(msg, 'error');
                          return;
      }
      if (!password) {
        const msgKey = 'login.passwordRequired';
        const msg = translations[getCurrentLanguage()][msgKey] || 'Please enter your password.';
        if (window.showToast) showToast(msg, 'error');
                          return;
      }

      if (email.includes('@') && password.length > 0) {
        startSession(email);
        if (window.showToast) {
          const msgKey = 'login.success';
          const msg = translations[getCurrentLanguage()][msgKey] || 'Login successful.';
          showToast(msg);
        }
        const intended = localStorage.getItem('score-ai-intended') || '../student/dashboard.html';
        localStorage.removeItem('score-ai-intended');
        window.location.href = intended;
      } else {
        const msgKey = 'login.error';
        const msg = translations[getCurrentLanguage()][msgKey] || 'Invalid login details.';
        if (window.showToast) showToast(msg, 'error');
      }
    });
  }

  // ---------- INITIALIZATION ----------
  document.addEventListener('DOMContentLoaded', function() {
    // Core
    initTheme();
    initMobileMenu();
    initCountdown();
    initMCQInteractions();
    initSmoothScroll();
    initCurrentYear();
    initPriorityPills();
    initToast();
    highlightActiveNav();

    // Phase 2
    initScrollReveal();
    initTableStagger();
    initProgressBar();
    initStatEntrance();
    initNumberCounter();
    initStaggerGrid();
    initBookmarkToggle();
    initChatForm();
    initKeyboardNav();
    initHeroSequence();

    // Language
    initLanguage();

    // Session & Access
    initStudentAccessGuard();
    initLogout();

    // Login form
    initLoginForm();
  });
})();
