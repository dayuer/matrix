import path from 'path';
import type { ThemeManifest } from '@matrix/site-kit';

const arrfunds: ThemeManifest = {
  id: 'arrfunds',
  name: 'ARR Fintech',
  // 清单编译进 dist/theme.js，'..' 回到包根，views/、theme.css、public/ 都在包根。
  dir: path.resolve(__dirname, '..'),
  layout: 'layout.njk',
  templates: {
    home: 'templates/home.njk',
    notFound: 'templates/404.njk',
  },
  css: 'theme.css',
  clientJs: 'public/app.js',
  tokens: {
    '--primary': '#0a3622',
    '--primary-light': '#1c5239',
    '--primary-dark': '#051a12',
    '--accent': '#00bfa6',
    '--accent-rgb': '0, 191, 166',
    '--text-dark': '#1d1d1f',
    '--text-muted': '#515154',
    '--text-light': '#f5f5f7',
    '--bg-light': '#ffffff',
    '--bg-gray': '#f4f7f6',
    '--bg-light-sec': '#f2f6f4', /* 默认浅绿象牙色 */
    '--bg-dark-sec': '#04150e',  /* 默认墨绿黑色 */
    '--border-color': 'rgba(10, 54, 34, 0.08)',
    '--font-sans': "'Inter', -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
    '--font-display': "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
  },
};

export { arrfunds };
export default arrfunds;
