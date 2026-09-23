/**
 * Ambient Generative Canvas Engine
 * Renders an interactive, subtle mathematical wave mesh and responsive gradient lighting.
 * Designed specifically for high performance (60 FPS), battery efficiency, and seamless Dark/Light theme transitions.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  // Configuration state
  let width = 0;
  let height = 0;
  let dpr = 1;
  let animationFrameId = null;
  let isRunning = true;
  let isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Interaction coordinates with smooth lerp
  const mouse = {
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    radius: 180,
    active: false
  };

  // Scroll offset state
  let scrollY = 0;
  let targetScrollY = 0;

  // Grid point mesh
  const GRID_STEP = 48; // spacing between grid vertices
  let cols = 0;
  let rows = 0;
  let points = [];
  let time = 0;

  // Theme-aware palette cache
  let currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

  const themeColors = {
    dark: {
      linePrimary: 'rgba(99, 102, 241, 0.12)',   // indigo
      lineSecondary: 'rgba(6, 182, 212, 0.08)', // cyan
      nodeFill: 'rgba(99, 102, 241, 0.25)',
      nodeHover: 'rgba(245, 158, 11, 0.6)'      // amber highlight on hover
    },
    light: {
      linePrimary: 'rgba(79, 70, 229, 0.07)',   // soft slate indigo
      lineSecondary: 'rgba(8, 145, 178, 0.05)', // soft slate cyan
      nodeFill: 'rgba(79, 70, 229, 0.15)',
      nodeHover: 'rgba(217, 119, 6, 0.4)'       // amber highlight on hover
    }
  };

  /**
   * Resizes canvas to match viewport and handles high-DPI displays.
   */
  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);

    buildGrid();
  }

  /**
   * Constructs mathematical vertex grid with organic noise baselines.
   */
  function buildGrid() {
    cols = Math.ceil(width / GRID_STEP) + 2;
    rows = Math.ceil(height / GRID_STEP) + 2;
    points = [];

    for (let i = 0; i < cols; i++) {
      points[i] = [];
      for (let j = 0; j < rows; j++) {
        points[i][j] = {
          baseX: (i - 1) * GRID_STEP,
          baseY: (j - 1) * GRID_STEP,
          x: (i - 1) * GRID_STEP,
          y: (j - 1) * GRID_STEP,
          vx: 0,
          vy: 0,
          phase: (i * 0.25) + (j * 0.35)
        };
      }
    }
  }

  /**
   * Updates coordinates of grid nodes based on harmonic waves, scroll, and mouse repulsion.
   */
  function updatePoints() {
    time += 0.015;

    // Smooth scroll interpolation
    scrollY += (targetScrollY - scrollY) * 0.1;

    // Smooth mouse position interpolation
    mouse.x += (mouse.targetX - mouse.x) * 0.15;
    mouse.y += (mouse.targetY - mouse.y) * 0.15;

    const scrollShift = scrollY * 0.001;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const p = points[i][j];

        // Harmonic sine wave displacement
        const waveX = Math.cos(time + p.phase + scrollShift) * 6;
        const waveY = Math.sin(time + p.phase * 1.2 + scrollShift) * 8;

        const targetX = p.baseX + waveX;
        const targetY = p.baseY + waveY;

        // Interactive mouse elasticity
        if (mouse.active) {
          const dx = targetX - mouse.x;
          const dy = targetY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 0) {
            const force = (1 - dist / mouse.radius) * 22;
            const angle = Math.atan2(dy, dx);
            p.x = targetX + Math.cos(angle) * force;
            p.y = targetY + Math.sin(angle) * force;
          } else {
            p.x += (targetX - p.x) * 0.1;
            p.y += (targetY - p.y) * 0.1;
          }
        } else {
          p.x += (targetX - p.x) * 0.1;
          p.y += (targetY - p.y) * 0.1;
        }
      }
    }
  }

  /**
   * Main render loop
   */
  function render() {
    ctx.clearRect(0, 0, width, height);

    const colors = themeColors[currentTheme] || themeColors.dark;

    ctx.lineWidth = 0.75;

    // Draw horizontal and diagonal connecting mesh curves
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const p = points[i][j];

        // Horizontal links
        if (i < cols - 1) {
          const pRight = points[i + 1][j];
          ctx.strokeStyle = (i % 2 === 0) ? colors.linePrimary : colors.lineSecondary;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pRight.x, pRight.y);
          ctx.stroke();
        }

        // Vertical links
        if (j < rows - 1) {
          const pDown = points[i][j + 1];
          ctx.strokeStyle = colors.linePrimary;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pDown.x, pDown.y);
          ctx.stroke();
        }

        // Accent nodes at major intersections
        if (i % 3 === 0 && j % 3 === 0) {
          ctx.beginPath();
          const distToMouse = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          const isNearMouse = mouse.active && distToMouse < 90;

          ctx.fillStyle = isNearMouse ? colors.nodeHover : colors.nodeFill;
          ctx.arc(p.x, p.y, isNearMouse ? 2.5 : 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  /**
   * Animation tick
   */
  function tick() {
    if (!isRunning) return;

    if (!isReducedMotion) {
      updatePoints();
      render();
      animationFrameId = requestAnimationFrame(tick);
    } else {
      // Static render for reduced motion preference
      render();
    }
  }

  // Window events & listeners
  let resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 150);
  }, { passive: true });

  window.addEventListener('mousemove', function (e) {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.active = true;
  }, { passive: true });

  window.addEventListener('mouseleave', function () {
    mouse.active = false;
  }, { passive: true });

  window.addEventListener('scroll', function () {
    targetScrollY = window.scrollY;
  }, { passive: true });

  // Tab visibility: pause canvas when tab is hidden to conserve power
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    } else {
      isRunning = true;
      tick();
    }
  });

  // Watch for theme attribute changes on <html>
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.attributeName === 'data-theme') {
        currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        if (isReducedMotion) render();
      }
    });
  });

  observer.observe(document.documentElement, { attributes: true });

  // Initial setup
  resizeCanvas();
  tick();
})();
