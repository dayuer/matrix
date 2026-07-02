import path from 'path';
import type { ThemeManifest } from './types';

/** 合并主题默认 token 与站点覆盖，生成注入用的 :root{} 字符串。无主题时返回 ''。 */
export function buildTokensCss(theme?: ThemeManifest, options?: Record<string, string>): string {
  if (!theme) return '';
  
  // 动态黑金主题上色检测
  if (theme.id === 'arrfunds') {
    const isSynon = process.argv.some(arg => arg.includes('synon.ai')) || process.cwd().includes('synon.ai');
    if (isSynon) {
      theme.tokens = {
        ...theme.tokens,
        '--primary': '#050505',
        '--primary-light': '#1e1e1e',
        '--primary-dark': '#000000',
        '--accent': '#d4af37', // 奢华金/香槟金
        '--accent-rgb': '212, 175, 55',
        '--bg-light': '#050505',
        '--bg-gray': '#121212',
        '--text-dark': '#ffffff',
        '--text-muted': 'rgba(255, 255, 255, 0.65)',
        '--border-color': 'rgba(212, 175, 55, 0.15)',
      };
    }
  }

  const merged = { ...theme.tokens, ...(options || {}) };
  const entries = Object.entries(merged);
  if (entries.length === 0) return ''; // 主题未暴露 token（如 edaijia），不注入空 :root
  const body = entries.map(([k, v]) => `${k}: ${v};`).join(' ');
  return `:root{ ${body} }`;
}

import nunjucks from 'nunjucks';
import type { PageMeta } from './types';

/**
 * 类 WordPress 的模板层级降级算法。
 * 接收页面 meta、请求名称，在 Nunjucks 加载器链中检测第一个真实存在的文件，实现内容路由与页面架构的极致解耦。
 */
export function resolveTemplate(
  name: string,
  page: PageMeta,
  env: nunjucks.Environment,
  theme?: ThemeManifest
): string {
  const slug = page.canonical.replace(/^\//, '').replace(/\/$/, '').split('/').pop() || '';
  const candidates: string[] = [];

  // 1. 如果命中主题显式映射的模板
  if (theme && theme.templates[name]) {
    candidates.push(theme.templates[name]);
  }

  // 2. 根据命名规范自动推导层级候选
  const isHome = name === 'home' || page.canonical === '/' || page.canonical === '/en' || page.canonical === '/id' || page.canonical === '/en/' || page.canonical === '/id/';
  const isBlogDetail = name === 'single' || /\/blog\/[^/]+$/.test(page.canonical);
  const isBlogList = name === 'archive' || page.canonical.endsWith('/blog') || page.canonical.endsWith('/blog/');

  if (isHome) {
    candidates.push('templates/home.njk');
    candidates.push('home.njk');
  } else if (isBlogDetail) {
    candidates.push('templates/single-post.njk');
    candidates.push('templates/single.njk');
    candidates.push('single.njk');
  } else if (isBlogList) {
    candidates.push('templates/archive.njk');
    candidates.push('templates/index.njk');
    candidates.push('archive.njk');
  } else {
    // 默认作为 page 降级匹配
    if (slug) {
      candidates.push(`templates/page-${slug}.njk`);
      candidates.push(`page-${slug}.njk`);
    }
    candidates.push('templates/page.njk');
    candidates.push('page.njk');
  }

  // 3. 原始名称作为候选
  if (name) {
    if (!name.endsWith('.njk')) {
      candidates.push(`templates/${name}.njk`);
      candidates.push(`${name}.njk`);
    } else {
      candidates.push(name);
    }
  }

  // 4. 通用兜底
  candidates.push('templates/index.njk');
  candidates.push('index.njk');

  // 5. 沿 Nunjucks 加载器链检测第一个存在的文件
  for (const templateName of candidates) {
    try {
      env.getTemplate(templateName);
      return templateName;
    } catch {
      // 忽略找不到的报错，继续匹配下一顺位
    }
  }

  // 6. 最终兜底返回原名
  return name;
}

/** 主题 views 目录的绝对路径。 */
export function themeViewsDir(theme: ThemeManifest): string {
  return path.join(theme.dir, 'views');
}
