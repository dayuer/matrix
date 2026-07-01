import path from 'path';
import type { ThemeManifest } from '@matrix/site-kit';

const dossier: ThemeManifest = {
  id: 'dossier',
  name: 'Engineering Dossier',
  // 清单编译进 dist/theme.js，'..' 回到包根，views/、theme.css、public/ 都在包根。
  dir: path.resolve(__dirname, '..'),
  layout: 'layout.njk',
  templates: {
    home: 'templates/home.njk',
    notFound: 'templates/404.njk',
    about: 'about.njk',
    specs: 'specs.njk',
    technology: 'technology.njk',
    useCases: 'use-cases.njk',
    faq: 'faq.njk',
    legal: 'legal.njk',
    blogList: 'blog-list.njk',
    blogDetail: 'blog-detail.njk',
  },
  css: 'theme.css',
  clientJs: 'public/app.js',
  defaultFavicon: '/images/favicon.svg',
  tokens: {
    '--paper': '#faf9f6',
    '--paper-2': '#f1efea',
    '--paper-3': '#eae7e0',
    '--ink': '#16181d',
    '--ink-2': '#3b3f47',
    '--muted': '#6b7079',
    '--line': 'rgba(22, 24, 29, 0.12)',
    '--line-soft': 'rgba(22, 24, 29, 0.07)',
    '--grid': 'rgba(22, 24, 29, 0.05)',
    '--accent': '#c6431c',
    '--accent-ink': '#a5360f',
    '--accent-soft': 'rgba(198, 67, 28, 0.09)',
    '--font-display':
      "'Archivo', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif",
    '--font-body':
      "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', Roboto, sans-serif",
    '--font-mono': "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    '--r-1': '2px',
    '--r-2': '4px',
    '--container': '1160px',
    '--ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
};

export { dossier };
export default dossier;
