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
    'npx create-portfolio@latest ./',
    'pip install fastapi uvicorn',
    'gcloud auth login',
    'docker build -t my-app .',
    'python -m pytest --cov',
    'git push origin main',
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