import path from 'path';
import type { ThemeManifest } from '@matrix/site-kit';

const yaodriver: ThemeManifest = {
  id: 'yaodriver',
  name: 'Yaodriver AI Enterprise',
  dir: path.resolve(__dirname, '..'),
  layout: 'layout.njk',
  templates: {
    home: 'templates/home.njk',
    notFound: 'templates/404.njk',
    solutions: 'templates/solutions.njk',
    about: 'templates/about.njk'
  },
  css: 'theme.css',
  defaultFavicon: '/images/favicon.svg',
  tokens: {
    // 2026 AI 流行配色 (Cloud Dancer Off-White + Electric Indigo)
    '--bg-main': '#f8f9fa',
    '--bg-surface': '#ffffff',
    '--bg-surface-hover': '#f1f5f9',
    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--text-muted': '#94a3b8',
    '--accent': '#4f46e5',
    '--accent-hover': '#4338ca',
    '--accent-soft': 'rgba(79, 70, 229, 0.08)',
    '--border': '#e2e8f0',
    '--border-strong': '#cbd5e1',
    '--font-display': "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    '--font-body': "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    '--r-1': '4px',
    '--r-2': '8px',
    '--r-3': '12px',
    '--container': '1200px',
    '--ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
};

export { yaodriver };
export default yaodriver;
