/**
 * Main Application Logic
 * Manages theme switching, scroll dynamics, active navigation tracking,
 * copy-to-clipboard interactions, project architecture modals, and form validation.
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Theme Management (Dark & Light Mode)
  // --------------------------------------------------------------------------
  const THEME_STORAGE_KEY = 'rohit_portfolio_theme';
  const themeToggleBtn = document.getElementById('theme-toggle');

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    // Respect OS preference if no manual setting
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  // Initialize theme
  applyTheme(getPreferredTheme());

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      showToast(`Switched to ${next.charAt(0).toUpperCase() + next.slice(1)} Mode`);
    });
  }

  // --------------------------------------------------------------------------
  // 2. Scroll Progress & Header Dynamics
  // --------------------------------------------------------------------------
  const scrollProgress = document.getElementById('scroll-progress');
  const siteHeader = document.getElementById('site-header');

  function handleScroll() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (scrollProgress && docHeight > 0) {
      const progressPercent = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
      scrollProgress.style.width = `${progressPercent}%`;
    }

    if (siteHeader) {
      if (scrollY > 30) {
        siteHeader.style.boxShadow = 'var(--shadow-card)';
      } else {
        siteHeader.style.boxShadow = 'none';
      }
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // --------------------------------------------------------------------------
  // 3. Subtle Scroll Reveal Animations (IntersectionObserver)
  // --------------------------------------------------------------------------
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.1
      }
    );

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback if IntersectionObserver not supported
    revealElements.forEach(function (el) {
      el.classList.add('active');
    });
  }

  // --------------------------------------------------------------------------
  // 4. Active Navigation Highlighting
  // --------------------------------------------------------------------------
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if ('IntersectionObserver' in window && sections.length > 0) {
    const navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const currentId = entry.target.getAttribute('id');
            navLinks.forEach(function (link) {
              if (link.getAttribute('href') === `#${currentId}`) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });
          }
        });
      },
      {
        threshold: 0.25,
        rootMargin: '-70px 0px -40% 0px'
      }
    );

    sections.forEach(function (sec) {
      navObserver.observe(sec);
    });
  }

  // --------------------------------------------------------------------------
  // 5. Mobile Menu Toggle
  // --------------------------------------------------------------------------
  const mobileToggleBtn = document.getElementById('mobile-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  if (mobileToggleBtn && mobileMenu) {
    mobileToggleBtn.addEventListener('click', function () {
      const isOpen = mobileMenu.classList.toggle('open');
      mobileToggleBtn.setAttribute('aria-expanded', isOpen);
      mobileMenu.setAttribute('aria-hidden', !isOpen);
    });

    mobileNavLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        mobileToggleBtn.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      });
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 840 && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        mobileToggleBtn.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 6. Copy Email to Clipboard with Feedback
  // --------------------------------------------------------------------------
  const copyEmailBtns = document.querySelectorAll('.copy-email-btn');

  copyEmailBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const email = btn.getAttribute('data-email') || 'rohit.engineer@portfolio.dev';

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(function () {
          showToast(`Copied ${email} to clipboard!`);
          temporarilyHighlightBtn(btn);
        }).catch(function () {
          fallbackCopy(email);
        });
      } else {
        fallbackCopy(email);
      }
    });
  });

  function temporarilyHighlightBtn(btn) {
    const originalText = btn.querySelector('.copy-text');
    if (originalText) {
      const prev = originalText.textContent;
      originalText.textContent = 'Copied!';
      setTimeout(function () {
        originalText.textContent = prev;
      }, 2000);
    }
  }

  function fallbackCopy(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showToast(`Copied ${text} to clipboard!`);
    } catch (err) {
      showToast(`Please copy: ${text}`);
    }
    document.body.removeChild(tempInput);
  }

  // --------------------------------------------------------------------------
  // 7. Toast Notification Handler
  // --------------------------------------------------------------------------
  const toastEl = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message, duration = 2600) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, duration);
  }

  // --------------------------------------------------------------------------
  // 8. Contact Form Handling & Validation
  // --------------------------------------------------------------------------
  const contactForm = document.getElementById('contact-form');
  const formStatusMsg = document.getElementById('form-status-msg');
  const submitBtn = document.getElementById('submit-btn');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      let isValid = true;
      const nameInput = document.getElementById('form-name');
      const emailInput = document.getElementById('form-email');
      const subjectInput = document.getElementById('form-subject');
      const messageInput = document.getElementById('form-message');

      const nameError = document.getElementById('name-error');
      const emailError = document.getElementById('email-error');
      const subjectError = document.getElementById('subject-error');
      const messageError = document.getElementById('message-error');

      // Clear previous errors
      [nameError, emailError, subjectError, messageError].forEach(function (el) {
        if (el) el.textContent = '';
      });
      if (formStatusMsg) {
        formStatusMsg.textContent = '';
        formStatusMsg.className = 'form-status-msg';
      }

      // Validate Name
      if (!nameInput.value.trim()) {
        if (nameError) nameError.textContent = 'Please provide your name.';
        isValid = false;
      }

      // Validate Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
        if (emailError) emailError.textContent = 'Please enter a valid email address.';
        isValid = false;
      }

      // Validate Subject
      if (!subjectInput.value.trim()) {
        if (subjectError) subjectError.textContent = 'Please enter a subject.';
        isValid = false;
      }

      // Validate Message
      if (!messageInput.value.trim() || messageInput.value.trim().length < 15) {
        if (messageError) messageError.textContent = 'Message should be at least 15 characters.';
        isValid = false;
      }

      if (!isValid) return;

      // Simulate asynchronous delivery
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Sending Message...';
      }

      setTimeout(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.querySelector('span').textContent = 'Send Message';
        }
        contactForm.reset();
        if (formStatusMsg) {
          formStatusMsg.textContent = '✓ Message received! Rohit will get back to you within 24 hours.';
          formStatusMsg.classList.add('success');
        }
        showToast('Message sent successfully!');
      }, 1000);
    });
  }

  // --------------------------------------------------------------------------
  // 9. Project Architecture Specifications Modal
  // --------------------------------------------------------------------------
  const projectModal = document.getElementById('project-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalContentBody = document.getElementById('modal-content-body');
  const modalTriggers = document.querySelectorAll('.project-modal-trigger');

  const projectData = {
    cloudpulse: {
      title: 'CloudPulse — Distributed Observability Engine',
      category: 'Cloud Architecture & Real-Time Ingestion',
      status: 'Production Enterprise Grade',
      overview:
        'CloudPulse was designed to address high-cardinality telemetry ingestion across containerized microservices. It aggregates live metrics, system traces, and logs while preventing main-thread UI locking via Web Workers and Redis streams.',
      architecture: [
        'Ingestion Gateway: Node.js / Express microservice receiving compressed gzip payload batches.',
        'Buffer Tier: Redis stream pipeline handling backpressure during sudden traffic spikes (up to 20k events/sec).',
        'State & Caching: PostgreSQL partitioned time-series tables with rolling retention policies.',
        'Frontend Dashboard: React + TypeScript leveraging canvas-based 60fps graph visualizers and WebSockets.'
      ],
      metrics: [
        'Reduced incident mean time to detect (MTTD) by 62%.',
        '99.99% ingestion pipeline uptime over a 12-month rolling window.',
        'Sub-100ms real-time event delivery from client dispatch to monitoring dashboard.'
      ],
      stack: ['TypeScript', 'React', 'Node.js', 'Redis', 'WebSockets', 'PostgreSQL', 'Docker', 'AWS ECS']
    },
    apexcommerce: {
      title: 'ApexCommerce — High-Concurrency Headless Platform',
      category: 'Enterprise E-Commerce Systems',
      status: 'Multi-Tenant Production',
      overview:
        'A modular headless commerce infrastructure engineered to handle flash sales without race conditions or inventory overselling. Features distributed transaction locks and lightning-fast catalog search.',
      architecture: [
        'Edge Layer: Next.js edge caching and statically revalidated pages for sub-120ms product loading.',
        'Inventory Reservation Engine: Atomic row-level locking via PostgreSQL transactions to eliminate double booking.',
        'API Federation: GraphQL gateway unifying catalog, customer accounts, and third-party payment gateways.',
        'Resilience: Fallback offline carts with optimistic client synchronization.'
      ],
      metrics: [
        'Maintained zero cart checkout failures across peak Black Friday traffic spikes.',
        'Improved conversion rates by 28% through sub-second page transitions and seamless checkout flow.',
        'Reduced database CPU spikes by 54% using Redis query caching.'
      ],
      stack: ['Next.js', 'React', 'TypeScript', 'GraphQL', 'PostgreSQL', 'Tailwind CSS', 'Redis', 'Stripe API']
    },
    omniflow: {
      title: 'OmniFlow — Declarative Pipeline & API Orchestrator',
      category: 'Workflow Automation & Event-Driven Engine',
      status: 'Production Platform',
      overview:
        'An interactive node-based workflow orchestration platform that empowers engineers to compose heterogeneous microservices, transform payloads via sandboxed JavaScript/Python scripts, and schedule complex cron jobs.',
      architecture: [
        'Visual Node Engine: Hardware-accelerated SVG/HTML5 canvas with interactive zoom/pan controls.',
        'Task Dispatcher: RabbitMQ message queues with dead-letter queue routing for exponential retry logic.',
        'Execution Sandbox: Secure, isolated worker containers executing custom data transformations.',
        'Audit Logging: Immutable execution history tracked in append-only storage.'
      ],
      metrics: [
        'Automated 120,000+ monthly webhook sync operations across 15 enterprise integrations.',
        'Reduced engineering integration ticket turnaround time from 2 weeks to under 4 hours.',
        'Zero data loss during upstream third-party API downtimes.'
      ],
      stack: ['React', 'Python', 'FastAPI', 'RabbitMQ', 'Docker', 'PostgreSQL', 'TypeScript', 'Jest']
    },
    vectorgraph: {
      title: 'VectorGraph — 60 FPS Canvas Data Topology Visualizer',
      category: 'Graphics & Performance Engineering',
      status: 'High Performance Library',
      overview:
        'A custom hardware-accelerated 2D canvas visualization engine designed to render massive network graphs (50,000+ interconnected nodes) smoothly in standard web browsers without WebGL context thrashing.',
      architecture: [
        'Spatial Partitioning: Quadtree spatial indexing data structure for O(log n) cursor collision detection.',
        'Offscreen Canvas: Pre-rendering static node clusters offscreen to maximize compositor throughput.',
        'Worker Delegation: Physics simulation (force-directed layout) computed on dedicated Web Workers.',
        'Dual-Theme Harmonization: Dynamic programmatic color tokens shifting seamlessly between dark and light modes.'
      ],
      metrics: [
        'Consistently holds 60 FPS on standard modern laptops with 50,000 active nodes.',
        'Zero main-thread blocking during complex layout re-computations.',
        'Lightweight footprint: < 22KB gzipped with zero external runtime dependencies.'
      ],
      stack: ['HTML5 Canvas', 'WebGL', 'TypeScript', 'Web Workers', 'Quadtree Algorithms', 'Vite']
    }
  };

  function openProjectModal(projectId) {
    const data = projectData[projectId];
    if (!data || !modalContentBody || !projectModal) return;

    modalContentBody.innerHTML = `
      <div class="modal-project-header">
        <span class="section-tag">${escapeHtml(data.category)}</span>
        <h3 id="modal-project-title" style="font-size: var(--text-2xl); font-weight: 800; margin: 6px 0 12px 0; color: var(--color-text-primary);">
          ${escapeHtml(data.title)}
        </h3>
        <span class="tag" style="background-color: var(--color-accent-subtle); color: var(--color-accent); border-color: var(--color-accent-border);">
          ${escapeHtml(data.status)}
        </span>
      </div>

      <div style="margin: 20px 0; font-size: var(--text-sm); line-height: 1.7; color: var(--color-text-secondary);">
        <p>${escapeHtml(data.overview)}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="font-size: var(--text-xs); font-family: var(--font-mono); text-transform: uppercase; color: var(--color-text-primary); margin-bottom: 8px;">
          System Architecture & Technical Strategy
        </h4>
        <ul style="display: flex; flex-direction: column; gap: 8px; font-size: var(--text-xs); color: var(--color-text-secondary);">
          ${data.architecture
            .map(
              (item) => `
            <li style="display: flex; gap: 8px;">
              <span style="color: var(--color-accent); font-weight: bold;">▪</span>
              <span>${escapeHtml(item)}</span>
            </li>`
            )
            .join('')}
        </ul>
      </div>

      <div style="margin-bottom: 24px; padding: 14px; background-color: var(--color-bg-base); border: 1px solid var(--color-border); border-radius: var(--radius-sm);">
        <h4 style="font-size: var(--text-xs); font-family: var(--font-mono); text-transform: uppercase; color: var(--color-text-primary); margin-bottom: 8px;">
          Key Outcomes & Engineering Impact
        </h4>
        <ul style="display: flex; flex-direction: column; gap: 6px; font-size: var(--text-xs); color: var(--color-text-secondary);">
          ${data.metrics
            .map(
              (m) => `
            <li style="display: flex; gap: 8px;">
              <span style="color: var(--color-accent-emerald); font-weight: bold;">✓</span>
              <span>${escapeHtml(m)}</span>
            </li>`
            )
            .join('')}
        </ul>
      </div>

      <div>
        <h4 style="font-size: var(--text-xs); font-family: var(--font-mono); text-transform: uppercase; color: var(--color-text-primary); margin-bottom: 8px;">
          Technologies Deployed
        </h4>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${data.stack
            .map(
              (s) => `
            <span class="tech-pill">${escapeHtml(s)}</span>`
            )
            .join('')}
        </div>
      </div>
    `;

    if (typeof projectModal.showModal === 'function') {
      projectModal.showModal();
    } else {
      projectModal.setAttribute('open', '');
    }
  }

  function closeProjectModal() {
    if (!projectModal) return;
    if (typeof projectModal.close === 'function') {
      projectModal.close();
    } else {
      projectModal.removeAttribute('open');
    }
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  modalTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      const projectId = trigger.getAttribute('data-project');
      if (projectId) openProjectModal(projectId);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeProjectModal);
  }

  if (projectModal) {
    projectModal.addEventListener('click', function (e) {
      // Close on backdrop click
      const rect = projectModal.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        closeProjectModal();
      }
    });

    projectModal.addEventListener('cancel', function () {
      closeProjectModal();
    });
  }
})();
