// ===== THREE.JS 3D PARTICLE BACKGROUND =====
(function initThreeJS() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Helper to create a circular glow texture
  function createCircleTexture() {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }

  // Floating particles
  const particleCount = 400; // slightly reduced for elegance
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const speeds = new Float32Array(particleCount);

  const palette = [
    [0.506, 0.549, 0.973],  // indigo
    [0.753, 0.518, 0.988],  // purple
    [0.133, 0.827, 0.933],  // cyan
  ];

  for (let i = 0; i < particleCount; i++) {
    // Keep particles pushed further back from camera (z between -40 and -5)
    positions[i * 3] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 35 - 10;

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];

    sizes[i] = Math.random() * 2 + 0.5;
    speeds[i] = Math.random() * 0.4 + 0.08;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const isDarkInitial = document.documentElement.getAttribute('data-theme') === 'dark';

  const particleMat = new THREE.PointsMaterial({
    size: 0.6, // Smaller and elegant
    map: createCircleTexture(),
    vertexColors: true,
    transparent: true,
    opacity: isDarkInitial ? 0.4 : 0.35,
    blending: isDarkInitial ? THREE.AdditiveBlending : THREE.NormalBlending,
    sizeAttenuation: true,
    depthWrite: false, // Prevents dark bounding boxes
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // Connection lines between nearby particles
  const lineGeo = new THREE.BufferGeometry();
  const maxLines = 150; // reduced for less clutter
  const linePositions = new Float32Array(maxLines * 6);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: isDarkInitial ? 0x818cf8 : 0x4f46e5,
    transparent: true,
    opacity: isDarkInitial ? 0.05 : 0.12,
    blending: isDarkInitial ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lines);

  // Floating 3D wireframe shapes
  const shapes = [];
  const shapeGeo = [
    new THREE.IcosahedronGeometry(0.6, 0),
    new THREE.OctahedronGeometry(0.5, 0),
    new THREE.TetrahedronGeometry(0.5, 0),
  ];
  const shapeMat = new THREE.MeshBasicMaterial({
    color: isDarkInitial ? 0x818cf8 : 0x4f46e5,
    wireframe: true,
    transparent: true,
    opacity: isDarkInitial ? 0.08 : 0.14,
  });

  // Dynamic theme switching for Three.js backdrop
  window.addEventListener('themechange', (e) => {
    const isDark = e.detail && e.detail.theme === 'dark';
    particleMat.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;
    particleMat.opacity = isDark ? 0.4 : 0.35;
    particleMat.needsUpdate = true;

    lineMat.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;
    lineMat.color.setHex(isDark ? 0x818cf8 : 0x4f46e5);
    lineMat.opacity = isDark ? 0.05 : 0.12;
    lineMat.needsUpdate = true;

    shapes.forEach(mesh => {
      mesh.material.color.setHex(isDark ? 0x818cf8 : 0x4f46e5);
      mesh.material.opacity = isDark ? 0.08 : 0.14;
      mesh.material.needsUpdate = true;
    });
  });

  for (let i = 0; i < 6; i++) {
    const geo = shapeGeo[Math.floor(Math.random() * shapeGeo.length)];
    const mesh = new THREE.Mesh(geo, shapeMat.clone());
    mesh.position.set(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20 - 15 // push back
    );
    mesh.userData = {
      rotSpeed: { x: Math.random() * 0.005, y: Math.random() * 0.005, z: Math.random() * 0.002 },
      floatSpeed: Math.random() * 0.002 + 0.001,
      floatOffset: Math.random() * Math.PI * 2,
    };
    scene.add(mesh);
    shapes.push(mesh);
  }

  camera.position.z = 15;

  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  let scrollY = 0;
  window.addEventListener('scroll', () => {
    scrollY = window.pageYOffset;
  });

  function updateLines() {
    const pos = particleGeo.attributes.position.array;
    let lineIdx = 0;
    const threshold = 5;

    for (let i = 0; i < particleCount && lineIdx < maxLines; i++) {
      for (let j = i + 1; j < particleCount && lineIdx < maxLines; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < threshold) {
          linePositions[lineIdx * 6] = pos[i * 3];
          linePositions[lineIdx * 6 + 1] = pos[i * 3 + 1];
          linePositions[lineIdx * 6 + 2] = pos[i * 3 + 2];
          linePositions[lineIdx * 6 + 3] = pos[j * 3];
          linePositions[lineIdx * 6 + 4] = pos[j * 3 + 1];
          linePositions[lineIdx * 6 + 5] = pos[j * 3 + 2];
          lineIdx++;
        }
      }
    }

    for (let i = lineIdx; i < maxLines; i++) {
      linePositions[i * 6] = 0;
      linePositions[i * 6 + 1] = 0;
      linePositions[i * 6 + 2] = 0;
      linePositions[i * 6 + 3] = 0;
      linePositions[i * 6 + 4] = 0;
      linePositions[i * 6 + 5] = 0;
    }

    lineGeo.attributes.position.needsUpdate = true;
  }

  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    frame++;

    const pos = particleGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 1] += speeds[i] * 0.008;
      pos[i * 3] += Math.sin(frame * 0.002 + i) * 0.003;
      if (pos[i * 3 + 1] > 20) pos[i * 3 + 1] = -20;
    }
    particleGeo.attributes.position.needsUpdate = true;

    if (frame % 5 === 0) updateLines();

    shapes.forEach((s) => {
      s.rotation.x += s.userData.rotSpeed.x;
      s.rotation.y += s.userData.rotSpeed.y;
      s.rotation.z += s.userData.rotSpeed.z;
      s.position.y += Math.sin(frame * s.userData.floatSpeed + s.userData.floatOffset) * 0.005;
    });

    // Camera follows mouse subtly
    camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 1.0 - camera.position.y) * 0.02;

    // Parallax on scroll
    particles.rotation.y = scrollY * 0.0001;
    particles.position.y = -scrollY * 0.002;

    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();


// ===== TERMINAL TYPING EFFECT =====
(function initTerminal() {
  const el = document.getElementById('terminalText');
  if (!el) return;

  const commands = [
    'pip install fastapi uvicorn langchain pgvector',
    'pip install pyspark redis scrapy beautifulsoup4',
    'n8n start --tunnel && docker run -d -p 6379:6379 redis',
    'npm install @nestjs/core @supabase/supabase-js',
    'docker compose up -d postgres supabase mongodb redis',
    'gcloud run deploy rag-service --platform managed',
    'python -m pytest tests/ --cov=98.5%',
    'git push origin main'
  ];

  let cmdIdx = 0, charIdx = 0, isDeleting = false;

  function type() {
    const cmd = commands[cmdIdx];
    if (!isDeleting) {
      el.textContent = cmd.substring(0, charIdx++);
      if (charIdx > cmd.length) {
        isDeleting = true;
        setTimeout(type, 2000);
        return;
      }
      setTimeout(type, 60 + Math.random() * 40);
    } else {
      el.textContent = cmd.substring(0, charIdx--);
      if (charIdx < 0) {
        isDeleting = false;
        cmdIdx = (cmdIdx + 1) % commands.length;
        charIdx = 0;
        setTimeout(type, 500);
        return;
      }
      setTimeout(type, 30);
    }
  }

  setTimeout(type, 1000);
})();


// ===== SCROLL PROGRESS BAR =====
function updateScrollProgress() {
  const scrollTop = window.pageYOffset;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = (scrollTop / docHeight) * 100;
  const bar = document.getElementById('scrollProgress');
  if (bar) bar.style.width = progress + '%';
}
window.addEventListener('scroll', updateScrollProgress);


// ===== SIDE NAV ACTIVE TRACKING =====
(function initSideNav() {
  const links = document.querySelectorAll('.side-nav-link');
  const sections = document.querySelectorAll('section[id]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        links.forEach((l) => l.classList.remove('active'));
        const active = document.querySelector(`.side-nav-link[data-section="${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.3 });

  sections.forEach((s) => observer.observe(s));
})();


// ===== SCROLL REVEAL =====
(function initReveal() {
  // Add .reveal to all elements that should animate in
  const targets = document.querySelectorAll(
    '.glass-card, .section-header, .contact-subtitle, .hero-terminal'
  );
  targets.forEach((el) => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
})();


// ===== SKILL BAR ANIMATION =====
(function initSkillBars() {
  const fills = document.querySelectorAll('.skill-fill');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const w = entry.target.getAttribute('data-width');
        entry.target.style.width = w + '%';
      }
    });
  }, { threshold: 0.5 });

  fills.forEach((f) => observer.observe(f));
})();


// ===== STAT COUNTER ANIMATION =====
(function initCounters() {
  const counters = document.querySelectorAll('.stat-number');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'));
        let current = 0;
        const step = Math.max(1, Math.floor(target / 30));
        const interval = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(interval); }
          el.textContent = current;
        }, 50);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach((c) => observer.observe(c));
})();


// ===== MOBILE NAV TOGGLE =====
(function initMobileNav() {
  const toggle = document.getElementById('mobileNavToggle');
  const nav = document.getElementById('navLinks');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('active');
    toggle.classList.toggle('active');
  });

  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      nav.classList.remove('active');
      toggle.classList.remove('active');
    });
  });
})();


// ===== TILT EFFECT ON CARDS =====
(function initTilt() {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();


// ===== HEADER SHRINK ON SCROLL & THEME ADAPTATION =====
(function initHeader() {
  const header = document.getElementById('main-header');
  if (!header) return;

  const updateHeaderBg = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (window.scrollY > 50) {
      header.style.background = isDark ? 'rgba(10,10,15,0.95)' : 'rgba(255,255,255,0.96)';
    } else {
      header.style.background = isDark ? 'rgba(10,10,15,0.8)' : 'rgba(255,255,255,0.85)';
    }
  };

  window.addEventListener('scroll', updateHeaderBg, { passive: true });
  window.addEventListener('themechange', updateHeaderBg);
  updateHeaderBg();
})();

// ===== COPY TO CLIPBOARD =====
(function initCopyToClipboard() {
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (!textToCopy) return;
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = 'fas fa-check';
          icon.style.color = '#10b981'; // Green color for success
          setTimeout(() => {
            icon.className = 'far fa-copy';
            icon.style.color = '';
          }, 2000);
        }
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    });
  });
})();

// ===== GSAP SCROLLTRIGGER FEATURED PROJECTS STACKING =====
(function initProjectDrawers() {
  const navBtns = document.querySelectorAll('.drawer-nav-btn');
  const dotBtns = document.querySelectorAll('.proj-dot');
  const drawers = document.querySelectorAll('.project-drawer');
  const progressDots = document.getElementById('projectsProgressDots');
  if (!drawers.length) return;

  // High-speed, responsive smooth scroll helper (replaces sluggish browser scrollIntoView)
  function fastJumpToDrawer(targetEl) {
    if (!targetEl) return;
    const headerHeight = 85;
    const targetY = Math.max(0, targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight);
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    if (Math.abs(distance) < 5) return;

    // Fast snappy timing: 240ms - 380ms with exponential ease-out
    const duration = Math.min(Math.max(Math.abs(distance) * 0.15, 240), 380);
    const startTime = performance.now();

    function animateScroll(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out exponential for instantaneous response and crisp stop
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      window.scrollTo(0, startY + distance * ease);
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    }
    requestAnimationFrame(animateScroll);
  }

  // Click navigation for top quick-jump buttons — fast & snappy
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-drawer');
      const targetDrawer = document.getElementById(targetId);
      if (targetDrawer) {
        fastJumpToDrawer(targetDrawer);
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });

  // Click navigation for vertical dot buttons — fast & snappy
  dotBtns.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = dot.getAttribute('data-drawer');
      const targetDrawer = document.getElementById(targetId);
      if (targetDrawer) {
        fastJumpToDrawer(targetDrawer);
      }
    });
  });

  // Setup GSAP ScrollTrigger scrub
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Stacking card scale & dim effect: strictly for desktop viewports (> 1080px)
    // where drawers use position: sticky stacking. Fast scrub range.
    ScrollTrigger.matchMedia({
      "(min-width: 1081px)": function () {
        drawers.forEach((drawer, i) => {
          if (i < drawers.length - 1) {
            const nextDrawer = drawers[i + 1];
            const inner = drawer.querySelector('.drawer-inner') || drawer;

            gsap.to(inner, {
              scale: 0.96,
              transformOrigin: 'center top',
              ease: 'power2.out',
              scrollTrigger: {
                trigger: nextDrawer,
                start: 'top 65%',
                end: 'top 25%',
                scrub: 0.1,
                invalidateOnRefresh: true,
              }
            });
          }
        });
      },
      "(max-width: 1080px)": function () {
        // Clean reset for mobile & tablet screens
        drawers.forEach((drawer) => {
          const inner = drawer.querySelector('.drawer-inner') || drawer;
          gsap.set(inner, { clearProps: 'transform,opacity,filter' });
        });
      }
    });

    // Toggle visibility of right-side progress indicator inside #projects
    ScrollTrigger.create({
      trigger: '#projects',
      start: 'top 60%',
      end: 'bottom 40%',
      onToggle: (self) => {
        if (progressDots) {
          if (self.isActive) progressDots.classList.add('visible');
          else progressDots.classList.remove('visible');
        }
      }
    });

    // Synchronize active indicators with scroll position
    drawers.forEach((drawer) => {
      ScrollTrigger.create({
        trigger: drawer,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => {
          if (self.isActive) {
            const activeId = drawer.getAttribute('id');
            navBtns.forEach(btn => {
              if (btn.getAttribute('data-drawer') === activeId) btn.classList.add('active');
              else btn.classList.remove('active');
            });
            dotBtns.forEach(dot => {
              if (dot.getAttribute('data-drawer') === activeId) dot.classList.add('active');
              else dot.classList.remove('active');
            });
          }
        }
      });
    });

    window.addEventListener('load', () => ScrollTrigger.refresh());
  } else {
    // Pure fallback if GSAP is unavailable
    function updateActiveDrawer() {
      let activeId = '';
      for (let i = drawers.length - 1; i >= 0; i--) {
        const drawer = drawers[i];
        const rect = drawer.getBoundingClientRect();
        if (rect.top <= 260 && rect.bottom > 180) {
          activeId = drawer.getAttribute('id');
          break;
        }
      }
      if (activeId) {
        navBtns.forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-drawer') === activeId);
        });
        dotBtns.forEach(dot => {
          dot.classList.toggle('active', dot.getAttribute('data-drawer') === activeId);
        });
      }
    }
    window.addEventListener('scroll', updateActiveDrawer, { passive: true });
    updateActiveDrawer();
  }

  // SocialEngage AI platform preview switcher
  const platformTabs = document.querySelectorAll('.plat-tab');
  const previewText = document.getElementById('socialengage-preview-text');
  
  const platformResponses = {
    linkedin: '"Insightful breakdown on SaaS retention metrics! The distinction between onboarding velocity and expansion revenue is crucial for enterprise scale."',
    twitter: '"Spot on! Scaling past $1M ARR is 80% customer retention and 20% rapid product iteration. Great thread 🧵🚀"',
    youtube: '"Exceptional breakdown! Timestamp 04:15 on RAG chunking latency strategies answered exactly what we were debugging in prod."'
  };

  if (platformTabs.length && previewText) {
    platformTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        platformTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const platform = tab.getAttribute('data-platform');
        if (platformResponses[platform]) {
          previewText.style.opacity = '0';
          setTimeout(() => {
            previewText.textContent = platformResponses[platform];
            previewText.style.opacity = '1';
          }, 150);
        }
      });
    });
    previewText.style.transition = 'opacity 0.2s ease';
  }

  // ===== VIVID MOTION 3D PERSPECTIVE TILT =====
  const perspectiveCards = document.querySelectorAll('.vivid-perspective-card');
  perspectiveCards.forEach(card => {
    let ticking = false;

    const onMouseMove = (e) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        card.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
        ticking = false;
      });
    };

    const onMouseLeave = () => {
      card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    };

    card.addEventListener('mousemove', onMouseMove);
    card.addEventListener('mouseleave', onMouseLeave);
  });

  // ===== VIVID MOTION WHOLE-SCREEN WINDOW LIGHTBOX CONTROLLER =====
  const lightboxModal = document.getElementById('projectLightboxModal');
  const lightboxWindowContainer = document.getElementById('lightboxWindowContainer');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const trafficCloseBtn = document.getElementById('trafficCloseBtn');
  const trafficResetBtn = document.getElementById('trafficResetBtn');
  const trafficFsBtn = document.getElementById('trafficFsBtn');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCanvasWrap = document.getElementById('lightboxCanvasWrap');
  const lightboxBody = document.getElementById('lightboxBody');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxBadge = document.getElementById('lightboxBadge');
  const lightboxTechTags = document.getElementById('lightboxTechTags');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxLiveDemoBtn = document.getElementById('lightboxLiveDemoBtn');
  const btnViewShowcase = document.getElementById('btnViewShowcase');
  const btnViewLive = document.getElementById('btnViewLive');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomResetBtn = document.getElementById('zoomResetBtn');
  const zoomFitBtn = document.getElementById('zoomFitBtn');
  const zoomLevelText = document.getElementById('zoomLevelText');
  const lightboxNativeFsBtn = document.getElementById('lightboxNativeFsBtn');
  const lightboxPrevBtn = document.getElementById('lightboxPrevBtn');
  const lightboxNextBtn = document.getElementById('lightboxNextBtn');

  // Multi-project dataset extracted from preview containers
  const previewContainers = Array.from(document.querySelectorAll('.preview-image-container'));
  const projectsData = previewContainers.map((container, idx) => {
    return {
      index: parseInt(container.getAttribute('data-project-idx') || idx, 10),
      imgSrc: container.getAttribute('data-full-img') || '',
      showcaseUrl: container.getAttribute('data-showcase') || container.getAttribute('data-full-img') || '',
      liveUrl: container.getAttribute('data-live') || '',
      title: container.getAttribute('data-title') || 'Project Interface',
      badge: container.getAttribute('data-badge') || `PROJECT 0${idx + 1} / 06`,
      tags: container.getAttribute('data-tags') || '',
      demoUrl: container.getAttribute('data-demo') || '#',
      caption: container.getAttribute('data-caption') || 'Interactive Project Showcase'
    };
  });

  let currentProjectIdx = 0;
  let currentViewMode = 'showcase';
  let zoomLevel = 1.0;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panOriginX = 0;
  let panOriginY = 0;

  function updateTransform() {
    if (!lightboxImg) return;
    lightboxImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    if (zoomLevelText) {
      zoomLevelText.textContent = `${Math.round(zoomLevel * 100)}%`;
    }
    if (lightboxCanvasWrap) {
      if (zoomLevel > 1.05) {
        lightboxCanvasWrap.classList.add('is-zoomed');
      } else {
        lightboxCanvasWrap.classList.remove('is-zoomed');
      }
    }
  }

  function setZoom(val, resetPan = false) {
    zoomLevel = Math.max(0.5, Math.min(3.0, val));
    if (resetPan || zoomLevel <= 1.05) {
      panX = 0;
      panY = 0;
    }
    updateTransform();
  }

  function resetZoom() {
    setZoom(1.0, true);
  }

  function fitZoom() {
    setZoom(1.0, true);
  }

  function zoomIn() {
    setZoom(zoomLevel * 1.25);
  }

  function zoomOut() {
    setZoom(zoomLevel / 1.25);
  }

  function renderCurrentProject() {
    if (!projectsData.length || !lightboxImg) return;
    const proj = projectsData[currentProjectIdx];
    if (!proj) return;

    if (lightboxTitle) lightboxTitle.textContent = proj.title;
    if (lightboxBadge) lightboxBadge.textContent = proj.badge;
    if (lightboxTechTags) {
      lightboxTechTags.textContent = proj.tags;
      lightboxTechTags.style.display = proj.tags ? 'inline' : 'none';
    }
    if (lightboxCaption) lightboxCaption.textContent = proj.caption;
    if (lightboxLiveDemoBtn) {
      lightboxLiveDemoBtn.href = proj.demoUrl;
      lightboxLiveDemoBtn.style.display = (proj.demoUrl && proj.demoUrl !== '#') ? 'inline-flex' : 'none';
    }

    if (btnViewLive) {
      btnViewLive.style.display = proj.liveUrl ? 'inline-flex' : 'none';
    }

    const targetUrl = (currentViewMode === 'live' && proj.liveUrl) ? proj.liveUrl : proj.showcaseUrl;
    lightboxImg.style.opacity = '0.35';
    lightboxImg.src = targetUrl;
    if (lightboxImg.complete) {
      lightboxImg.style.opacity = '1';
    } else {
      lightboxImg.onload = () => { lightboxImg.style.opacity = '1'; };
    }

    if (currentViewMode === 'live' && proj.liveUrl) {
      if (btnViewShowcase) btnViewShowcase.classList.remove('active');
      if (btnViewLive) btnViewLive.classList.add('active');
    } else {
      currentViewMode = 'showcase';
      if (btnViewShowcase) btnViewShowcase.classList.add('active');
      if (btnViewLive) btnViewLive.classList.remove('active');
    }

    resetZoom();
  }

  function setViewMode(mode) {
    const proj = projectsData[currentProjectIdx];
    if (mode === 'live' && proj && !proj.liveUrl) return;
    currentViewMode = mode;
    renderCurrentProject();
  }

  function prevProject() {
    if (!projectsData.length) return;
    currentProjectIdx = (currentProjectIdx - 1 + projectsData.length) % projectsData.length;
    renderCurrentProject();
  }

  function nextProject() {
    if (!projectsData.length) return;
    currentProjectIdx = (currentProjectIdx + 1) % projectsData.length;
    renderCurrentProject();
  }

  function openLightboxWindow(index = 0) {
    if (!lightboxModal) return;
    currentProjectIdx = Math.max(0, Math.min(projectsData.length - 1, index));
    currentViewMode = 'showcase';
    renderCurrentProject();
    lightboxModal.classList.add('active');
    lightboxModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightboxWindow() {
    if (!lightboxModal) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    lightboxModal.classList.remove('active');
    lightboxModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    resetZoom();
  }

  function toggleNativeFullscreen() {
    const target = lightboxModal;
    if (!target) return;
    if (!document.fullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen();
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      } else if (target.msRequestFullscreen) {
        target.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  document.addEventListener('fullscreenchange', () => {
    const isFs = Boolean(document.fullscreenElement);
    if (lightboxWindowContainer) {
      lightboxWindowContainer.classList.toggle('is-native-fullscreen', isFs);
    }
    if (lightboxNativeFsBtn) {
      const label = lightboxNativeFsBtn.querySelector('.action-btn-label');
      const icon = lightboxNativeFsBtn.querySelector('i');
      if (isFs) {
        if (label) label.textContent = 'Exit';
        if (icon) icon.className = 'fas fa-compress';
      } else {
        if (label) label.textContent = 'Fullscreen';
        if (icon) icon.className = 'fas fa-expand';
      }
    }
  });

  previewContainers.forEach((container, idx) => {
    const handleOpen = (e) => {
      if (e.target.closest('.overlay-demo-btn')) return;
      e.preventDefault();
      e.stopPropagation();
      openLightboxWindow(idx);
    };

    container.addEventListener('click', handleOpen);
    const zoomBtns = container.querySelectorAll('.overlay-zoom-btn, .overlay-fullscreen-btn');
    zoomBtns.forEach(btn => btn.addEventListener('click', handleOpen));
  });

  if (btnViewShowcase) btnViewShowcase.addEventListener('click', (e) => { e.stopPropagation(); setViewMode('showcase'); });
  if (btnViewLive) btnViewLive.addEventListener('click', (e) => { e.stopPropagation(); setViewMode('live'); });
  if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevProject(); });
  if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextProject(); });

  if (zoomInBtn) zoomInBtn.addEventListener('click', (e) => { e.stopPropagation(); zoomIn(); });
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', (e) => { e.stopPropagation(); zoomOut(); });
  if (zoomResetBtn) zoomResetBtn.addEventListener('click', (e) => { e.stopPropagation(); resetZoom(); });
  if (zoomFitBtn) zoomFitBtn.addEventListener('click', (e) => { e.stopPropagation(); fitZoom(); });

  if (lightboxNativeFsBtn) lightboxNativeFsBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleNativeFullscreen(); });
  if (trafficFsBtn) trafficFsBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleNativeFullscreen(); });
  if (trafficResetBtn) trafficResetBtn.addEventListener('click', (e) => { e.stopPropagation(); resetZoom(); });
  if (trafficCloseBtn) trafficCloseBtn.addEventListener('click', (e) => { e.stopPropagation(); closeLightboxWindow(); });
  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightboxWindow);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightboxWindow);

  if (lightboxBody) {
    lightboxBody.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
      setZoom(zoomLevel * zoomFactor);
    }, { passive: false });
  }

  if (lightboxCanvasWrap) {
    const startDrag = (clientX, clientY) => {
      if (zoomLevel <= 1.05) return;
      isPanning = true;
      dragStartX = clientX;
      dragStartY = clientY;
      panOriginX = panX;
      panOriginY = panY;
      lightboxCanvasWrap.classList.add('is-dragging');
    };

    const doDrag = (clientX, clientY) => {
      if (!isPanning) return;
      panX = panOriginX + (clientX - dragStartX);
      panY = panOriginY + (clientY - dragStartY);
      updateTransform();
    };

    const endDrag = () => {
      if (!isPanning) return;
      isPanning = false;
      lightboxCanvasWrap.classList.remove('is-dragging');
    };

    lightboxCanvasWrap.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      startDrag(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      if (isPanning) doDrag(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', endDrag);

    lightboxCanvasWrap.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (isPanning && e.touches.length === 1) {
        doDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener('touchend', endDrag);
  }

  document.addEventListener('keydown', (e) => {
    if (!lightboxModal || !lightboxModal.classList.contains('active')) return;
    if (e.target && ['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return;

    if (e.key === 'Escape') {
      closeLightboxWindow();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleNativeFullscreen();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevProject();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextProject();
    } else if (e.key === '1') {
      e.preventDefault();
      setViewMode('showcase');
    } else if (e.key === '2') {
      e.preventDefault();
      setViewMode('live');
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomIn();
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      zoomOut();
    } else if (e.key === '0') {
      e.preventDefault();
      resetZoom();
    }
  });

  // Refresh ScrollTrigger when images finish loading to ensure pin accuracy
  const previewImgs = document.querySelectorAll('.project-preview-img');
  previewImgs.forEach(img => {
    if (img.complete) {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    } else {
      img.addEventListener('load', () => {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      });
    }
  });
})();

  // ===== 3D INTERACTIVE ROBOT COMPANION (BYTE) =====
  (function initRobotCompanion() {
    const canvas = document.getElementById('robotCanvas');
    const container = document.getElementById('robotCanvasWrap');
    const speechBubble = document.getElementById('robotSpeechBubble');
    const bubbleTitle = document.getElementById('bubbleTitle');
    const bubbleText = document.getElementById('bubbleText');
    const shakeBtn = document.getElementById('robotShakeBtn');
    const handHint = document.getElementById('robotHandHint');

    if (!canvas || !container) return;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.22, 4.8);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x818cf8, 1.4);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x22d3ee, 1.2);
    fillLight.position.set(-3, -1, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xc084fc, 1.0);
    rimLight.position.set(0, 4, -3);
    scene.add(rimLight);

    // Materials
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.85,
      roughness: 0.15
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.25
    });

    const accentCyanMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });

    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.95,
      roughness: 0.35
    });

    // Dynamic Visor Canvas for expressive LED eyes
    const eyeCanvas = document.createElement('canvas');
    eyeCanvas.width = 256;
    eyeCanvas.height = 128;
    const eyeCtx = eyeCanvas.getContext('2d');
    const eyeTexture = new THREE.CanvasTexture(eyeCanvas);

    let currentEyeMood = 'happy';

    function drawEyes(mood) {
      currentEyeMood = mood;
      eyeCtx.fillStyle = '#060913';
      eyeCtx.fillRect(0, 0, 256, 128);

      eyeCtx.lineWidth = 10;
      eyeCtx.lineCap = 'round';
      eyeCtx.strokeStyle = '#22d3ee';
      eyeCtx.shadowColor = '#22d3ee';
      eyeCtx.shadowBlur = 16;

      if (mood === 'happy') {
        // Cheerful curved smiling eyes: ^  ^
        eyeCtx.beginPath();
        eyeCtx.arc(76, 72, 26, Math.PI * 1.15, Math.PI * 1.85, false);
        eyeCtx.stroke();

        eyeCtx.beginPath();
        eyeCtx.arc(180, 72, 26, Math.PI * 1.15, Math.PI * 1.85, false);
        eyeCtx.stroke();
      } else if (mood === 'blink') {
        // Blinking lines: -  -
        eyeCtx.lineWidth = 8;
        eyeCtx.beginPath();
        eyeCtx.moveTo(52, 64);
        eyeCtx.lineTo(100, 64);
        eyeCtx.stroke();

        eyeCtx.beginPath();
        eyeCtx.moveTo(156, 64);
        eyeCtx.lineTo(204, 64);
        eyeCtx.stroke();
      } else if (mood === 'excited') {
        // Wide joyful open eyes with sparkles
        eyeCtx.fillStyle = '#22d3ee';
        eyeCtx.shadowBlur = 20;

        eyeCtx.beginPath();
        eyeCtx.arc(76, 64, 24, 0, Math.PI * 2);
        eyeCtx.fill();

        eyeCtx.beginPath();
        eyeCtx.arc(180, 64, 24, 0, Math.PI * 2);
        eyeCtx.fill();

        // Catchlight highlights
        eyeCtx.fillStyle = '#ffffff';
        eyeCtx.shadowBlur = 0;
        eyeCtx.beginPath();
        eyeCtx.arc(84, 56, 8, 0, Math.PI * 2);
        eyeCtx.fill();

        eyeCtx.beginPath();
        eyeCtx.arc(188, 56, 8, 0, Math.PI * 2);
        eyeCtx.fill();
      } else if (mood === 'handshake') {
        // Ecstatic closed celebration eyes: >  < with blushing cheeks
        eyeCtx.beginPath();
        eyeCtx.moveTo(54, 48);
        eyeCtx.lineTo(92, 64);
        eyeCtx.lineTo(54, 80);
        eyeCtx.stroke();

        eyeCtx.beginPath();
        eyeCtx.moveTo(202, 48);
        eyeCtx.lineTo(164, 64);
        eyeCtx.lineTo(202, 80);
        eyeCtx.stroke();

        // Cheerful pink blush lines
        eyeCtx.strokeStyle = 'rgba(244, 114, 182, 0.85)';
        eyeCtx.shadowColor = '#f472b6';
        eyeCtx.lineWidth = 5;

        eyeCtx.beginPath();
        eyeCtx.moveTo(46, 92); eyeCtx.lineTo(62, 92);
        eyeCtx.moveTo(68, 92); eyeCtx.lineTo(84, 92);
        eyeCtx.moveTo(172, 92); eyeCtx.lineTo(188, 92);
        eyeCtx.moveTo(194, 92); eyeCtx.lineTo(210, 92);
        eyeCtx.stroke();
      }
      eyeTexture.needsUpdate = true;
    }
    drawEyes('happy');

    const visorMat = new THREE.MeshBasicMaterial({
      map: eyeTexture,
      transparent: true,
      side: THREE.DoubleSide
    });

    // Build the Robot Assembly
    const robotRoot = new THREE.Group();
    scene.add(robotRoot);
    robotRoot.position.y = -0.15;

    // 1. Anti-Gravity Floating Hover Ring
    const hoverRingGeo = new THREE.TorusGeometry(0.72, 0.045, 16, 48);
    const hoverRing = new THREE.Mesh(hoverRingGeo, accentCyanMat);
    hoverRing.rotation.x = Math.PI / 2;
    hoverRing.position.y = -1.15;
    robotRoot.add(hoverRing);

    // Soft Ground Shadow Disc
    const shadowGeo = new THREE.CircleGeometry(0.85, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.45;
    robotRoot.add(shadowMesh);

    // 2. Robot Body & Torso Group
    const bodyGroup = new THREE.Group();
    robotRoot.add(bodyGroup);

    // Main Torso Chassis (Rounded Capsule Shape)
    const torsoGeo = new THREE.CylinderGeometry(0.55, 0.44, 0.85, 32);
    const torso = new THREE.Mesh(torsoGeo, armorMat);
    torso.position.y = -0.45;
    bodyGroup.add(torso);

    // Torso Bottom Cap
    const torsoBottomGeo = new THREE.SphereGeometry(0.44, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const torsoBottom = new THREE.Mesh(torsoBottomGeo, darkMat);
    torsoBottom.position.y = -0.875;
    bodyGroup.add(torsoBottom);

    // Chest Glowing Arc Reactor Core
    const reactorRingGeo = new THREE.TorusGeometry(0.18, 0.03, 16, 32);
    const reactorRing = new THREE.Mesh(reactorRingGeo, jointMat);
    reactorRing.position.set(0, -0.4, 0.52);
    bodyGroup.add(reactorRing);

    const reactorCoreGeo = new THREE.CircleGeometry(0.15, 32);
    const reactorCore = new THREE.Mesh(reactorCoreGeo, accentCyanMat);
    reactorCore.position.set(0, -0.4, 0.53);
    bodyGroup.add(reactorCore);

    // 3. Head & Visor Group (pivots for mouse look)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.28, 0);
    bodyGroup.add(headGroup);

    // Neck Joint
    const neckGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.22, 24);
    const neck = new THREE.Mesh(neckGeo, jointMat);
    neck.position.y = -0.12;
    headGroup.add(neck);

    // Head Chassis (Sphere slightly flattened)
    const headGeo = new THREE.SphereGeometry(0.68, 36, 28);
    const headMesh = new THREE.Mesh(headGeo, armorMat);
    headMesh.scale.set(1.08, 0.95, 0.98);
    headGroup.add(headMesh);

    // Symmetrical Curved Dark Obsidian Face Visor Mask
    const visorGeo = new THREE.SphereGeometry(0.686, 36, 24, Math.PI * 0.22, Math.PI * 0.56, Math.PI * 0.28, Math.PI * 0.44);
    const visorBackMesh = new THREE.Mesh(visorGeo, darkMat);
    visorBackMesh.scale.set(1.082, 0.952, 0.982);
    headGroup.add(visorBackMesh);

    // Visor Face with animated LED expression texture
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.scale.set(1.085, 0.955, 0.985);
    headGroup.add(visorMesh);

    // Antenna Stalk & Glowing Bulb
    const antennaStalkGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.35, 16);
    const antennaStalk = new THREE.Mesh(antennaStalkGeo, jointMat);
    antennaStalk.position.set(0, 0.82, 0);
    headGroup.add(antennaStalk);

    const antennaBulbGeo = new THREE.SphereGeometry(0.09, 20, 20);
    const antennaBulb = new THREE.Mesh(antennaBulbGeo, accentCyanMat);
    antennaBulb.position.set(0, 1.02, 0);
    headGroup.add(antennaBulb);

    // Cyber Earcups (Left & Right)
    const earcupGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 24);
    earcupGeo.rotateZ(Math.PI / 2);

    const earcupLeft = new THREE.Mesh(earcupGeo, darkMat);
    earcupLeft.position.set(-0.72, 0, 0);
    headGroup.add(earcupLeft);

    const earcupRight = new THREE.Mesh(earcupGeo, darkMat);
    earcupRight.position.set(0.72, 0, 0);
    headGroup.add(earcupRight);

    // Glowing Ear Rings
    const earRingGeo = new THREE.TorusGeometry(0.14, 0.022, 16, 28);
    earRingGeo.rotateY(Math.PI / 2);

    const earRingLeft = new THREE.Mesh(earRingGeo, accentCyanMat);
    earRingLeft.position.set(-0.76, 0, 0);
    headGroup.add(earRingLeft);

    const earRingRight = new THREE.Mesh(earRingGeo, accentCyanMat);
    earRingRight.position.set(0.76, 0, 0);
    headGroup.add(earRingRight);

    // 4. Left Arm (Gentle resting / waving arm)
    const armLeftGroup = new THREE.Group();
    armLeftGroup.position.set(-0.66, -0.22, 0);
    bodyGroup.add(armLeftGroup);

    const shoulderLeft = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), jointMat);
    armLeftGroup.add(shoulderLeft);

    const armLeftUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.35, 16), armorMat);
    armLeftUpper.position.set(-0.08, -0.2, 0);
    armLeftUpper.rotation.z = 0.25;
    armLeftGroup.add(armLeftUpper);

    const handLeft = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), darkMat);
    handLeft.position.set(-0.16, -0.42, 0.08);
    armLeftGroup.add(handLeft);

    // 5. Right Arm — The Dedicated Handshake Arm!
    // Reaches forward towards the viewer with an open hand ready to shake!
    const armRightGroup = new THREE.Group();
    armRightGroup.position.set(0.62, -0.16, 0.05);
    bodyGroup.add(armRightGroup);

    const shoulderRight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), jointMat);
    armRightGroup.add(shoulderRight);

    // Upper arm angled forward
    const armRightUpper = new THREE.Group();
    armRightGroup.add(armRightUpper);

    const armRightUpperMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.36, 16), armorMat);
    armRightUpperMesh.position.y = -0.18;
    armRightUpper.add(armRightUpperMesh);
    armRightUpper.rotation.set(0.7, 0.15, -0.25);

    // Elbow Joint
    const elbowRight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), jointMat);
    elbowRight.position.set(0, -0.36, 0);
    armRightUpper.add(elbowRight);

    // Forearm reaching directly out towards visitor
    const armRightForearm = new THREE.Group();
    armRightForearm.position.set(0, -0.36, 0);
    armRightUpper.add(armRightForearm);
    armRightForearm.rotation.set(-1.25, 0.2, 0);

    const forearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.40, 16), armorMat);
    forearmMesh.position.y = -0.20;
    armRightForearm.add(forearmMesh);

    // Handshake Hand (Interactive Click Target!)
    const handRightGroup = new THREE.Group();
    handRightGroup.position.set(0, -0.42, 0);
    armRightForearm.add(handRightGroup);

    // Palm (Vertical handshake orientation)
    const palmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.20, 0.14), darkMat);
    handRightGroup.add(palmMesh);

    // Metallic Fingers (Open gesture ready for handshake!)
    for (let f = 0; f < 4; f++) {
      const fingerGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.16, 12);
      const finger = new THREE.Mesh(fingerGeo, accentCyanMat);
      finger.position.set(-0.03, -0.07 + f * 0.046, 0.12);
      finger.rotation.x = Math.PI / 2;
      handRightGroup.add(finger);
    }

    // Thumb
    const thumbGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.12, 12);
    const thumb = new THREE.Mesh(thumbGeo, accentCyanMat);
    thumb.position.set(0.03, 0.08, 0.09);
    thumb.rotation.set(Math.PI / 3, 0, -0.2);
    handRightGroup.add(thumb);

    // Glowing Holographic Target Ring around hand
    const handGlowGeo = new THREE.TorusGeometry(0.22, 0.02, 16, 32);
    const handGlowMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.8
    });
    const handGlowRing = new THREE.Mesh(handGlowGeo, handGlowMat);
    handGlowRing.position.set(0, 0, 0.06);
    handRightGroup.add(handGlowRing);

    // Tag clickable objects for Three.js Raycaster
    const clickableObjects = [
      palmMesh,
      handGlowRing,
      headMesh,
      visorMesh,
      torso,
      reactorCore
    ];
    clickableObjects.forEach(obj => { obj.userData.isRobot = true; });

    // 6. Confetti & 3D Star Sparkle Particle System
    const particleCount = 75;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleVel = [];
    const particleColors = new Float32Array(particleCount * 3);

    const sparkPalette = [
      [0.133, 0.827, 0.933], // Cyan
      [0.753, 0.518, 0.988], // Purple
      [0.988, 0.827, 0.298], // Gold
      [1.0, 1.0, 1.0]        // White sparkle
    ];

    for (let p = 0; p < particleCount; p++) {
      particlePos[p * 3] = 0;
      particlePos[p * 3 + 1] = 0;
      particlePos[p * 3 + 2] = 0;
      particleVel.push({ x: 0, y: 0, z: 0, life: 0, decay: 0 });

      const c = sparkPalette[Math.floor(Math.random() * sparkPalette.length)];
      particleColors[p * 3] = c[0];
      particleColors[p * 3 + 1] = c[1];
      particleColors[p * 3 + 2] = c[2];
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });

    const sparkleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(sparkleSystem);

    function triggerSparkleBurst(origin) {
      const pos = particleGeo.attributes.position.array;
      for (let p = 0; p < particleCount; p++) {
        pos[p * 3] = origin.x + (Math.random() - 0.5) * 0.1;
        pos[p * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.1;
        pos[p * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.1;

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.08 + 0.03;
        particleVel[p] = {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed + 0.02,
          z: (Math.random() - 0.5) * speed * 1.5,
          life: 1.0,
          decay: Math.random() * 0.02 + 0.015
        };
      }
      particleGeo.attributes.position.needsUpdate = true;
      particleMat.opacity = 1;
    }

    // 7. Melodic Chime Sound via Web Audio API
    function playHandshakeChime() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const start = ctx.currentTime;

        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start + i * 0.08);

          gain.gain.setValueAtTime(0.001, start + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.18, start + i * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.08 + 0.32);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start + i * 0.08);
          osc.stop(start + i * 0.08 + 0.35);
        });
      } catch (_) {}
    }

    // 8. Handshake Execution Sequence
    let isHandshaking = false;

    function triggerHandshake() {
      if (isHandshaking) return;
      isHandshaking = true;

      // Visual & Audio fanfare
      playHandshakeChime();
      drawEyes('handshake');
      if (speechBubble) speechBubble.classList.add('is-shaking');
      if (bubbleTitle) bubbleTitle.textContent = '🤝 Shaking Hands...';
      if (bubbleText) bubbleText.textContent = 'Connecting with Byte & initiating skills leap!';

      // Get 3D hand world position for particle burst
      const handWorldPos = new THREE.Vector3();
      handRightGroup.getWorldPosition(handWorldPos);

      // Handshake GSAP Timeline
      if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline({
          onComplete: () => {
            // Handshake complete celebration
            drawEyes('excited');
            if (speechBubble) speechBubble.classList.remove('is-shaking');
            if (bubbleTitle) bubbleTitle.textContent = 'Nice to Meet You! 🎉';
            if (bubbleText) bubbleText.textContent = 'Awesome handshake! Taking you straight to Technical Skills 🚀';

            // Cheerful wave on left arm
            gsap.to(armLeftGroup.rotation, { z: 1.1, duration: 0.25, yoyo: true, repeat: 3 });

            // Smoothly scroll to #skills after celebration
            setTimeout(() => {
              const skillsSec = document.getElementById('skills');
              if (skillsSec) {
                skillsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });

                setTimeout(() => {
                  skillsSec.classList.add('skills-highlight-flash');
                  setTimeout(() => {
                    skillsSec.classList.remove('skills-highlight-flash');
                    isHandshaking = false;
                    drawEyes('happy');
                    if (bubbleTitle) bubbleTitle.textContent = 'Hey! Let\'s Shake Hands 🤝';
                    if (bubbleText) bubbleText.textContent = 'Click my hand or the button to connect & explore technical skills!';
                  }, 1600);
                }, 800);
              } else {
                isHandshaking = false;
                drawEyes('happy');
              }
            }, 800);
          }
        });

        // Lean in & pump handshake up/down
        tl.to(robotRoot.position, { z: 0.35, y: -0.05, duration: 0.25, ease: 'power2.out' })
          .call(() => { triggerSparkleBurst(handWorldPos); })
          .to(armRightForearm.position, { y: '+=0.22', duration: 0.12, yoyo: true, repeat: 5, ease: 'sine.inOut' })
          .to(robotRoot.position, { z: 0, y: -0.15, duration: 0.3, ease: 'power2.inOut' });
      } else {
        // Fallback if GSAP is unavailable
        setTimeout(() => {
          isHandshaking = false;
          drawEyes('happy');
          const skillsSec = document.getElementById('skills');
          if (skillsSec) skillsSec.scrollIntoView({ behavior: 'smooth' });
        }, 1200);
      }
    }

    // Event Listeners
    if (shakeBtn) shakeBtn.addEventListener('click', triggerHandshake);

    // Raycaster & Mouse tracking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let targetHeadRotY = 0;
    let targetHeadRotX = 0;
    let isHovered = false;

    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      targetHeadRotY = THREE.MathUtils.clamp(mouse.x * 0.45, -0.5, 0.5);
      targetHeadRotX = THREE.MathUtils.clamp(-mouse.y * 0.25, -0.3, 0.3);

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickableObjects, true);

      if (hits.length > 0) {
        if (!isHovered) {
          isHovered = true;
          container.classList.add('is-pointing');
          if (!isHandshaking) drawEyes('excited');
          if (handHint) handHint.style.opacity = '1';
        }
      } else {
        if (isHovered) {
          isHovered = false;
          container.classList.remove('is-pointing');
          if (!isHandshaking) drawEyes('happy');
          if (handHint) handHint.style.opacity = '0.88';
        }
      }
    }

    function onCanvasClick(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickableObjects, true);

      if (hits.length > 0 || isHovered) {
        triggerHandshake();
      }
    }

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('click', onCanvasClick);

    // Periodic Cute Blinking
    setInterval(() => {
      if (!isHandshaking && currentEyeMood === 'happy') {
        drawEyes('blink');
        setTimeout(() => {
          if (!isHandshaking && currentEyeMood === 'blink') drawEyes('happy');
        }, 180);
      }
    }, 3800);

    // Resize Handling
    function onResize() {
      if (!container || !canvas) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    // Performance Optimization: Pause rendering when scrolled out of view
    let isVisible = true;
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
        });
      }, { threshold: 0.1 });
      observer.observe(container);
    }

    // Render Loop
    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      if (!isVisible) return; // Save GPU when hero is out of view!

      const time = clock.getElapsedTime();

      // Idle Floating Bobbing
      if (!isHandshaking) {
        robotRoot.position.y = -0.15 + Math.sin(time * 2.2) * 0.08;
        hoverRing.rotation.z += 0.015;
        antennaBulb.material.emissiveIntensity = 0.6 + Math.sin(time * 4) * 0.3;
        handGlowRing.rotation.z += 0.02;
        handGlowRing.scale.setScalar(1 + Math.sin(time * 3) * 0.08);

        // Smooth head lerp to mouse
        headGroup.rotation.y += (targetHeadRotY - headGroup.rotation.y) * 0.08;
        headGroup.rotation.x += (targetHeadRotX - headGroup.rotation.x) * 0.08;

        // Gentle breathing wave on left arm
        armLeftGroup.rotation.z = Math.sin(time * 1.5) * 0.08;
      }

      // Update Sparkle Particles
      if (particleMat.opacity > 0) {
        const pos = particleGeo.attributes.position.array;
        let active = false;
        for (let p = 0; p < particleCount; p++) {
          if (particleVel[p].life > 0) {
            active = true;
            pos[p * 3] += particleVel[p].x;
            pos[p * 3 + 1] += particleVel[p].y;
            pos[p * 3 + 2] += particleVel[p].z;
            particleVel[p].y -= 0.001; // Soft Gravity
            particleVel[p].life -= particleVel[p].decay;
          }
        }
        particleGeo.attributes.position.needsUpdate = true;
        if (!active) {
          particleMat.opacity = 0;
        }
      }

      renderer.render(scene, camera);
    }

    animate();
  })();



// ==========================================================================
// VIVID MOTION-INSPIRED "PLAY REEL" SHOWCASE & CINEMATIC MODAL PLAYER
// ==========================================================================
(function initPlayReelSystem() {
  const cinemaCard = document.getElementById('reelCinemaCard');
  const ambientVideo = document.getElementById('reelAmbientVideo');
  const magneticBadge = document.getElementById('reelMagneticBadge');
  const quickMuteBtn = document.getElementById('reelQuickMuteBtn');
  const muteIcon = document.getElementById('reelMuteIcon');

  // Modal elements
  const modal = document.getElementById('reelModal');
  const modalBackdrop = document.getElementById('reelModalBackdrop');
  const modalCloseBtn = document.getElementById('reelModalCloseBtn');
  const modalVideo = document.getElementById('reelModalVideo');
  const playerStage = modal ? modal.querySelector('.reel-player-stage') : null;
  const centerPlayBtn = document.getElementById('playerCenterPlayBtn');
  const centerPlayIcon = document.getElementById('centerPlayIcon');
  const modalPlayPauseBtn = document.getElementById('modalPlayPauseBtn');
  const modalPlayIcon = document.getElementById('modalPlayIcon');
  const modalVolumeBtn = document.getElementById('modalVolumeBtn');
  const modalVolumeIcon = document.getElementById('modalVolumeIcon');
  const modalVolumeSlider = document.getElementById('modalVolumeSlider');
  const modalCurrentTime = document.getElementById('modalCurrentTime');
  const modalTotalTime = document.getElementById('modalTotalTime');
  const modalSpeedBtn = document.getElementById('modalSpeedBtn');
  const modalFullscreenBtn = document.getElementById('modalFullscreenBtn');
  const modalFullscreenIcon = document.getElementById('modalFullscreenIcon');
  const scrubWrap = document.getElementById('playerScrubWrap');
  const scrubTrack = document.getElementById('playerScrubTrack');
  const scrubProgress = document.getElementById('playerScrubProgress');
  const scrubThumb = document.getElementById('playerScrubThumb');
  const scrubBuffer = document.getElementById('playerScrubBuffer');
  const modalChapterCards = modal ? modal.querySelectorAll('.modal-chapter-card') : [];
  const timelinePins = modal ? modal.querySelectorAll('.chapter-pin') : [];

  // Console tabs elements
  const consoleTabBtns = document.querySelectorAll('.console-tab-btn');
  const consolePanels = document.querySelectorAll('.console-panel');
  const copyButtons = document.querySelectorAll('.terminal-copy-btn');

  if (!cinemaCard && !modal) return;

  // Set fast playback speed on ambient reel video
  if (ambientVideo) {
    const applyReelSpeed = () => {
      try {
        ambientVideo.playbackRate = 2.0;
        ambientVideo.defaultPlaybackRate = 2.0;
      } catch (_) {}
    };
    ambientVideo.addEventListener('loadedmetadata', applyReelSpeed);
    ambientVideo.addEventListener('canplay', applyReelSpeed);
    applyReelSpeed();
  }

  // ------------------------------------------------------------------------
  // 1. Magnetic Follow-CTA Cursor Physics (Vivid Motion Signature Interaction)
  // ------------------------------------------------------------------------
  if (cinemaCard && magneticBadge && window.matchMedia('(pointer: fine)').matches) {
    let cardRect = cinemaCard.getBoundingClientRect();
    let currentX = cardRect.width / 2;
    let currentY = cardRect.height / 2;
    let targetX = currentX;
    let targetY = currentY;
    let isHovering = false;
    let rafId = null;

    function updateCardRect() {
      cardRect = cinemaCard.getBoundingClientRect();
    }
    window.addEventListener('resize', updateCardRect);
    window.addEventListener('scroll', updateCardRect, { passive: true });

    function lerpCursor() {
      // Linear interpolation with smooth spring easing
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;

      magneticBadge.style.left = `${currentX}px`;
      magneticBadge.style.top = `${currentY}px`;

      if (isHovering || Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
        rafId = requestAnimationFrame(lerpCursor);
      } else {
        rafId = null;
      }
    }

    cinemaCard.addEventListener('pointerenter', (e) => {
      isHovering = true;
      updateCardRect();
      targetX = e.clientX - cardRect.left;
      targetY = e.clientY - cardRect.top;
      if (!rafId) rafId = requestAnimationFrame(lerpCursor);
    });

    cinemaCard.addEventListener('pointermove', (e) => {
      if (!isHovering) isHovering = true;
      targetX = e.clientX - cardRect.left;
      targetY = e.clientY - cardRect.top;

      // Keep within card bounds with safe padding
      const padX = 70;
      const padY = 40;
      targetX = Math.max(padX, Math.min(cardRect.width - padX, targetX));
      targetY = Math.max(padY, Math.min(cardRect.height - padY, targetY));

      if (!rafId) rafId = requestAnimationFrame(lerpCursor);
    });

    cinemaCard.addEventListener('pointerleave', () => {
      isHovering = false;
      // Return gracefully to card center
      targetX = cardRect.width / 2;
      targetY = cardRect.height / 2;
      if (!rafId) rafId = requestAnimationFrame(lerpCursor);
    });
  }

  // ------------------------------------------------------------------------
  // 2. Ambient Video Quick Mute Button
  // ------------------------------------------------------------------------
  if (quickMuteBtn && ambientVideo && muteIcon) {
    quickMuteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Do not trigger card click (open modal)
      ambientVideo.muted = !ambientVideo.muted;
      if (ambientVideo.muted) {
        muteIcon.className = 'fas fa-volume-mute';
        quickMuteBtn.setAttribute('aria-label', 'Unmute preview audio');
      } else {
        muteIcon.className = 'fas fa-volume-up';
        quickMuteBtn.setAttribute('aria-label', 'Mute preview audio');
        ambientVideo.play().catch(() => {});
      }
    });
  }

  // ------------------------------------------------------------------------
  // 3. 5-Pillar Dev Console (Tabs & Code Snippets)
  // ------------------------------------------------------------------------
  consoleTabBtns.forEach((tab) => {
    tab.addEventListener('click', () => {
      const pillar = tab.getAttribute('data-pillar');

      // Update tabs
      consoleTabBtns.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Update panels
      consolePanels.forEach((panel) => {
        panel.classList.remove('active');
      });
      const activePanel = document.getElementById(`panel-${pillar}`);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });

  // Terminal Copy Code Action
  copyButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-target');
      const codeEl = document.getElementById(targetId);
      if (!codeEl) return;

      const codeText = codeEl.innerText || codeEl.textContent;
      try {
        await navigator.clipboard.writeText(codeText);
        const origHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check" style="color:#10b981;"></i>';
        setTimeout(() => {
          btn.innerHTML = origHtml;
        }, 2000);
      } catch (err) {
        console.warn('Clipboard write failed', err);
      }
    });
  });

  // ------------------------------------------------------------------------
  // 4. Cinematic Fullscreen Modal Video Player (Vivid Motion Experience)
  // ------------------------------------------------------------------------
  let isDraggingScrub = false;
  let controlsTimeout = null;
  const speedOptions = [1.0, 1.25, 1.5, 2.0];
  let currentSpeedIdx = 0;

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function openModal(seekTime = null) {
    if (!modal || !modalVideo) return;

    // Pause ambient background video to save GPU/CPU
    if (ambientVideo) {
      ambientVideo.pause();
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Lock background scroll

    if (seekTime !== null && !isNaN(seekTime)) {
      modalVideo.currentTime = seekTime;
    }

    modalVideo.play().then(() => {
      updatePlayIcons(true);
    }).catch(() => {
      updatePlayIcons(false);
    });

    resetControlsTimer();
  }

  function closeModal() {
    if (!modal || !modalVideo) return;

    modalVideo.pause();
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Resume ambient video
    if (ambientVideo) {
      ambientVideo.play().catch(() => {});
    }

    if (playerStage) {
      playerStage.classList.remove('controls-hidden');
    }
    clearTimeout(controlsTimeout);
  }

  function togglePlayPause() {
    if (!modalVideo) return;
    if (modalVideo.paused || modalVideo.ended) {
      modalVideo.play();
      updatePlayIcons(true);
    } else {
      modalVideo.pause();
      updatePlayIcons(false);
    }
  }

  function updatePlayIcons(isPlaying) {
    if (!playerStage) return;
    if (isPlaying) {
      playerStage.classList.add('is-playing');
      if (modalPlayIcon) modalPlayIcon.className = 'fas fa-pause';
      if (centerPlayIcon) centerPlayIcon.className = 'fas fa-pause';
    } else {
      playerStage.classList.remove('is-playing');
      if (modalPlayIcon) modalPlayIcon.className = 'fas fa-play';
      if (centerPlayIcon) centerPlayIcon.className = 'fas fa-play';
    }
  }

  function updateActiveChapterCard(currentTime) {
    // 5 Chapters:
    // 01: 0 - 14.9s (Python)
    // 02: 15 - 27.9s (RAG)
    // 03: 28 - 41.9s (LLM)
    // 04: 42 - 49.9s (Supabase)
    // 05: 50+ s (Netlify)
    let activeSeek = 0;
    if (currentTime >= 50) activeSeek = 50;
    else if (currentTime >= 42) activeSeek = 42;
    else if (currentTime >= 28) activeSeek = 28;
    else if (currentTime >= 15) activeSeek = 15;
    else activeSeek = 0;

    modalChapterCards.forEach((card) => {
      const cardSeek = parseFloat(card.getAttribute('data-seek'));
      if (cardSeek === activeSeek) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  function resetControlsTimer() {
    if (!playerStage || !modalVideo || modalVideo.paused) {
      if (playerStage) playerStage.classList.remove('controls-hidden');
      clearTimeout(controlsTimeout);
      return;
    }

    playerStage.classList.remove('controls-hidden');
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
      if (!modalVideo.paused && !isDraggingScrub) {
        playerStage.classList.add('controls-hidden');
      }
    }, 2800);
  }


  // Modal open on click disabled per user request


  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', closeModal);
  }

  // Video Time Update & Scrub Progress
  if (modalVideo) {
    modalVideo.addEventListener('timeupdate', () => {
      if (isDraggingScrub) return;

      const current = modalVideo.currentTime;
      const duration = modalVideo.duration || 58;
      const pct = (current / duration) * 100;

      if (scrubProgress) scrubProgress.style.width = `${pct}%`;
      if (scrubThumb) scrubThumb.style.left = `${pct}%`;
      if (modalCurrentTime) modalCurrentTime.textContent = formatTime(current);

      updateActiveChapterCard(current);
    });

    modalVideo.addEventListener('progress', () => {
      if (modalVideo.buffered.length > 0 && scrubBuffer && modalVideo.duration) {
        const bufferedEnd = modalVideo.buffered.end(modalVideo.buffered.length - 1);
        const bufferPct = (bufferedEnd / modalVideo.duration) * 100;
        scrubBuffer.style.width = `${bufferPct}%`;
      }
    });

    modalVideo.addEventListener('loadedmetadata', () => {
      if (modalTotalTime) modalTotalTime.textContent = formatTime(modalVideo.duration);
    });

    modalVideo.addEventListener('play', () => updatePlayIcons(true));
    modalVideo.addEventListener('pause', () => updatePlayIcons(false));
    modalVideo.addEventListener('ended', () => {
      updatePlayIcons(false);
      if (playerStage) playerStage.classList.remove('controls-hidden');
    });
  }

  if (centerPlayBtn) {
    centerPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlayPause();
    });
  }

  if (modalPlayPauseBtn) {
    modalPlayPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlayPause();
    });
  }

  if (playerStage) {
    playerStage.addEventListener('click', (e) => {
      if (e.target.closest('.player-controls-deck') || e.target.closest('.player-center-play')) return;
      togglePlayPause();
    });
    playerStage.addEventListener('pointermove', resetControlsTimer);
    playerStage.addEventListener('pointerleave', () => {
      if (!modalVideo.paused) {
        playerStage.classList.add('controls-hidden');
      }
    });
  }

  // Scrubbing & Seeking
  function seekToPosition(e) {
    if (!scrubTrack || !modalVideo || !modalVideo.duration) return;
    const rect = scrubTrack.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    modalVideo.currentTime = pct * modalVideo.duration;

    if (scrubProgress) scrubProgress.style.width = `${pct * 100}%`;
    if (scrubThumb) scrubThumb.style.left = `${pct * 100}%`;
    if (modalCurrentTime) modalCurrentTime.textContent = formatTime(modalVideo.currentTime);
  }

  if (scrubWrap) {
    scrubWrap.addEventListener('pointerdown', (e) => {
      isDraggingScrub = true;
      seekToPosition(e);
      window.addEventListener('pointermove', onPointerMoveScrub);
      window.addEventListener('pointerup', onPointerUpScrub);
    });

    function onPointerMoveScrub(e) {
      if (!isDraggingScrub) return;
      seekToPosition(e);
    }

    function onPointerUpScrub() {
      if (isDraggingScrub) {
        isDraggingScrub = false;
        window.removeEventListener('pointermove', onPointerMoveScrub);
        window.removeEventListener('pointerup', onPointerUpScrub);
      }
    }
  }

  // Chapter Timeline Pins Click
  timelinePins.forEach((pin) => {
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetTime = parseFloat(pin.getAttribute('data-time')) || 0;
      if (modalVideo) {
        modalVideo.currentTime = targetTime;
        modalVideo.play().catch(() => {});
      }
    });
  });

  // Modal Chapter Deck Buttons Click
  modalChapterCards.forEach((card) => {
    card.addEventListener('click', () => {
      const seek = parseFloat(card.getAttribute('data-seek')) || 0;
      if (modalVideo) {
        modalVideo.currentTime = seek;
        modalVideo.play().catch(() => {});
      }
    });
  });

  // Volume & Mute Controls
  if (modalVolumeSlider && modalVideo) {
    modalVolumeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      modalVideo.volume = val;
      modalVideo.muted = val === 0;
      updateVolumeIcon(val);
    });
  }

  if (modalVolumeBtn && modalVideo) {
    modalVolumeBtn.addEventListener('click', () => {
      modalVideo.muted = !modalVideo.muted;
      if (modalVideo.muted) {
        if (modalVolumeSlider) modalVolumeSlider.value = 0;
        updateVolumeIcon(0);
      } else {
        const targetVol = modalVideo.volume || 1;
        if (modalVolumeSlider) modalVolumeSlider.value = targetVol;
        updateVolumeIcon(targetVol);
      }
    });
  }

  function updateVolumeIcon(vol) {
    if (!modalVolumeIcon) return;
    if (modalVideo && modalVideo.muted || vol === 0) {
      modalVolumeIcon.className = 'fas fa-volume-mute';
    } else if (vol < 0.5) {
      modalVolumeIcon.className = 'fas fa-volume-down';
    } else {
      modalVolumeIcon.className = 'fas fa-volume-up';
    }
  }

  // Speed Toggle
  if (modalSpeedBtn && modalVideo) {
    modalSpeedBtn.addEventListener('click', () => {
      currentSpeedIdx = (currentSpeedIdx + 1) % speedOptions.length;
      const speed = speedOptions[currentSpeedIdx];
      modalVideo.playbackRate = speed;
      modalSpeedBtn.textContent = `${speed.toFixed(1)}x`;
    });
  }

  // Fullscreen Toggle
  if (modalFullscreenBtn && playerStage) {
    modalFullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        if (playerStage.requestFullscreen) {
          playerStage.requestFullscreen();
        } else if (playerStage.webkitRequestFullscreen) {
          playerStage.webkitRequestFullscreen();
        }
        if (modalFullscreenIcon) modalFullscreenIcon.className = 'fas fa-compress';
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        if (modalFullscreenIcon) modalFullscreenIcon.className = 'fas fa-expand';
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (!modalFullscreenIcon) return;
      if (document.fullscreenElement) {
        modalFullscreenIcon.className = 'fas fa-compress';
      } else {
        modalFullscreenIcon.className = 'fas fa-expand';
      }
    });
  }

  // ------------------------------------------------------------------------
  // 5. Global Keyboard Shortcuts
  // ------------------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    // Ignore keyboard shortcuts if user is typing into input, textarea, or contenteditable
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

    // Modal-specific hotkeys (only when modal is open)
    if (modal && modal.classList.contains('active')) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        if (modalVolumeBtn) modalVolumeBtn.click();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (modalFullscreenBtn) modalFullscreenBtn.click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (modalVideo) modalVideo.currentTime = Math.max(0, modalVideo.currentTime - 5);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (modalVideo) modalVideo.currentTime = Math.min(modalVideo.duration || 58, modalVideo.currentTime + 5);
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const chapterSeeks = { '1': 0, '2': 15, '3': 28, '4': 42, '5': 50 };
        const seek = chapterSeeks[e.key];
        if (modalVideo && seek !== undefined) {
          modalVideo.currentTime = seek;
          modalVideo.play().catch(() => {});
        }
      }
      return;
    }

    // Lightbox modal keys are handled by their own listener; do not interfere
    const lbModal = document.getElementById('projectLightboxModal');
    if (lbModal && lbModal.classList.contains('active')) return;

    // Hotkey 'R' or 'r': scroll to reel section (modal disabled)
    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const reelSection = document.getElementById('play-reel');
      if (reelSection) reelSection.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Global Navigation Hotkeys [A], [E], [S], [I], [C], [P], [U], [X]
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      const keyUpper = e.key.toUpperCase();
      const navLink = document.querySelector(`.nav-links a[data-key="${keyUpper}"]`);
      if (navLink) {
        e.preventDefault();
        const targetId = navLink.getAttribute('href');
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }
    }
  });

  // ------------------------------------------------------------------------
  // 6. About Me Background Video Autoplay & Dynamic Loop Controller
  // ------------------------------------------------------------------------
  const initAboutBackgroundVideo = () => {
    const video = document.getElementById('aboutBgVideo');
    if (!video) return;

    // Strict attributes for mobile & cross-browser autoplay compliance
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('loop', '');
    video.setAttribute('autoplay', '');

    // Set accelerated playback speed for dynamic, fast-paced technology showcase
    const applyPlaybackRate = () => {
      try {
        video.playbackRate = 1.25;
        video.defaultPlaybackRate = 1.25;
      } catch (_) {}
    };

    video.addEventListener('loadedmetadata', applyPlaybackRate);
    video.addEventListener('canplay', applyPlaybackRate);
    applyPlaybackRate();

    const tryPlay = () => {
      applyPlaybackRate();
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser policy deferred, ensure muted and retry
          video.muted = true;
          video.defaultMuted = true;
          video.play().then(applyPlaybackRate).catch(() => {});
        });
      }
    };

    // Immediate attempt on initialization
    tryPlay();

    // IntersectionObserver: Ensure continuous playback while in view, pause when offscreen to conserve resources
    if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            tryPlay();
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.05 });

      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        videoObserver.observe(aboutSection);
      }
    }

    // Auto-restart seamless loop listener
    video.addEventListener('ended', () => {
      video.currentTime = 0;
      tryPlay();
    });

    // Cross-browser user gesture trigger fallback
    const gestureEvents = ['scroll', 'touchstart', 'click', 'mousemove'];
    const onUserGesture = () => {
      if (video.paused) {
        tryPlay();
      }
      gestureEvents.forEach(evt => window.removeEventListener(evt, onUserGesture));
    };
    gestureEvents.forEach(evt => window.addEventListener(evt, onUserGesture, { once: true, passive: true }));
  };

  initAboutBackgroundVideo();
})();


// ===== THEME TOGGLE (LIGHT / DARK) =====
(function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');

  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem('portfolio-theme');
  } catch (err) {
    console.warn('localStorage not accessible', err);
  }

  // Always open in LIGHT mode by default; only use dark if user explicitly chose and saved 'dark'
  let activeTheme = 'light';
  if (savedTheme === 'dark') {
    activeTheme = 'dark';
  }

  function applyTheme(theme, save = false) {
    activeTheme = theme;
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeIcon) {
        themeIcon.className = 'fas fa-sun';
      }
      if (themeToggle) {
        themeToggle.setAttribute('title', 'Switch to light theme');
        themeToggle.setAttribute('aria-label', 'Switch to light theme');
      }
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeIcon) {
        themeIcon.className = 'fas fa-moon';
      }
      if (themeToggle) {
        themeToggle.setAttribute('title', 'Switch to dark theme');
        themeToggle.setAttribute('aria-label', 'Switch to dark theme');
      }
    }

    if (save) {
      try {
        localStorage.setItem('portfolio-theme', theme);
      } catch (err) {
        console.warn('Unable to persist theme to localStorage', err);
      }
    }

    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  // Apply resolved initial theme
  applyTheme(activeTheme, false);

  if (themeToggle) {
    themeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme, true);
    });
  }
})();
