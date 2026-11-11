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

  const particleMat = new THREE.PointsMaterial({
    size: 0.6, // Smaller and elegant
    map: createCircleTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.4, // subtle backdrop opacity
    blending: THREE.AdditiveBlending,
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
    color: 0x818cf8,
    transparent: true,
    opacity: 0.05,
    blending: THREE.AdditiveBlending,
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
    color: 0x818cf8,
    wireframe: true,
    transparent: true,
    opacity: 0.08, // Very subtle wireframes
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


// ===== HEADER SHRINK ON SCROLL =====
(function initHeader() {
  const header = document.getElementById('main-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.style.background = 'rgba(10,10,15,0.95)';
    } else {
      header.style.background = 'rgba(10,10,15,0.8)';
    }
  });
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

  // Click navigation for top quick-jump buttons
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-drawer');
      const targetDrawer = document.getElementById(targetId);
      if (targetDrawer) {
        targetDrawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });

  // Click navigation for vertical dot buttons
  dotBtns.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = dot.getAttribute('data-drawer');
      const targetDrawer = document.getElementById(targetId);
      if (targetDrawer) {
        targetDrawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Setup GSAP ScrollTrigger scrub
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Stacking card scale & dim effect: strictly for desktop viewports (> 1080px)
    // where drawers use position: sticky stacking.
    ScrollTrigger.matchMedia({
      "(min-width: 1081px)": function () {
        drawers.forEach((drawer, i) => {
          if (i < drawers.length - 1) {
            const nextDrawer = drawers[i + 1];
            const inner = drawer.querySelector('.drawer-inner') || drawer;

            gsap.to(inner, {
              scale: 0.96,
              opacity: 0.5,
              filter: 'brightness(0.75)',
              ease: 'power1.out',
              scrollTrigger: {
                trigger: nextDrawer,
                start: 'top 70%',
                end: 'top 10%',
                scrub: true,
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

  // Interactive Project Preview Lightbox Modal with 2-Image Switcher (Showcase & Live)
  const lightboxModal = document.getElementById('projectLightboxModal');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxBadge = document.getElementById('lightboxBadge');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxLiveDemoBtn = document.getElementById('lightboxLiveDemoBtn');
  const btnViewShowcase = document.getElementById('btnViewShowcase');
  const btnViewLive = document.getElementById('btnViewLive');

  let currentShowcaseUrl = '';
  let currentLiveUrl = '';
  let currentBaseBadge = '';

  function setLightboxImage(view) {
    if (!lightboxImg) return;
    if (view === 'live' && currentLiveUrl) {
      lightboxImg.style.opacity = '0.35';
      lightboxImg.src = currentLiveUrl;
      if (lightboxImg.complete) {
        lightboxImg.style.opacity = '1';
      } else {
        lightboxImg.onload = () => { lightboxImg.style.opacity = '1'; };
      }
      if (btnViewShowcase) btnViewShowcase.classList.remove('active');
      if (btnViewLive) btnViewLive.classList.add('active');
      if (lightboxBadge) lightboxBadge.textContent = 'VERIFIED LIVE DEPLOYMENT';
    } else {
      lightboxImg.style.opacity = '0.35';
      lightboxImg.src = currentShowcaseUrl;
      if (lightboxImg.complete) {
        lightboxImg.style.opacity = '1';
      } else {
        lightboxImg.onload = () => { lightboxImg.style.opacity = '1'; };
      }
      if (btnViewShowcase) btnViewShowcase.classList.add('active');
      if (btnViewLive) btnViewLive.classList.remove('active');
      if (lightboxBadge) lightboxBadge.textContent = currentBaseBadge || 'ARCHITECTURE UI SHOWCASE';
    }
  }

  function openLightbox(opts) {
    if (!lightboxModal || !lightboxImg) return;
    currentShowcaseUrl = opts.showcaseUrl || opts.imgSrc || '';
    currentLiveUrl = opts.liveUrl || '';
    currentBaseBadge = opts.badge || 'PROJECT PREVIEW';

    lightboxTitle.textContent = opts.title || 'Project Interface';
    lightboxCaption.textContent = opts.caption || 'Interface Showcase';

    if (btnViewLive) {
      btnViewLive.style.display = currentLiveUrl ? 'inline-flex' : 'none';
    }

    setLightboxImage('showcase');

    if (lightboxLiveDemoBtn) {
      lightboxLiveDemoBtn.href = opts.demoUrl || '#';
      lightboxLiveDemoBtn.style.display = opts.demoUrl ? 'inline-flex' : 'none';
    }
    lightboxModal.classList.add('active');
    lightboxModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('active');
    lightboxModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (lightboxModal) {
    if (btnViewShowcase) {
      btnViewShowcase.addEventListener('click', (e) => {
        e.stopPropagation();
        setLightboxImage('showcase');
      });
    }
    if (btnViewLive) {
      btnViewLive.addEventListener('click', (e) => {
        e.stopPropagation();
        setLightboxImage('live');
      });
    }

    const previewContainers = document.querySelectorAll('.preview-image-container');
    previewContainers.forEach(container => {
      const handleOpen = (e) => {
        if (e.target.closest('.overlay-demo-btn')) return;
        e.preventDefault();
        e.stopPropagation();
        const opts = {
          imgSrc: container.getAttribute('data-full-img'),
          showcaseUrl: container.getAttribute('data-showcase') || container.getAttribute('data-full-img'),
          liveUrl: container.getAttribute('data-live') || '',
          title: container.getAttribute('data-title'),
          badge: container.getAttribute('data-badge'),
          demoUrl: container.getAttribute('data-demo'),
          caption: container.getAttribute('data-caption')
        };
        openLightbox(opts);
      };

      container.addEventListener('click', handleOpen);
      const zoomBtns = container.querySelectorAll('.overlay-zoom-btn');
      zoomBtns.forEach(btn => btn.addEventListener('click', handleOpen));
    });

    if (lightboxCloseBtn) {
      lightboxCloseBtn.addEventListener('click', closeLightbox);
    }
    if (lightboxBackdrop) {
      lightboxBackdrop.addEventListener('click', closeLightbox);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

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

  // ===== 3D FLOATING MOVABLE RESUME ROBOT (PAGE-BOT) =====
  (function initResumeBot() {
    const widget = document.getElementById('floatingResumeBot');
    const canvas = document.getElementById('resumeBotCanvas');
    const container = document.getElementById('resumeBotContainer');
    const downloadBtn = document.getElementById('resumeBotDownload');
    const tooltip = document.getElementById('resumeBotTooltip');

    if (!widget || !canvas || typeof THREE === 'undefined') return;

    // --- Three.js Mini Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, canvas.width / canvas.height, 0.1, 50);
    camera.position.set(0, 0.15, 3.8);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
    renderer.setSize(canvas.width, canvas.height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x818cf8, 1.8);
    dirLight1.position.set(3, 4, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x22d3ee, 1.5);
    dirLight2.position.set(-3, -2, 2);
    scene.add(dirLight2);

    const rimLight = new THREE.DirectionalLight(0xc084fc, 1.2);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // Root Group
    const botRoot = new THREE.Group();
    scene.add(botRoot);

    // Materials
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.85,
      roughness: 0.18
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.25
    });

    const cyanMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.85,
      roughness: 0.2
    });

    const purpleMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0xc084fc,
      emissiveIntensity: 0.75,
      roughness: 0.2
    });

    // --- Dynamic LED Visor Canvas for Resume Bot Eyes ---
    const eyeCanvas = document.createElement('canvas');
    eyeCanvas.width = 128;
    eyeCanvas.height = 64;
    const eyeCtx = eyeCanvas.getContext('2d');
    const eyeTexture = new THREE.CanvasTexture(eyeCanvas);

    function drawResumeEyes(mood) {
      eyeCtx.fillStyle = '#060913';
      eyeCtx.fillRect(0, 0, 128, 64);

      eyeCtx.lineWidth = 6;
      eyeCtx.lineCap = 'round';
      eyeCtx.strokeStyle = '#22d3ee';
      eyeCtx.shadowColor = '#22d3ee';
      eyeCtx.shadowBlur = 10;

      if (mood === 'happy') {
        // Cheerful curved smiling eyes: ^  ^
        eyeCtx.beginPath();
        eyeCtx.arc(38, 38, 14, Math.PI * 1.15, Math.PI * 1.85, false);
        eyeCtx.stroke();

        eyeCtx.beginPath();
        eyeCtx.arc(90, 38, 14, Math.PI * 1.15, Math.PI * 1.85, false);
        eyeCtx.stroke();
      } else if (mood === 'blink') {
        eyeCtx.lineWidth = 5;
        eyeCtx.beginPath();
        eyeCtx.moveTo(26, 32);
        eyeCtx.lineTo(50, 32);
        eyeCtx.stroke();

        eyeCtx.beginPath();
        eyeCtx.moveTo(78, 32);
        eyeCtx.lineTo(102, 32);
        eyeCtx.stroke();
      } else if (mood === 'excited') {
        eyeCtx.fillStyle = '#22d3ee';
        eyeCtx.shadowBlur = 12;

        eyeCtx.beginPath();
        eyeCtx.arc(38, 32, 12, 0, Math.PI * 2);
        eyeCtx.fill();

        eyeCtx.beginPath();
        eyeCtx.arc(90, 32, 12, 0, Math.PI * 2);
        eyeCtx.fill();

        eyeCtx.fillStyle = '#ffffff';
        eyeCtx.shadowBlur = 0;
        eyeCtx.beginPath();
        eyeCtx.arc(42, 28, 4, 0, Math.PI * 2);
        eyeCtx.fill();

        eyeCtx.beginPath();
        eyeCtx.arc(94, 28, 4, 0, Math.PI * 2);
        eyeCtx.fill();
      }
      eyeTexture.needsUpdate = true;
    }
    drawResumeEyes('happy');

    // Blinking cycle
    setInterval(() => {
      if (!isHovered && !isSpinning) {
        drawResumeEyes('blink');
        setTimeout(() => {
          if (!isHovered && !isSpinning) drawResumeEyes('happy');
        }, 160);
      }
    }, 4000);

    // --- Build Robot Parts ---
    // 1. Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.42, 0);
    botRoot.add(headGroup);

    const headGeo = new THREE.SphereGeometry(0.5, 32, 24);
    const headMesh = new THREE.Mesh(headGeo, armorMat);
    headGroup.add(headMesh);

    // Curved Visor Patch fitting snugly on head front
    const visorGeo = new THREE.SphereGeometry(0.506, 28, 16, Math.PI * 0.22, Math.PI * 0.56, Math.PI * 0.28, Math.PI * 0.44);
    const visorMat = new THREE.MeshBasicMaterial({
      map: eyeTexture,
      transparent: true,
      side: THREE.DoubleSide
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.rotation.y = -Math.PI / 2;
    headGroup.add(visorMesh);

    // Cute Antenna
    const antStalkGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.22, 12);
    const antStalk = new THREE.Mesh(antStalkGeo, darkMat);
    antStalk.position.set(0, 0.55, 0);
    headGroup.add(antStalk);

    const antOrbGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const antOrb = new THREE.Mesh(antOrbGeo, cyanMat);
    antOrb.position.set(0, 0.68, 0);
    headGroup.add(antOrb);

    // Ear Pods
    const earGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
    earGeo.rotateZ(Math.PI / 2);
    const earLeft = new THREE.Mesh(earGeo, darkMat);
    earLeft.position.set(-0.48, 0.02, 0);
    headGroup.add(earLeft);

    const earRight = new THREE.Mesh(earGeo, darkMat);
    earRight.position.set(0.48, 0.02, 0);
    headGroup.add(earRight);

    // 2. Torso
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, -0.15, 0);
    botRoot.add(torsoGroup);

    const bodyGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.52, 24);
    const bodyMesh = new THREE.Mesh(bodyGeo, armorMat);
    torsoGroup.add(bodyMesh);

    const beltGeo = new THREE.CylinderGeometry(0.385, 0.385, 0.09, 24);
    const beltMesh = new THREE.Mesh(beltGeo, darkMat);
    beltMesh.position.set(0, -0.16, 0);
    torsoGroup.add(beltMesh);

    // Torso Chest Core
    const coreGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 20);
    coreGeo.rotateX(Math.PI / 2);
    const coreMesh = new THREE.Mesh(coreGeo, cyanMat);
    coreMesh.position.set(0, 0.06, 0.32);
    torsoGroup.add(coreMesh);

    // Floating Propulsion Ring at base
    const ringGeo = new THREE.TorusGeometry(0.36, 0.035, 16, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, purpleMat);
    ringMesh.position.set(0, -0.42, 0);
    torsoGroup.add(ringMesh);

    // Bottom thruster dome
    const domeGeo = new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const domeMesh = new THREE.Mesh(domeGeo, darkMat);
    domeMesh.position.set(0, -0.28, 0);
    torsoGroup.add(domeMesh);

    // 3. Holographic 3D Resume Tablet Document
    const docGroup = new THREE.Group();
    docGroup.position.set(0.26, 0.02, 0.38);
    docGroup.rotation.set(-0.18, -0.32, 0.1);
    botRoot.add(docGroup);

    // 2D Canvas for Resume Hologram Texture
    const docCanvas = document.createElement('canvas');
    docCanvas.width = 256;
    docCanvas.height = 340;
    const docCtx = docCanvas.getContext('2d');

    function drawDocTexture() {
      // Dark translucent sci-fi glass card
      docCtx.fillStyle = '#0a0e1c';
      docCtx.fillRect(0, 0, 256, 340);

      // Glowing border
      docCtx.lineWidth = 6;
      docCtx.strokeStyle = '#22d3ee';
      docCtx.strokeRect(4, 4, 248, 332);

      // Accent top corner tab
      docCtx.fillStyle = '#818cf8';
      docCtx.fillRect(16, 16, 36, 6);

      // Header: [RESUME]
      docCtx.font = 'bold 22px monospace';
      docCtx.fillStyle = '#ffffff';
      docCtx.shadowColor = '#22d3ee';
      docCtx.shadowBlur = 10;
      docCtx.fillText('RESUME', 64, 44);

      // PDF Badge
      docCtx.fillStyle = '#22d3ee';
      docCtx.beginPath();
      docCtx.roundRect(178, 24, 60, 24, 6);
      docCtx.fill();
      docCtx.font = 'bold 12px sans-serif';
      docCtx.fillStyle = '#060913';
      docCtx.shadowBlur = 0;
      docCtx.fillText('PDF 📄', 188, 41);

      // Divider line
      docCtx.strokeStyle = 'rgba(129, 140, 248, 0.5)';
      docCtx.lineWidth = 2;
      docCtx.beginPath();
      docCtx.moveTo(18, 62);
      docCtx.lineTo(238, 62);
      docCtx.stroke();

      // Simulated code/experience lines
      const lineY = [86, 114, 142, 170, 198, 226, 254];
      const widths = [180, 210, 150, 195, 170, 200, 140];
      const colors = ['#818cf8', '#22d3ee', '#c084fc', '#818cf8', '#22d3ee', '#c084fc', '#818cf8'];

      lineY.forEach((y, i) => {
        docCtx.fillStyle = colors[i];
        docCtx.shadowColor = colors[i];
        docCtx.shadowBlur = 6;
        docCtx.beginPath();
        docCtx.roundRect(20, y, widths[i], 10, 5);
        docCtx.fill();
      });

      // Bottom interactive prompt
      docCtx.fillStyle = 'rgba(34, 211, 238, 0.2)';
      docCtx.strokeStyle = '#22d3ee';
      docCtx.lineWidth = 2;
      docCtx.beginPath();
      docCtx.roundRect(24, 288, 208, 34, 8);
      docCtx.fill();
      docCtx.stroke();

      docCtx.font = 'bold 13px sans-serif';
      docCtx.fillStyle = '#ffffff';
      docCtx.shadowBlur = 8;
      docCtx.shadowColor = '#22d3ee';
      docCtx.fillText('⚡ CLICK TO VIEW', 56, 310);
    }
    drawDocTexture();

    const docTexture = new THREE.CanvasTexture(docCanvas);
    const docGeo = new THREE.BoxGeometry(0.58, 0.78, 0.035);
    const docMat = new THREE.MeshStandardMaterial({
      map: docTexture,
      emissive: 0x818cf8,
      emissiveIntensity: 0.35,
      metalness: 0.2,
      roughness: 0.3,
      transparent: true,
      opacity: 0.95
    });
    const docMesh = new THREE.Mesh(docGeo, docMat);
    docGroup.add(docMesh);

    // 4. Arms
    // Left Arm (cheerfully waving)
    const armLeftGroup = new THREE.Group();
    armLeftGroup.position.set(-0.42, 0.04, 0);
    botRoot.add(armLeftGroup);

    const shoulderGeo = new THREE.SphereGeometry(0.09, 14, 14);
    const shoulderLeft = new THREE.Mesh(shoulderGeo, darkMat);
    armLeftGroup.add(shoulderLeft);

    const bicepGeo = new THREE.CylinderGeometry(0.06, 0.055, 0.28, 14);
    const bicepLeft = new THREE.Mesh(bicepGeo, armorMat);
    bicepLeft.position.set(-0.12, 0.1, 0);
    bicepLeft.rotation.z = -0.65;
    armLeftGroup.add(bicepLeft);

    const handGeo = new THREE.SphereGeometry(0.075, 14, 14);
    const handLeft = new THREE.Mesh(handGeo, cyanMat);
    handLeft.position.set(-0.24, 0.24, 0);
    armLeftGroup.add(handLeft);

    // Right Arm (holding the holographic tablet)
    const armRightGroup = new THREE.Group();
    armRightGroup.position.set(0.38, 0.04, 0);
    botRoot.add(armRightGroup);

    const shoulderRight = new THREE.Mesh(shoulderGeo, darkMat);
    armRightGroup.add(shoulderRight);

    const forearmRightGeo = new THREE.CylinderGeometry(0.06, 0.055, 0.34, 14);
    const forearmRight = new THREE.Mesh(forearmRightGeo, armorMat);
    forearmRight.position.set(0.08, -0.06, 0.2);
    forearmRight.rotation.set(0.65, -0.3, -0.2);
    armRightGroup.add(forearmRight);

    const handRight = new THREE.Mesh(handGeo, cyanMat);
    handRight.position.set(0.12, -0.12, 0.36);
    armRightGroup.add(handRight);

    // Audio chime generator via Web Audio API
    function playResumeRobotChime() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const start = ctx.currentTime;
        const freqs = [659.25, 880.00, 1174.66]; // E5, A5, D6
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start + idx * 0.08);
          gain.gain.setValueAtTime(0, start + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.12, start + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + idx * 0.08 + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start + idx * 0.08);
          osc.stop(start + idx * 0.08 + 0.3);
        });
      } catch (_) {}
    }

    // State Variables
    let isPointerDown = false;
    let hasMoved = false;
    let justDragged = false;
    let isHovered = false;
    let isSpinning = false;
    let startX = 0;
    let startY = 0;
    let widgetStartX = 0;
    let widgetStartY = 0;
    const DRAG_THRESHOLD = 6;

    // Viewport clamping function
    function clampPosition(x, y) {
      const w = widget.offsetWidth || 130;
      const h = widget.offsetHeight || 140;
      const margin = 12;
      const topMargin = 75; // Stay below the fixed navbar
      const minX = margin;
      const maxX = Math.max(margin, window.innerWidth - w - margin);
      const minY = topMargin;
      const maxY = Math.max(minY, window.innerHeight - h - margin);

      return {
        x: Math.min(Math.max(x, minX), maxX),
        y: Math.min(Math.max(y, minY), maxY)
      };
    }

    function updateTooltipPosition(top) {
      if (top < 130) {
        widget.classList.add('tooltip-bottom');
      } else {
        widget.classList.remove('tooltip-bottom');
      }
    }

    // Restore saved position if available
    try {
      const saved = localStorage.getItem('portfolio_resume_bot_pos') || localStorage.getItem('portfolio_resume_pos');
      if (saved) {
        const pos = JSON.parse(saved);
        if (typeof pos.x === 'number' && typeof pos.y === 'number') {
          const clamped = clampPosition(pos.x, pos.y);
          widget.style.left = clamped.x + 'px';
          widget.style.top = clamped.y + 'px';
          widget.style.right = 'auto';
          widget.style.bottom = 'auto';
          updateTooltipPosition(clamped.y);
        }
      }
    } catch (_) {}

    // Pointer Drag Listeners
    function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest('#resumeBotDownload')) return; // let download link work natively

      isPointerDown = true;
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;

      const rect = widget.getBoundingClientRect();
      widgetStartX = rect.left;
      widgetStartY = rect.top;

      try {
        if (widget.setPointerCapture) widget.setPointerCapture(e.pointerId);
      } catch (_) {}

      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    }

    function onPointerMove(e) {
      if (!isPointerDown) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!hasMoved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        hasMoved = true;
        widget.classList.add('is-dragging');
      }

      if (hasMoved) {
        e.preventDefault();
        const targetX = widgetStartX + dx;
        const targetY = widgetStartY + dy;
        const clamped = clampPosition(targetX, targetY);

        widget.style.left = clamped.x + 'px';
        widget.style.top = clamped.y + 'px';
        widget.style.right = 'auto';
        widget.style.bottom = 'auto';
        updateTooltipPosition(clamped.y);
      }
    }

    function onPointerUp(e) {
      if (!isPointerDown) return;
      isPointerDown = false;

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      try {
        if (widget.hasPointerCapture && widget.hasPointerCapture(e.pointerId)) {
          widget.releasePointerCapture(e.pointerId);
        }
      } catch (_) {}

      if (hasMoved) {
        widget.classList.remove('is-dragging');
        justDragged = true;
        setTimeout(() => { justDragged = false; }, 140);

        const rect = widget.getBoundingClientRect();
        try {
          localStorage.setItem('portfolio_resume_bot_pos', JSON.stringify({ x: rect.left, y: rect.top }));
        } catch (_) {}
      }
    }

    widget.addEventListener('pointerdown', onPointerDown);

    // Hover detection on widget
    widget.addEventListener('pointerenter', () => {
      isHovered = true;
      if (!isSpinning) {
        drawResumeEyes('excited');
        docMat.emissiveIntensity = 0.6;
      }
    });

    widget.addEventListener('pointerleave', () => {
      isHovered = false;
      if (!isSpinning) {
        drawResumeEyes('happy');
        docMat.emissiveIntensity = 0.35;
      }
    });

    // Handle Click (when not dragged and not download button)
    widget.addEventListener('click', (e) => {
      if (justDragged || hasMoved) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (e.target.closest('#resumeBotDownload')) {
        // Handled natively by <a> tag download
        return;
      }

      // Trigger 360-degree celebration flip & open Resume PDF
      isSpinning = true;
      playResumeRobotChime();
      drawResumeEyes('excited');

      if (typeof gsap !== 'undefined') {
        gsap.to(botRoot.rotation, {
          y: '+=6.28318',
          duration: 0.62,
          ease: 'power2.out',
          onComplete: () => {
            isSpinning = false;
            if (!isHovered) drawResumeEyes('happy');
          }
        });
        gsap.to(botRoot.position, {
          y: '+=0.2',
          duration: 0.18,
          yoyo: true,
          repeat: 1,
          ease: 'sine.out'
        });
      } else {
        setTimeout(() => {
          isSpinning = false;
          if (!isHovered) drawResumeEyes('happy');
        }, 500);
      }

      // Open Resume PDF in a new tab
      setTimeout(() => {
        window.open('Manjesh_Verma_Resume.pdf', '_blank', 'noopener,noreferrer');
      }, 200);
    });

    // Window resize handler to clamp widget safely within bounds
    window.addEventListener('resize', () => {
      if (widget.style.left && widget.style.top) {
        const currentX = parseFloat(widget.style.left);
        const currentY = parseFloat(widget.style.top);
        const clamped = clampPosition(currentX, currentY);
        widget.style.left = clamped.x + 'px';
        widget.style.top = clamped.y + 'px';
        updateTooltipPosition(clamped.y);
      }
    });

    // Render Animation Loop
    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const time = clock.getElapsedTime();

      // Levitation floating idle
      if (!isSpinning) {
        botRoot.position.y = Math.sin(time * 3.0) * 0.08;
        botRoot.rotation.z = Math.sin(time * 1.8) * 0.04;
        botRoot.rotation.x = Math.sin(time * 2.2) * 0.03;

        // Arm wave
        armLeftGroup.rotation.z = Math.sin(time * 4.0) * 0.18;

        // Tablet subtle breathing tilt
        docGroup.rotation.y = -0.32 + Math.sin(time * 2.5) * 0.06;

        // Thruster ring subtle pulse
        const pulse = 1.0 + Math.sin(time * 6.0) * 0.08;
        ringMesh.scale.set(pulse, pulse, pulse);
      }

      renderer.render(scene, camera);
    }

    animate();
  })();
})();