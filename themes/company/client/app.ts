/**
 * 平台官网 · 客户端交互逻辑（TypeScript）
 * 编译产物：public/app.js（见 tsconfig.client.json）
 *
 * 1. 导航栏滚动透明度变化
 * 2. data-reveal 滚动进入动画 (IntersectionObserver)
 * 3. data-* 数字计数器
 * 4. 移动端导航菜单
 * 5. 平滑锚点滚动
 * 6. FAQ 手风琴折叠
 * 7. 一键复制 + Toast
 * 8. data-track 埋点委托上报
 */

// 第三方统计 SDK 的全局类型（非模块脚本，直接合并 lib.dom 的 Window）
interface Window {
  gtag?: (...args: unknown[]) => void;
  _hmt?: unknown[];
  sensors?: { track: (event: string, props: Record<string, unknown>) => void };
}

(function (): void {
  'use strict';

  // ── 导航栏滚动 ──
  const navbar = document.getElementById('navbar');

  // ── 标题年数自动计算 ──
  const FOUNDING_YEAR = 2011;
  const currentYear = new Date().getFullYear();
  const yearDiff = currentYear - FOUNDING_YEAR;
  const cnNums = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十'];
  const cnYear = cnNums[yearDiff] || String(yearDiff);

  const trustEl = document.getElementById('trustYears');
  if (trustEl) trustEl.textContent = cnYear;
  const mobileTrustEl = document.getElementById('mobileTrustYears');
  if (mobileTrustEl) mobileTrustEl.textContent = cnYear;
  const timelineEl = document.getElementById('timelineYears');
  if (timelineEl) timelineEl.textContent = cnYear;

  // 动态更新页脚版权年份
  const copyrightEl = document.getElementById('copyrightYear');
  if (copyrightEl) {
    copyrightEl.textContent = currentYear > FOUNDING_YEAR
      ? FOUNDING_YEAR + ' - ' + currentYear
      : String(FOUNDING_YEAR);
  }

  function handleNavScroll(): void {
    if (!navbar) return;
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // ── 首页锚点导航滚动高亮 ──
  const navLinkEls = document.querySelectorAll<HTMLAnchorElement>('.nav__link');
  const sectionIds = ['services', 'trust', 'timeline', 'download'];
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);

  if (sections.length > 0) {
    const scrollSpy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinkEls.forEach((link) => {
            const href = link.getAttribute('href') || '';
            const isMatch = href === '#' + id || href.endsWith('/#' + id);
            link.classList.toggle('active', isMatch);
          });
        });
      },
      { rootMargin: '-40% 0px -50% 0px' }
    );
    sections.forEach((sec) => scrollSpy.observe(sec));
  }

  // ── 移动端导航 ──
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');

  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-controls', 'navLinks');
  }

  function toggleNav(): void {
    if (!navLinks) return;
    const isOpen = navLinks.classList.toggle('open');
    if (navToggle) {
      navToggle.classList.toggle('active', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
    if (navOverlay) navOverlay.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function closeNav(): void {
    if (navLinks) navLinks.classList.remove('open');
    if (navToggle) {
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    }
    if (navOverlay) navOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (navToggle) navToggle.addEventListener('click', toggleNav);
  if (navOverlay) navOverlay.addEventListener('click', closeNav);
  if (navLinks) {
    navLinks.querySelectorAll<HTMLElement>('.nav__link').forEach((l) => {
      l.addEventListener('click', closeNav);
    });
  }

  // ── 滚动进入动画 ──
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

  function isInView(el: HTMLElement): boolean {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.92 && r.bottom > 0;
  }

  function reveal(el: HTMLElement): void {
    if (el.dataset.revealed) return;
    el.dataset.revealed = '1';
    el.classList.add('visible');
    runCounters(el);
  }

  // 初始化：已在视口内的立即显示（不闪烁），不在视口内的保持隐藏
  els.forEach((el) => {
    if (isInView(el)) {
      el.style.transition = 'none';
      el.classList.add('visible');
      el.dataset.revealed = '1';
      requestAnimationFrame(() => {
        el.style.transition = '';
      });
      runCounters(el);
    }
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target as HTMLElement);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    els.forEach((el) => {
      if (!el.dataset.revealed) io.observe(el);
    });
  }

  // 安全兜底：2.5 秒后强制显示所有未触发的元素
  setTimeout(() => {
    els.forEach((el) => {
      if (!el.dataset.revealed) reveal(el);
    });
  }, 2500);

  // ── 数字计数器（easeOutCubic） ──
  function runCounters(scope: HTMLElement): void {
    const nodes = scope.querySelectorAll<HTMLElement>('.counter[data-target], .counter[data-founding]');
    nodes.forEach((node) => {
      const target = node.hasAttribute('data-founding')
        ? new Date().getFullYear() - parseInt(node.getAttribute('data-founding') || '0', 10)
        : parseInt(node.getAttribute('data-target') || '0', 10);
      if (!target || node.dataset.counted) return;
      node.dataset.counted = '1';

      const duration = 1400;
      let startTime: number | null = null;

      function tick(now: number): void {
        if (startTime === null) startTime = now;
        const p = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        node.textContent = String(Math.round(target * eased));
        if (p < 1) {
          requestAnimationFrame(tick);
        } else {
          node.textContent = String(target);
        }
      }
      requestAnimationFrame(tick);
    });
  }

  // ── 平滑锚点滚动 ──
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e: Event) => {
      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href === '#' || href === '#top') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const offset = (navbar ? navbar.offsetHeight : 64) + 20;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: 'smooth',
      });
    });
  });

  // ── FAQ 手风琴折叠 ──
  const faqItems = document.querySelectorAll<HTMLElement>('.faq__item');
  faqItems.forEach((item, i) => {
    const question = item.querySelector('.faq__question');
    if (!question) return;
    question.addEventListener('click', () => {
      item.classList.toggle('active');
      track('faq_expand', { question_index: i + 1 });
    });
  });

  // ── 一键复制 + Toast ──
  let toast: HTMLDivElement | null = null;

  function showToast(message: string): void {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    void toast.offsetHeight; // 强制重绘以触发 transition
    toast.classList.add('show');

    const timer = toast.dataset.timer;
    if (timer) clearTimeout(parseInt(timer, 10));

    const newTimer = window.setTimeout(() => {
      if (toast) toast.classList.remove('show');
    }, 2500);
    toast.dataset.timer = String(newTimer);
  }

  function fallbackCopy(text: string, type: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('已成功复制' + type + '：' + text);
    } catch {
      showToast('复制失败，请手动复制');
    }
    document.body.removeChild(textArea);
  }

  document.querySelectorAll<HTMLElement>('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-copy');
      const type = btn.getAttribute('data-type') || '内容';
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => showToast('已成功复制' + type + '：' + text))
          .catch(() => fallbackCopy(text, type));
      } else {
        fallbackCopy(text, type);
      }
    });
  });

  // ── 埋点：data-track 委托上报 ──
  function track(event: string, props: Record<string, unknown> = {}): void {
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, props);
    } else if (Array.isArray(window._hmt)) {
      window._hmt.push(['_trackEvent', event, String(props.platform || props.type || ''), JSON.stringify(props)]);
    } else if (window.sensors && typeof window.sensors.track === 'function') {
      window.sensors.track(event, props);
    } else if (window.console && console.debug) {
      console.debug('[track]', event, props);
    }
  }

  document.addEventListener('click', (e: Event) => {
    const el = (e.target as Element | null)?.closest('[data-track]') as HTMLElement | null;
    if (!el) return;
    const event = el.getAttribute('data-track') || '';
    const props: Record<string, unknown> = {};
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.indexOf('data-track-') === 0) {
        props[attr.name.slice('data-track-'.length)] = attr.value;
      }
    });
    if (el instanceof HTMLAnchorElement && el.href) props.href = el.href;
    track(event, props);
  }, true);
})();
