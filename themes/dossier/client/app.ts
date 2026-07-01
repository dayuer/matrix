// synon.ai 客户端交互逻辑（工程档案版）

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initNavShadow();
  initContactForm();
  initScrollReveal();
});

/** 移动端导航开合 */
function initMobileNav(): void {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  const close = () => {
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

/** 滚动时给导航加分隔阴影 */
function initNavShadow(): void {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/** 意向申请表单交互 */
function initContactForm(): void {
  const form = document.getElementById('partnership-form') as HTMLFormElement | null;
  const statusEl = document.getElementById('form-status') as HTMLParagraphElement | null;
  if (!form || !statusEl) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    if (btn) btn.disabled = true;

    statusEl.className = 'form-status is-info';
    statusEl.textContent = '正在提交您的合作申请……';
    statusEl.hidden = false;

    // 模拟提交（静态站点占位；接入真实端点时替换为 fetch）
    window.setTimeout(() => {
      statusEl.className = 'form-status is-success';
      statusEl.textContent = '申请已提交，Synon 顾问将在 2 个工作日内与您联系。';
      form.reset();
      if (btn) btn.disabled = false;
      window.setTimeout(() => {
        statusEl.hidden = true;
      }, 6000);
    }, 1000);
  });
}

/** 滚动渐入（尊重 prefers-reduced-motion） */
function initScrollReveal(): void {
  const els = document.querySelectorAll<HTMLElement>('.reveal, .animate-on-scroll');
  if (els.length === 0) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  els.forEach((el) => observer.observe(el));
}
