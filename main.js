function initStarfield() {
  const canvas = document.querySelector('.starfield');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, stars, placedConstellations, animId;

  function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  // Real constellation data — normalized (0–1) star positions + line pairs
  const CONSTELLATIONS = [
    {
      name: 'orion',
      stars: [
        [0.25, 0.00], // Betelgeuse
        [0.75, 0.05], // Bellatrix
        [0.40, 0.45], // Alnitak
        [0.50, 0.47], // Alnilam
        [0.60, 0.45], // Mintaka
        [0.20, 0.95], // Saiph
        [0.80, 0.90], // Rigel
      ],
      lines: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]],
    },
    {
      name: 'bigDipper',
      stars: [
        [0.00, 0.00], // Dubhe
        [0.15, 0.28], // Merak
        [0.48, 0.30], // Phecda
        [0.42, 0.05], // Megrez
        [0.62, 0.00], // Alioth
        [0.80, 0.10], // Mizar
        [1.00, 0.22], // Alkaid
      ],
      lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
    },
    {
      name: 'cassiopeia',
      stars: [
        [0.00, 0.50], // Schedar
        [0.25, 0.00], // Caph
        [0.50, 0.40], // Gamma
        [0.75, 0.00], // Ruchbah
        [1.00, 0.50], // Segin
      ],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
    },
    {
      name: 'cygnus',
      stars: [
        [0.50, 0.00], // Deneb
        [0.50, 0.40], // Sadr
        [0.50, 1.00], // Albireo
        [0.00, 0.45], // Gienah
        [1.00, 0.45], // Delta Cygni
      ],
      lines: [[0, 1], [1, 2], [3, 1], [1, 4]],
    },
    {
      name: 'leo',
      stars: [
        [0.00, 0.65], // Regulus
        [0.10, 0.35], // Eta Leonis
        [0.22, 0.08], // Algieba
        [0.38, 0.00], // Zosma
        [0.42, 0.18], // Mu Leonis
        [0.48, 0.38], // Epsilon Leonis
        [1.00, 0.32], // Denebola
      ],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [5, 6]],
    },
  ];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createStars() {
    const area = width * height;
    const bgCount = Math.min(200, Math.max(80, Math.floor(area / 8000)));
    stars = [];
    placedConstellations = [];

    // Background stars
    for (let i = 0; i < bgCount; i++) {
      const isBright = Math.random() < 0.08;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: isBright ? Math.random() * 1.2 + 1.5 : Math.random() * 0.8 + 0.3,
        baseAlpha: isBright ? Math.random() * 0.3 + 0.7 : Math.random() * 0.4 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.0008 + 0.0003,
        bright: isBright,
      });
    }

    // Pick and place real constellations
    const shuffled = [...CONSTELLATIONS].sort(() => Math.random() - 0.5);
    const count = width < 600 ? 2 : width < 1200 ? 3 : 4;
    const picks = shuffled.slice(0, count);
    const regions = [];

    for (const data of picks) {
      const scale = Math.max(80, width * (0.08 + Math.random() * 0.06));
      const padding = 50;

      // Find a position that doesn't overlap other constellations
      let ox, oy, valid;
      let attempts = 0;
      do {
        ox = padding + Math.random() * (width - scale - padding * 2);
        oy = padding + Math.random() * (height - scale - padding * 2);
        valid = regions.every(function (r) {
          var dx = ox - r.x;
          var dy = oy - r.y;
          return Math.sqrt(dx * dx + dy * dy) > scale + r.scale + 80;
        });
        attempts++;
      } while (!valid && attempts < 30);

      if (!valid) continue;
      regions.push({ x: ox, y: oy, scale: scale });

      // Slight random rotation for natural look
      const angle = (Math.random() - 0.5) * 0.4;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const cStars = data.stars.map(function (pos) {
        // Rotate around normalized center (0.5, 0.5)
        const rx = cos * (pos[0] - 0.5) - sin * (pos[1] - 0.5) + 0.5;
        const ry = sin * (pos[0] - 0.5) + cos * (pos[1] - 0.5) + 0.5;

        const star = {
          x: ox + rx * scale,
          y: oy + ry * scale,
          r: Math.random() * 0.5 + 1.3,
          baseAlpha: Math.random() * 0.15 + 0.7,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.0008 + 0.0003,
          bright: true,
        };
        stars.push(star);
        return star;
      });

      placedConstellations.push({ stars: cStars, lines: data.lines });
    }
  }

  // --- Sun motes for light theme (commented out) ---
  /*
  const MOTE_COLORS = [
    { r: 255, g: 200, b: 60 },
    { r: 255, g: 180, b: 40 },
    { r: 255, g: 220, b: 100 },
    { r: 240, g: 170, b: 50 },
    { r: 255, g: 230, b: 150 },
  ];

  function createClouds() {
    const area = width * height;
    const count = Math.min(100, Math.max(40, Math.floor(area / 15000)));
    motes = [];
    for (let i = 0; i < count; i++) {
      const color = MOTE_COLORS[Math.floor(Math.random() * MOTE_COLORS.length)];
      motes.push({
        x: Math.random() * width, y: Math.random() * height,
        r: Math.random() * 3 + 1.5, baseAlpha: Math.random() * 0.4 + 0.3,
        phase: Math.random() * Math.PI * 2, speed: Math.random() * 0.0004 + 0.0002,
        driftX: (Math.random() - 0.5) * 0.15, driftY: -(Math.random() * 0.12 + 0.03),
        color: color,
      });
    }
  }

  function drawClouds(time) {
    ctx.clearRect(0, 0, width, height);
    for (const m of motes) {
      m.x += m.driftX; m.y += m.driftY;
      if (m.y < -10) m.y = height + 10;
      if (m.x < -10) m.x = width + 10;
      if (m.x > width + 10) m.x = -10;
      const pulse = 0.5 + 0.5 * Math.sin(time * m.speed + m.phase);
      const alpha = m.baseAlpha * pulse;
      const c = m.color;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r + 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (alpha * 0.1) + ')'; ctx.fill();
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (alpha * 0.25) + ')'; ctx.fill();
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')'; ctx.fill();
    }
  }
  */

  // --- Drifting clouds for light theme ---
  let clouds = [];

  // Cloud silhouette templates: each is an array of bumps along the top.
  // Each bump is { cx, cy, r } normalized so the cloud spans roughly -1 to 1 on x.
  // The path traces arcs across the top, then closes with a flat bottom.
  const CLOUD_TEMPLATES = [
    // Classic cumulus
    { bumps: [
      { cx: -0.85, cy: -0.1, r: 0.35 },
      { cx: -0.4,  cy: -0.35, r: 0.4  },
      { cx:  0.1,  cy: -0.5, r: 0.45 },
      { cx:  0.55, cy: -0.3, r: 0.38 },
      { cx:  0.9,  cy: -0.1, r: 0.3  },
    ]},
    // Wide and flat
    { bumps: [
      { cx: -1.0,  cy: -0.08, r: 0.3  },
      { cx: -0.55, cy: -0.2,  r: 0.35 },
      { cx: -0.05, cy: -0.28, r: 0.35 },
      { cx:  0.45, cy: -0.22, r: 0.33 },
      { cx:  0.9,  cy: -0.1,  r: 0.28 },
      { cx:  1.2,  cy: -0.05, r: 0.22 },
    ]},
    // Tall cumulus
    { bumps: [
      { cx: -0.7,  cy: -0.15, r: 0.35 },
      { cx: -0.2,  cy: -0.45, r: 0.4  },
      { cx:  0.2,  cy: -0.6,  r: 0.38 },
      { cx:  0.6,  cy: -0.3,  r: 0.35 },
      { cx:  0.85, cy: -0.1,  r: 0.28 },
    ]},
    // Small puff
    { bumps: [
      { cx: -0.5,  cy: -0.1,  r: 0.32 },
      { cx:  0.0,  cy: -0.35, r: 0.4  },
      { cx:  0.45, cy: -0.12, r: 0.3  },
    ]},
  ];

  function createClouds() {
    const count = width < 600 ? 8 : width < 1200 ? 12 : 16;
    clouds = [];

    for (let i = 0; i < count; i++) {
      const scale = Math.random() * 60 + 70; // 70–130px
      const template = CLOUD_TEMPLATES[Math.floor(Math.random() * CLOUD_TEMPLATES.length)];

      // Bake bump positions with slight jitter
      const bumps = template.bumps.map(function (b) {
        return {
          cx: (b.cx + (Math.random() - 0.5) * 0.06) * scale,
          cy: (b.cy + (Math.random() - 0.5) * 0.04) * scale,
          r:  (b.r  + (Math.random() - 0.5) * 0.04) * scale,
        };
      });

      clouds.push({
        x: Math.random() * (width + 400) - 200,
        y: Math.random() * height * 0.5 + height * 0.03,
        scale: scale,
        bumps: bumps,
        baseAlpha: Math.random() * 0.1 + 0.25,
        driftX: Math.random() * 0.12 + 0.04,
        phase: Math.random() * Math.PI * 2,
        bobSpeed: Math.random() * 0.0003 + 0.0001,
      });
    }
  }

  function drawCloudShape(cx, cy, bumps, alpha) {
    if (bumps.length === 0) return;

    ctx.beginPath();

    // Find the leftmost and rightmost extent for the flat base
    var left = Infinity, right = -Infinity;
    for (var i = 0; i < bumps.length; i++) {
      var b = bumps[i];
      if (b.cx - b.r < left) left = b.cx - b.r;
      if (b.cx + b.r > right) right = b.cx + b.r;
    }

    // Start at bottom-right
    ctx.moveTo(cx + right, cy);

    // Flat bottom from right to left
    ctx.lineTo(cx + left, cy);

    // Trace arcs across the top (left to right)
    for (var i = 0; i < bumps.length; i++) {
      var b = bumps[i];
      // Arc from ~bottom-left of bump, over the top, to ~bottom-right
      ctx.arc(cx + b.cx, cy + b.cy, b.r, Math.PI, 0, false);
    }

    ctx.closePath();

    // Subtle drop shadow for depth
    ctx.save();
    ctx.shadowColor = 'rgba(100, 140, 180, ' + (alpha * 0.4) + ')';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = 'rgba(200, 220, 240, ' + alpha + ')';
    ctx.fill();
    ctx.restore();
  }

  function getSunPosition() {
    var now = new Date();
    var hours = now.getHours() + now.getMinutes() / 60;

    // Map daytime hours (6am–7pm) to 0–1
    var t = (hours - 6) / 13;
    t = Math.max(0, Math.min(1, t));

    // x: arcs from left (0.1) to right (0.9)
    var x = 0.1 + t * 0.8;

    // y: parabolic arc — highest at noon (t=0.5), lower at sunrise/sunset
    var minY = 0.08;
    var maxY = 0.35;
    var y = 4 * (maxY - minY) * (t - 0.5) * (t - 0.5) + minY;

    return { x: x, y: y };
  }

  function drawSun() {
    var pos = getSunPosition();
    var sx = width * pos.x;
    var sy = height * pos.y;
    var r = Math.min(width, height) * 0.05;

    // Outer halo
    var halo = ctx.createRadialGradient(sx, sy, r * 0.5, sx, sy, r * 6);
    halo.addColorStop(0, 'rgba(255, 220, 100, 0.12)');
    halo.addColorStop(0.5, 'rgba(255, 200, 60, 0.05)');
    halo.addColorStop(1, 'rgba(255, 200, 60, 0)');
    ctx.beginPath();
    ctx.arc(sx, sy, r * 6, 0, Math.PI * 2);
    ctx.fillStyle = halo;
    ctx.fill();

    // Inner glow
    var glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2);
    glow.addColorStop(0, 'rgba(255, 230, 140, 0.28)');
    glow.addColorStop(0.6, 'rgba(255, 210, 80, 0.12)');
    glow.addColorStop(1, 'rgba(255, 200, 60, 0)');
    ctx.beginPath();
    ctx.arc(sx, sy, r * 2, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Core disc
    var core = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    core.addColorStop(0, 'rgba(255, 235, 160, 0.5)');
    core.addColorStop(0.7, 'rgba(255, 220, 100, 0.3)');
    core.addColorStop(1, 'rgba(255, 210, 80, 0)');
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.fill();
  }

  function drawSkyGradient() {
    var grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0,   'rgba(120, 180, 230, 0.5)');
    grad.addColorStop(0.25,'rgba(140, 200, 240, 0.35)');
    grad.addColorStop(0.5, 'rgba(165, 215, 245, 0.22)');
    grad.addColorStop(0.75,'rgba(190, 225, 248, 0.12)');
    grad.addColorStop(0.92,'rgba(210, 235, 250, 0.05)');
    grad.addColorStop(1,   'rgba(230, 242, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  function drawClouds(time) {
    ctx.clearRect(0, 0, width, height);

    drawSkyGradient();
    drawSun();

    for (const cloud of clouds) {
      cloud.x += cloud.driftX;

      // Wrap around
      var extent = cloud.scale * 1.5;
      if (cloud.x - extent > width + 200) {
        cloud.x = -extent - 200;
      }

      var bob = Math.sin(time * cloud.bobSpeed + cloud.phase) * 3;
      drawCloudShape(cloud.x, cloud.y + bob, cloud.bumps, cloud.baseAlpha);
    }
  }

  function drawStars(time) {
    ctx.clearRect(0, 0, width, height);

    // Constellation lines
    for (const c of placedConstellations) {
      for (const pair of c.lines) {
        const s1 = c.stars[pair[0]];
        const s2 = c.stars[pair[1]];
        const t1 = 0.6 + 0.4 * Math.sin(time * s1.speed + s1.phase);
        const t2 = 0.6 + 0.4 * Math.sin(time * s2.speed + s2.phase);
        const alpha = Math.min(s1.baseAlpha * t1, s2.baseAlpha * t2) * 0.25;
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.strokeStyle = 'rgba(200,220,255,' + alpha + ')';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }

    // All stars (background + constellation)
    for (const s of stars) {
      const twinkle = 0.6 + 0.4 * Math.sin(time * s.speed + s.phase);
      const alpha = s.baseAlpha * twinkle;

      // Glow on bright stars
      if (s.bright) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r + 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200,220,255,' + (alpha * 0.15) + ')';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.fill();
    }
  }

  function step(time) {
    if (isLightTheme()) {
      drawClouds(time);
    } else {
      drawStars(time);
    }
    animId = requestAnimationFrame(step);
  }

  function init() {
    resize();
    createStars();
    createClouds();

    if (reducedMotion) {
      if (isLightTheme()) {
        drawClouds(0);
      } else {
        drawStars(0);
      }
    } else {
      step(0);
    }
  }

  init();

  window.addEventListener('resize', function () {
    resize();
    createStars();
    createClouds();
    if (reducedMotion) {
      if (isLightTheme()) {
        drawClouds(0);
      } else {
        drawStars(0);
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initStarfield();

  // Navbar scroll effect — transparent over hero, solid after
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    var onScroll = function () {
      navbar.classList.toggle('navbar--scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Scroll animations via IntersectionObserver
  var fadeElements = document.querySelectorAll('.fade-in');

  if (fadeElements.length > 0) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    fadeElements.forEach(function (el) { observer.observe(el); });
  }

  // Mobile nav toggle
  var navToggle = document.querySelector('.navbar__toggle');
  var navMenu = document.querySelector('.navbar__links');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      var isOpen = navMenu.classList.toggle('navbar__links--open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navMenu.querySelectorAll('.navbar__link').forEach(function (link) {
      link.addEventListener('click', function () {
        navMenu.classList.remove('navbar__links--open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Active nav link highlighting on scroll
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.navbar__link');

  if (sections.length > 0 && navLinks.length > 0) {
    var highlightNav = function () {
      var scrollPos = window.scrollY + 120;

      sections.forEach(function (section) {
        var top = section.offsetTop;
        var h = section.offsetHeight;
        var id = section.getAttribute('id');

        if (scrollPos >= top && scrollPos < top + h) {
          navLinks.forEach(function (link) {
            link.classList.remove('navbar__link--active');
            if (link.getAttribute('href') === '#' + id) {
              link.classList.add('navbar__link--active');
            }
          });
        }
      });
    };

    window.addEventListener('scroll', highlightNav, { passive: true });
    highlightNav();
  }
});
