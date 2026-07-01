import path from 'path';
import type { ThemeManifest } from '@matrix/site-kit';

/**
 * 企业官网资讯类主题（Corporate Journal）。应用逻辑（路由/API/博客/下单/设备分流）仍在 apps/edaijia。
 * 该站为多页应用，模板由 apps/edaijia 的 server.ts/export.ts 以字面路径渲染；
 * templates 表在此登记逻辑名以便查阅。此主题不暴露全局 token（tokens 为空）。
 */
const journal: ThemeManifest = {
  id: 'journal',
  name: 'Corporate Journal',
  // 清单编译进 dist/theme.js，'..' 回到包根，views/、theme.css、public/ 都在包根。
  dir: path.resolve(__dirname, '..'),
  layout: 'layouts/base.njk',
  templates: {
    home: 'pages/index.njk',
    homeMobile: 'pages/index-mobile.njk',
    questions: 'pages/questions.njk',
    partner: 'pages/partner.njk',
    entry: 'pages/entry.njk',
    serves: 'pages/serves.njk',
    order: 'pages/order.njk',
    orderStatus: 'pages/order-status.njk',
    blogList: 'pages/blog-list.njk',
    blogDetail: 'pages/blog-detail.njk',
    notFound: 'pages/404.njk',
  },
  css: 'theme.css',
  clientJs: 'public/app.js',
  tokens: {},
};

export { journal };
export default journal;
