import path from 'path';
import type { SiteDefinition, PageDef } from '@matrix/site-kit';
import { yaodriver as theme } from '@matrix/theme-yaodriver';
import site from './config/site';

const ROOT = path.resolve(__dirname, '..');

async function generatePages(): Promise<PageDef[]> {
  const pages: PageDef[] = [];
  const dict = {
    hero: {
      title: '重构企业 AI 生产力',
      subtitle: '曜行智能提供下一代 AI 流程再造实施方案，让智能原生深入核心业务。'
    },
    solutions: {
      title: 'AI 驱动的解决方案',
      subtitle: '针对不同行业和业务场景，提供深度定制的智能流程再造方案。'
    },
    about: {
      title: '重新定义企业运作方式',
      subtitle: '我们是曜行智能，一群相信 AI 可以重构世界运行效率的工程师、科学家与架构师。'
    }
  };

  pages.push({
    path: '/',
    template: 'home',
    locals: { dict, locale: 'zh' },
    page: {
      title: site.title,
      description: site.description,
      canonical: '/',
      activeNav: 'home',
      bodyClass: null,
    }
  });

  pages.push({
    path: '/solutions',
    template: 'solutions',
    locals: { dict, locale: 'zh' },
    page: {
      title: `解决方案 | ${site.shortTitle}`,
      description: dict.solutions.subtitle,
      canonical: '/solutions',
      activeNav: 'solutions',
      bodyClass: null,
    }
  });

  pages.push({
    path: '/about',
    template: 'about',
    locals: { dict, locale: 'zh' },
    page: {
      title: `关于我们 | ${site.shortTitle}`,
      description: dict.about.subtitle,
      canonical: '/about',
      activeNav: 'about',
      bodyClass: null,
    }
  });

  return pages;
}

export const getSiteDefinition = async (): Promise<SiteDefinition> => {
  const pages = await generatePages();

  return {
    root: ROOT,
    site,
    theme,
    themeOptions: site.themeOptions,
    pages,
    extraAssets: [],
    notFound: {
      path: '/404',
      template: 'notFound',
      locals: {
        locale: 'zh'
      },
      page: {
        title: `页面未找到 | ${site.shortTitle}`,
        description: '您访问的页面不存在或已被移除。',
        canonical: '/404',
        activeNav: null,
        bodyClass: null,
      }
    }
  };
};
