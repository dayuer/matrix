/**
 * DIDI.BIKE — Theme Client Application Script
 * Under themes/didi/client/app.ts
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initNavbar();
  initSensorTabs();
  initEcosystemTabs();
  initContactForm();
  initBlogList();
});

/* ==========================================================================
   1. Scroll Animations (IntersectionObserver for .animate-on-scroll)
   ========================================================================== */
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Trigger once
        }
      });
    },
    { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
  );

  const scanAndObserve = () => {
    const elements = document.querySelectorAll('.animate-on-scroll:not(.visible)');
    elements.forEach((el) => observer.observe(el));
  };

  scanAndObserve();
  
  // Scans in stages for dynamically rendered content
  setTimeout(scanAndObserve, 100);
  setTimeout(scanAndObserve, 500);
}

/* ==========================================================================
   2. Navbar Scroll, Burger Menu & Smooth Scroll
   ========================================================================== */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const burger = document.getElementById('navbarBurger');
  const menu = document.getElementById('navbarMenu');

  if (!navbar) return;

  // Scroll handler
  const handleScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial run

  // Mobile menu toggle
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const expanded = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!expanded));
      burger.classList.toggle('open');
      menu.classList.toggle('open');
    });

    // Close menu on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        burger.setAttribute('aria-expanded', 'false');
        burger.classList.remove('open');
        menu.classList.remove('open');
      }
    });
  }

  // Smooth scroll for hash links
  const hashLinks = document.querySelectorAll('a[data-hash]');
  hashLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href') || '';
      if (href.includes('#')) {
        const hash = '#' + href.split('#')[1];
        const basePath = href.split('#')[0];
        const cleanPathname = window.location.pathname.replace(/\/$/, '');
        const cleanBasePath = basePath.replace(/\/$/, '');

        // If on same page, smooth scroll
        if (cleanPathname === cleanBasePath || cleanBasePath === '') {
          e.preventDefault();
          if (burger && menu) {
            burger.setAttribute('aria-expanded', 'false');
            burger.classList.remove('open');
            menu.classList.remove('open');
          }
          const target = document.querySelector(hash);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.history.pushState(null, '', hash);
          }
        }
      }
    });
  });

  // Hero Canvas Particles
  const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
  if (canvas) {
    initHeroParticles(canvas);
  }
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  opacity: number;
}

function initHeroParticles(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const particleColor = isLight ? '8, 145, 178' : '0, 212, 255';

  let particles: Particle[] = [];
  let animationId: number | null = null;
  let isVisible = true;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Generate particles
  const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
    });
  }

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particleColor}, ${p.opacity})`;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const dx = p.x - particles[j].x;
        const dy = p.y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${particleColor}, ${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });

    if (isVisible) {
      animationId = requestAnimationFrame(draw);
    }
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        isVisible = true;
        if (!animationId) draw();
      } else {
        isVisible = false;
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      }
    },
    { threshold: 0.1 }
  );
  observer.observe(canvas);

  // SensorSVG path animation-delay logic
  const sensorSvg = document.getElementById('sensor-svg');
  if (sensorSvg) {
    const paths = sensorSvg.querySelectorAll('.data-stream');
    paths.forEach((path, idx) => {
      (path as HTMLElement).style.animationDelay = `${idx * 0.6}s`;
    });
  }
}

/* ==========================================================================
   3. Sensor & Ecosystem Tabs
   ========================================================================== */
function initSensorTabs() {
  const tabsContainer = document.getElementById('sensorTabs');
  if (!tabsContainer) return;

  const tabs = tabsContainer.querySelectorAll('.sensor-tab');
  const panels = document.querySelectorAll('.sensor-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      // Update active tab button
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active panel
      panels.forEach((panel) => {
        if (panel.id === `panel-${targetTab}`) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });
}

function initEcosystemTabs() {
  const tabsContainer = document.getElementById('telemetryTabs');
  if (!tabsContainer) return;

  const tabs = tabsContainer.querySelectorAll('.eco-group-tab');
  const panels = document.querySelectorAll('.eco-metrics-grid');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const idx = tab.getAttribute('data-group-tab');

      // Update active tab button
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active panel
      panels.forEach((panel) => {
        if (panel.id === `telemetry-panel-${idx}`) {
          (panel as HTMLElement).style.display = 'grid';
        } else {
          (panel as HTMLElement).style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   4. Contact Form Submission
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contactForm') as HTMLFormElement | null;
  const successOverlay = document.getElementById('contactSuccess');
  const errorNotice = document.getElementById('contactError');
  const submitBtn = document.getElementById('contactSubmit') as HTMLButtonElement | null;

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorNotice) {
      errorNotice.style.display = 'none';
      errorNotice.textContent = '';
    }

    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    const isId = document.documentElement.lang === 'id';

    // Simple validation
    if (!name || !name.trim()) {
      showError(isId ? 'Nama wajib diisi.' : 'Name is required.');
      return;
    }
    if (!email || !email.trim()) {
      showError(isId ? 'Email wajib diisi.' : 'Email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(isId ? 'Format email tidak valid.' : 'Please enter a valid email address.');
      return;
    }
    if (!message || !message.trim()) {
      showError(isId ? 'Pesan wajib diisi.' : 'Message is required.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = isId ? 'Mengirim...' : 'Sending...';
    }

    try {
      const response = await fetch(form.action || '/api/contact', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData.entries())),
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (result.success) {
        if (successOverlay) {
          successOverlay.style.display = 'flex';
          setTimeout(() => {
            successOverlay.style.display = 'none';
          }, 6000);
        }
        form.reset();
      } else {
        showError(result.error || (isId ? 'Terjadi kesalahan.' : 'Something went wrong.'));
      }
    } catch {
      showError(isId ? 'Gagal mengirim pesan. Silakan coba lagi.' : 'Something went wrong. Please try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = isId ? 'Kirim Pesan' : 'Send Message';
      }
    }
  });

  function showError(msg: string) {
    if (errorNotice) {
      errorNotice.textContent = msg;
      errorNotice.style.display = 'block';
    }
  }
}

/* ==========================================================================
   5. Blog list & Dynamic Client-side Search & Pagination
   ========================================================================== */
interface Post {
  id: string;
  slug: string;
  locale: string;
  cluster: string;
  title: string;
  excerpt?: string;
  isPillar?: boolean;
  publishedAt?: string;
  tags?: string[];
}

function initBlogList() {
  const postsListWrapper = document.getElementById('postsListWrapper');
  if (!postsListWrapper) return;

  const blogLoading = document.getElementById('blogLoading');
  const pillarSection = document.getElementById('pillarSection');
  const postList = document.getElementById('postList');
  const emptyNotice = document.getElementById('emptyNotice');
  const emptyText = document.getElementById('emptyText');
  const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
  const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement | null;
  const searchResultsHeader = document.getElementById('searchResultsHeader');
  const searchResultsText = document.getElementById('searchResultsText');
  const pathwaysSection = document.getElementById('pathwaysSection');
  const lexiconCloud = document.getElementById('lexiconCloud');
  const domainHeader = document.getElementById('domainHeader');
  const domainTitle = document.getElementById('domainTitle');
  const domainDesc = document.getElementById('domainDesc');
  const tagBar = document.getElementById('tagBar');

  const paginationNav = document.getElementById('paginationNav');
  const prevPage = document.getElementById('prevPage') as HTMLAnchorElement | null;
  const nextPage = document.getElementById('nextPage') as HTMLAnchorElement | null;
  const pageInfo = document.getElementById('pageInfo');

  const locale = document.documentElement.lang || 'en';
  const isId = locale === 'id';
  const perPage = 12;

  let allPosts: Post[] = [];
  let filteredPosts: Post[] = [];
  let currentPage = 1;

  // Read URL params
  const getParams = () => {
    const path = window.location.pathname;
    let cluster = '';
    const catIdx = path.indexOf('/blog/category/');
    if (catIdx !== -1) {
      cluster = path.substring(catIdx + '/blog/category/'.length).replace(/\/$/, '');
    }
    const search = new URLSearchParams(window.location.search);
    return {
      cluster,
      q: search.get('q') || '',
      page: parseInt(search.get('page') || '1') || 1
    };
  };

  const setUrlParams = (params: { cluster?: string; q?: string; page?: number }) => {
    let newPathname = window.location.pathname;
    const localePrefix = newPathname.startsWith('/id') ? '/id' : '/en';
    if (params.cluster) {
      newPathname = `${localePrefix}/blog/category/${params.cluster}`;
    } else {
      newPathname = `${localePrefix}/blog`;
    }
    const search = new URLSearchParams();
    if (params.q) search.set('q', params.q);
    if (params.page && params.page > 1) search.set('page', String(params.page));
    const searchStr = search.toString();
    const newurl = window.location.protocol + "//" + window.location.host + newPathname + (searchStr ? '?' + searchStr : '');
    window.history.pushState({ path: newurl }, '', newurl);
  };

  // Format Dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const render = () => {
    const { cluster, q, page } = getParams();
    currentPage = page;

    if (blogLoading) blogLoading.style.display = 'none';
    if (postsListWrapper) postsListWrapper.style.display = 'block';

    // 1. Tag highlight
    if (tagBar) {
      tagBar.style.display = cluster ? 'flex' : 'none';
      const tagBtns = tagBar.querySelectorAll('.blog-tag-btn');
      tagBtns.forEach((btn) => {
        const tag = btn.getAttribute('data-tag');
        if (tag === cluster) {
          btn.classList.add('active');
          (btn as HTMLElement).style.borderColor = 'var(--color-accent)';
          (btn as HTMLElement).style.color = 'var(--color-accent)';
          (btn as HTMLElement).style.background = 'rgba(0, 212, 255, 0.05)';
        } else {
          btn.classList.remove('active');
          (btn as HTMLElement).style.borderColor = '';
          (btn as HTMLElement).style.color = '';
          (btn as HTMLElement).style.background = '';
        }
      });
    }

    // 2. Filter posts
    filteredPosts = allPosts.filter((p) => p.locale === locale);

    if (cluster) {
      filteredPosts = filteredPosts.filter((p) => p.cluster === cluster);
      
      // Update domain header
      if (domainHeader && domainTitle && domainDesc) {
        domainHeader.style.display = 'block';
        const cData = (window as any).CLUSTERS_DATA[cluster];
        if (cData) {
          domainTitle.textContent = cData.name[locale] || cluster;
          domainDesc.textContent = cData.desc[locale] || '';
        }
      }
      if (pathwaysSection) pathwaysSection.style.display = 'none';
    } else {
      if (domainHeader) domainHeader.style.display = 'none';
      if (pathwaysSection && !q) pathwaysSection.style.display = 'block';
      if (pathwaysSection && q) pathwaysSection.style.display = 'none';
    }

    if (q) {
      const query = q.toLowerCase();
      filteredPosts = filteredPosts.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.excerpt?.toLowerCase().includes(query)
      );

      if (searchResultsHeader && searchResultsText) {
        searchResultsHeader.style.display = 'block';
        const cData = cluster ? (window as any).CLUSTERS_DATA[cluster] : null;
        searchResultsText.textContent = isId
          ? `Menampilkan hasil untuk "${q}"${cData ? ` di ${cData.name.id}` : ''}`
          : `Showing results for "${q}"${cData ? ` in ${cData.name.en}` : ''}`;
      }
      if (clearBtn) clearBtn.style.display = 'inline-block';
    } else {
      if (searchResultsHeader) searchResultsHeader.style.display = 'none';
      if (clearBtn) clearBtn.style.display = 'none';
    }

    // 3. Render core pillars (only shown on root list)
    if (pillarSection) {
      pillarSection.innerHTML = '';
      if (!cluster && !q) {
        const pillars = allPosts.filter((p) => p.locale === locale && p.isPillar);
        const homePrefix = '/' + locale;
        pillars.forEach((p) => {
          const item = document.createElement('a');
          item.href = `${homePrefix}/blog/${p.slug}`;
          item.className = 'blog-post-entry';
          item.innerHTML = `
            <div class="blog-post-meta">
              <span class="blog-pillar-badge">
                ★ ${isId ? 'Panduan Utama Wiki' : 'Core Pillar Guide'}
              </span>
            </div>
            <h2 class="blog-post-title">${p.title}</h2>
            ${p.excerpt ? `<p class="blog-post-excerpt">${p.excerpt}</p>` : ''}
          `;
          pillarSection.appendChild(item);
        });
        pillarSection.style.display = pillars.length > 0 ? 'block' : 'none';
      } else {
        pillarSection.style.display = 'none';
      }
    }

    // 4. Pagination slices
    const totalItems = filteredPosts.length;
    const pages = Math.ceil(totalItems / perPage);
    const sliced = filteredPosts.slice((currentPage - 1) * perPage, currentPage * perPage);

    // 5. Render posts
    if (postList) {
      postList.innerHTML = '';
      const homePrefix = '/' + locale;
      sliced.forEach((post) => {
        const item = document.createElement('a');
        item.href = `${homePrefix}/blog/${post.slug}`;
        item.className = 'blog-post-entry';
        
        let metaHtml = `<time class="blog-post-date">${formatDate(post.publishedAt)}</time>`;
        if (Array.isArray(post.tags) && post.tags.length > 0) {
          metaHtml += `
            <span class="blog-post-dot"></span>
            <span class="blog-post-tag">${post.tags[0]}</span>
          `;
        }

        item.innerHTML = `
          <div class="blog-post-meta">${metaHtml}</div>
          <h2 class="blog-post-title">${post.title}</h2>
          ${post.excerpt ? `<p class="blog-post-excerpt">${post.excerpt}</p>` : ''}
        `;
        postList.appendChild(item);
      });
    }

    // Empty state
    if (emptyNotice && emptyText) {
      if (filteredPosts.length === 0) {
        emptyNotice.style.display = 'block';
        emptyText.textContent = q
          ? (isId ? `Tidak ditemukan artikel sains yang cocok dengan "${q}".` : `No scientific articles found matching "${q}".`)
          : (isId ? 'Belum ada artikel.' : 'No posts yet. Stay tuned.');
      } else {
        emptyNotice.style.display = 'none';
      }
    }

    // 6. Pagination UI
    if (paginationNav && pageInfo) {
      if (pages > 1) {
        paginationNav.style.display = 'flex';
        pageInfo.textContent = isId ? `Halaman ${currentPage} dari ${pages}` : `Page ${currentPage} of ${pages}`;
        
        if (prevPage) {
          if (currentPage > 1) {
            prevPage.style.display = 'inline-block';
            prevPage.href = '?page=' + (currentPage - 1) + (cluster ? '&cluster=' + cluster : '') + (q ? '&q=' + encodeURIComponent(q) : '');
          } else {
            prevPage.style.display = 'none';
          }
        }
        if (nextPage) {
          if (currentPage < pages) {
            nextPage.style.display = 'inline-block';
            nextPage.href = '?page=' + (currentPage + 1) + (cluster ? '&cluster=' + cluster : '') + (q ? '&q=' + encodeURIComponent(q) : '');
          } else {
            nextPage.style.display = 'none';
          }
        }
      } else {
        paginationNav.style.display = 'none';
      }
    }
  };

  // Search input events
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const qVal = searchInput.value.trim();
      const current = getParams();
      setUrlParams({ cluster: current.cluster, q: qVal, page: 1 });
      render();
    });

    const form = document.getElementById('searchForm');
    if (form) {
      form.addEventListener('submit', (e) => e.preventDefault());
    }
  }

  // Clear search
  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      const current = getParams();
      setUrlParams({ cluster: current.cluster, q: '', page: 1 });
      render();
    });
  }

  // Intercept tag-clicks
  const setupTagLinks = () => {
    const listLinks = document.querySelectorAll('.blog-wiki-card, .blog-tag-btn, .blog-back-btn, #allDirectoryTag, .blog-reset-search-btn');
    listLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href') || '';
        const urlObj = new URL(href, window.location.href);
        const path = urlObj.pathname;
        let cluster = '';
        const catIdx = path.indexOf('/blog/category/');
        if (catIdx !== -1) {
          cluster = path.substring(catIdx + '/blog/category/'.length).replace(/\/$/, '');
        }
        const sParams = urlObj.searchParams;
        setUrlParams({
          cluster: cluster,
          q: sParams.get('q') || '',
          page: parseInt(sParams.get('page') || '1') || 1
        });
        render();
      });
    });
  };

  // Fetch posts index JSON
  fetch('/posts-index.json')
    .then((res) => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then((data) => {
      allPosts = data;
      render();
      setupTagLinks();
    })
    .catch(() => {
      if (blogLoading) {
        blogLoading.innerHTML = '<p style="color: #ef4444;">Failed to load wiki directory.</p>';
      }
    });

  // Render Lexicon
  if (lexiconCloud) {
    lexiconCloud.innerHTML = '';
    const keywords = (window as any).LEXICON_KEYWORDS || [];
    keywords.forEach((word: string) => {
      const tag = document.createElement('a');
      tag.href = `?q=${encodeURIComponent(word)}`;
      tag.className = 'blog-lexicon-tag';
      tag.textContent = `#${word}`;
      tag.addEventListener('click', (e) => {
        e.preventDefault();
        const current = getParams();
        setUrlParams({ cluster: current.cluster, q: word, page: 1 });
        if (searchInput) searchInput.value = word;
        render();
      });
      lexiconCloud.appendChild(tag);
    });
  }

  // Back button routing intercept
  window.addEventListener('popstate', () => {
    render();
  });
}
