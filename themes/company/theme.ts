import path from 'path';
import type { ThemeManifest } from '@matrix/site-kit';

/**
 * 通用企业官网主题（Company）。纯表现层：页面结构由 block 占位模板（views/blocks/）组成，
 * 全部文案、图片与联系方式来自激活站点的 sites/<站点> 数据（site.yaml + content/*.yaml），
 * 经 @matrix/cli 加载：营销页走 templates 表登记的逻辑名，博客走 CLI 的 collection 能力
 * （草稿目录 → 列表页 + 详情页）。此主题不暴露全局 token（tokens 为空）。
 */
const company: ThemeManifest = {
  id: 'company',
  name: 'Company',
  // 清单编译进 dist/theme.js，'..' 回到包根，views/、theme.css、public/ 都在包根。
  dir: path.resolve(__dirname, '..'),
  layout: 'layouts/base.njk',
  templates: {
    home: 'pages/page.njk',
    page: 'pages/page.njk',
    notFound: 'pages/page.njk',
    blogList: 'pages/blog-list.njk',
    blogDetail: 'pages/blog-detail.njk',
    serves: 'pages/serves.njk',
    partner: 'pages/partner.njk',
    questions: 'pages/questions.njk',
    entry: 'pages/entry.njk',
  },
  css: 'theme.css',
  clientJs: 'public/app.js',
  tokens: {},
};

export { company };
export default company;
