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
  // 主题唯一的配色入口：theme.css 只允许引用这些 token（及中性白/黑），
  // 站点在 site.yaml 的 themeOptions.tokens 里整套覆盖，形成各自色系。
  tokens: {
    /* 品牌主色（深色区基底 / 按钮 / 页脚） */
    '--primary': '#0a3622',
    '--primary-light': '#1c5239',
    '--primary-dark': '#051a12',
    '--primary-rgb': '10, 54, 34',      /* --primary 的 RGB 三元组，用于 rgba() 阴影与描边 */
    '--primary-dark-rgb': '5, 26, 18',  /* --primary-dark 的 RGB 三元组，用于滚动导航等半透明背景 */
    /* 强调色 */
    '--accent': '#00bfa6',
    '--accent-rgb': '0, 191, 166',
    /* 文字：dark = 浅色表面上的深色字；light = 深色表面上的浅色字 */
    '--text-dark': '#1d1d1f',
    '--text-dark-rgb': '29, 29, 31',
    '--text-muted': '#515154',
    '--text-light': '#f5f5f7',
    '--text-muted-light': 'rgba(255, 255, 255, 0.65)', /* 深色区的次级文字 */
    /* 背景与表面 */
    '--bg-light': '#ffffff',
    '--bg-gray': '#f4f7f6',
    '--bg-light-sec': '#f2f6f4', /* 浅色交替区背景 */
    '--bg-dark-sec': '#04150e',  /* 深色交替区背景 */
    '--surface': '#ffffff',      /* 卡片表面色 */
    '--border-color': 'rgba(10, 54, 34, 0.08)',
    '--font-sans': "'Inter', -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
    '--font-display': "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
  },
};

export { arrfunds };
export default arrfunds;
