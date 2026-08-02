import path from 'path';
import type { ThemeManifest } from '@matrix/site-kit';

/**
 * VoiceBridge 畅译官网主题。纯表现层：页面结构由 views/blocks/ 的 block 模板组成，
 * 全部文案与数据来自 sites/voicebridge.top（site.yaml + content/**），经 @matrix/cli 加载。
 * token 默认值取自原手写 index.html 的 :root 自定义属性，站点可经 themeOptions.tokens 覆盖。
 */
const voicebridge: ThemeManifest = {
  id: 'voicebridge',
  name: 'VoiceBridge',
  dir: path.resolve(__dirname, '..'),
  layout: 'layouts/base.njk',
  templates: {
    home: 'pages/page.njk',
    page: 'pages/page.njk',
    article: 'pages/article.njk',
    notFound: 'pages/page.njk',
  },
  css: 'theme.css',
  clientJs: 'public/app.js',
  tokens: {
    '--bg': '#fbfbfd',
    '--surface': '#ffffff',
    '--surface-2': '#f5f5f7',
    '--ink': '#1d1d1f',
    '--ink-2': '#6e6e73',
    '--ink-3': '#86868b',
    '--accent': '#6c5ce7',
    '--accent-ink': '#5847c8',
    '--border': 'rgba(0,0,0,0.08)',
    '--border-2': 'rgba(0,0,0,0.06)',
    '--nav-h': '52px',
    '--r-sm': '10px',
    '--r-md': '18px',
    '--r-lg': '28px',
    '--shadow-card': '0 4px 20px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04)',
    '--shadow-float': '0 24px 60px rgba(28,28,30,0.14), 0 4px 12px rgba(28,28,30,0.06)',
  },
};

export { voicebridge };
export default voicebridge;
