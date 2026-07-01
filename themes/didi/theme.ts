import path from 'path';
import type { ThemeManifest } from '@matrix/site-kit';

const didi: ThemeManifest = {
  id: 'didi',
  name: 'DIDI.BIKE Technical',
  dir: path.resolve(__dirname, '..'),
  layout: 'layouts/base.njk',
  templates: {
    home: 'pages/index.njk',
    about: 'pages/about.njk',
    faq: 'pages/faq.njk',
    specs: 'pages/specs.njk',
    technology: 'pages/technology.njk',
    useCases: 'pages/use-cases.njk',
    blogList: 'pages/blog-list.njk',
    blogDetail: 'pages/blog-detail.njk',
    notFound: 'pages/404.njk',
    legal: 'pages/legal.njk',
    didiHome: 'pages/index.njk',
  },
  css: 'theme.css',
  clientJs: 'public/app.js',
  tokens: {}
};

export { didi };
export default didi;
