// Client-side Interactive Logic (ARR Funds - AI Investment Fund)

document.addEventListener('DOMContentLoaded', () => {
  // ─── 移动端导航菜单 ───
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');

  if (navToggle && navLinks && navOverlay) {
    const toggleMenu = () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
      navOverlay.classList.toggle('active');
      document.body.classList.toggle('no-scroll');
    };

    navToggle.addEventListener('click', toggleMenu);
    navOverlay.addEventListener('click', toggleMenu);

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
          toggleMenu();
        }
      });
    });
  }

  // ─── 导航栏滚动毛玻璃效果 ───
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
  }

  // ─── 申请表单交互 ───
  const applyForm = document.getElementById('applyForm');
  const successToast = document.getElementById('successToast');
  const submitBtn = document.getElementById('submitBtn');

  if (applyForm && successToast && submitBtn) {
    applyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitBtn.setAttribute('disabled', 'true');
      submitBtn.textContent = '正在提交...';

      setTimeout(() => {
        applyForm.classList.add('fade-out');
        setTimeout(() => {
          (applyForm as HTMLElement).style.display = 'none';
          successToast.classList.add('active');
        }, 300);
      }, 1000);
    });
  }

  // ─── 平滑滚动锚点 ───
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const hrefVal = anchor.getAttribute('href');
      if (!hrefVal || hrefVal === '#') return;

      const targetEl = document.querySelector(hrefVal);
      if (targetEl) {
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - navHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ─── 导航滚动监听高亮 (ScrollSpy) ───
  const spyLinks = document.querySelectorAll('.nav__link');
  const spySections = Array.from(spyLinks).map(link => {
    const href = link.getAttribute('href');
    if (!href) return null;
    const hashIndex = href.indexOf('#');
    if (hashIndex === -1) return null;
    const id = href.substring(hashIndex);
    try {
      return document.querySelector(id);
    } catch (e) {
      return null;
    }
  }).filter((el): el is HTMLElement => el !== null);

  if (spyLinks.length > 0 && spySections.length > 0) {
    const handleScrollSpy = () => {
      const navHeight = navbar ? navbar.offsetHeight : 80;
      const scrollPos = window.scrollY + navHeight + 120; // 配合阈值提早亮起
      let activeId = '';

      spySections.forEach(sec => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          activeId = sec.getAttribute('id') || '';
        }
      });

      // 顶部边界情况处理
      if (window.scrollY < 100) {
        activeId = '';
      }

      // 底部边界情况处理
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50) {
        activeId = spySections[spySections.length - 1].getAttribute('id') || '';
      }

      spyLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && activeId && (href === `#${activeId}` || href.endsWith(`#${activeId}`))) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    };

    window.addEventListener('scroll', handleScrollSpy);
    window.addEventListener('resize', handleScrollSpy);
    handleScrollSpy();
  }

  // ─── IntersectionObserver 动画载入 ───
  const revealElements = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
      revealObserver.observe(el);
      el.classList.add('data-reveal');
    });
  } else {
    revealElements.forEach(el => {
      el.classList.add('revealed');
    });
  }
});
