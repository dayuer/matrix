import type { BaseSiteConfig } from '@matrix/site-kit';

export const site: BaseSiteConfig & Record<string, any> = {
  baseUrl: 'https://yaodriver.com',
  brand: {
    name: '曜行智能',
    desc: '企业 AI 流程再造实施方案',
    favicon: '/images/favicon.svg',
  },
  domain: 'yaodriver.com',
  title: '曜行智能 | Yaodriver',
  shortTitle: 'Yaodriver',
  description: '人工智能开发公司，专注于企业 AI 流程再造实施方案。',
  year: new Date().getFullYear(),
  themeOptions: {
    favicon: '/images/favicon.svg'
  }
};

export default site;
