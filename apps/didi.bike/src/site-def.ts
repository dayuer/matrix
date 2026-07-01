import path from 'path';
import fs from 'fs';
import type { SiteDefinition, PageDef } from '@matrix/site-kit';
import { didi as theme } from '@matrix/theme-didi';
import site from './config/site';
import { getDictionary } from './lib/i18n';
import { fetchBlogSlugs, fetchPost, fetchRelated, loadAllPosts, fetchPillars } from './lib/blog';
import { CLUSTERS } from './lib/clusters';

const ROOT = path.resolve(__dirname, '..');

// 顶层异步生成所有页面路由
async function generatePages(): Promise<PageDef[]> {
  const pages: PageDef[] = [];
  const locales: ('en' | 'id')[] = ['en', 'id'];

  // 1. 根页面跳转器 (JS 重定向到 /en)
  pages.push({
    path: '/',
    template: 'home',
    locals: {
      isRootRedirect: true,
      dict: getDictionary('en'),
      locale: 'en',
    },
    page: {
      title: 'DIDI.BIKE — Redirecting...',
      description: 'Redirecting to /en',
      canonical: '/',
      ogImage: '/images/og-image.jpg',
      activeNav: null,
      bodyClass: null,
    }
  });

  // 1.1 批量非语言前缀路径跳转器
  const redirectRoutes = [
    '/blog', '/about', '/specs', '/technology', '/use-cases', '/faq', '/legal',
    '/blog/category/aerodynamics-cda',
    '/blog/category/bike-fitting',
    '/blog/category/power-pedaling',
    '/blog/category/sensor-telemetry',
    '/blog/category/training-racing',
    '/blog/category/integrations',
    '/blog/category/use-cases',
    '/blog/category/glossary'
  ];
  for (const rPath of redirectRoutes) {
    pages.push({
      path: rPath,
      template: 'home',
      locals: {
        isRootRedirect: true,
        redirectPath: rPath,
        dict: getDictionary('en'),
        locale: 'en',
      },
      page: {
        title: 'DIDI.BIKE — Redirecting...',
        description: `Redirecting to /en${rPath}`,
        canonical: rPath,
        ogImage: '/images/og-image.jpg',
        activeNav: null,
        bodyClass: null,
      }
    });
  }



  // 2. 注册基本多语言页面
  for (const locale of locales) {
    const dict = getDictionary(locale);
    const langPrefix = `/${locale}`;

    // 首页
    const homeBlocks = [
      { type: 'hero', data: dict.hero || {} },
      { type: 'pillars', data: dict.pillars || {} },
      { type: 'sensor', data: dict.sensor || {} },
      { type: 'ecosystem', data: dict.ecosystem || {} },
      { type: 'business', data: dict.business || {} },
      { type: 'contact', data: dict.contact || {} }
    ];

    pages.push({
      path: `${langPrefix}`,
      template: 'didiHome',
      locals: { dict, locale, blocks: homeBlocks },
      page: {
        title: dict.metadata.title,
        description: dict.metadata.description,
        canonical: langPrefix,
        ogImage: '/images/og-image.jpg',
        activeNav: 'home',
        bodyClass: null,
        blocks: homeBlocks,
      }
    });

    // 关于
    pages.push({
      path: `${langPrefix}/about`,
      template: 'about',
      locals: { dict, locale },
      page: {
        title: `${dict.nav.about} | DIDI.BIKE`,
        description: dict.metadata.description,
        canonical: `${langPrefix}/about`,
        ogImage: '/images/og-image.jpg',
        activeNav: 'about',
        bodyClass: null,
      }
    });

    // FAQ
    pages.push({
      path: `${langPrefix}/faq`,
      template: 'faq',
      locals: { dict, locale },
      page: {
        title: `${dict.nav.faq} | DIDI.BIKE`,
        description: dict.metadata.description,
        canonical: `${langPrefix}/faq`,
        ogImage: '/images/og-image.jpg',
        activeNav: 'faq',
        bodyClass: null,
      }
    });

    // specs
    pages.push({
      path: `${langPrefix}/specs`,
      template: 'specs',
      locals: { dict, locale },
      page: {
        title: `${dict.nav.specs} | DIDI.BIKE`,
        description: dict.metadata.description,
        canonical: `${langPrefix}/specs`,
        ogImage: '/images/og-image.jpg',
        activeNav: 'specs',
        bodyClass: null,
      }
    });

    // technology
    pages.push({
      path: `${langPrefix}/technology`,
      template: 'technology',
      locals: { dict, locale },
      page: {
        title: `${dict.nav.technology} | DIDI.BIKE`,
        description: dict.metadata.description,
        canonical: `${langPrefix}/technology`,
        ogImage: '/images/og-image.jpg',
        activeNav: 'technology',
        bodyClass: null,
      }
    });

    // use-cases
    pages.push({
      path: `${langPrefix}/use-cases`,
      template: 'useCases',
      locals: { dict, locale },
      page: {
        title: `${dict.nav.useCases} | DIDI.BIKE`,
        description: dict.metadata.description,
        canonical: `${langPrefix}/use-cases`,
        ogImage: '/images/og-image.jpg',
        activeNav: 'useCases',
        bodyClass: null,
      }
    });

    // legal
    pages.push({
      path: `${langPrefix}/legal`,
      template: 'legal',
      locals: { dict, locale },
      page: {
        title: `Legal Declarations | DIDI.BIKE`,
        description: dict.metadata.description,
        canonical: `${langPrefix}/legal`,
        ogImage: '/images/og-image.jpg',
        activeNav: null,
        bodyClass: null,
      }
    });

    // legal sub-pages
    const legalPages = [
      { slug: 'privacy-policy', titleEn: 'Privacy Policy', titleId: 'Kebijakan Privasi' },
      { slug: 'terms-of-service', titleEn: 'Terms of Service', titleId: 'Ketentuan Layanan' },
      { slug: 'cookie-policy', titleEn: 'Cookie Policy', titleId: 'Kebijakan Cookie' },
      { slug: 'trademark-notice', titleEn: 'Trademark Notice', titleId: 'Pemberitahuan Merek Dagang' }
    ];

    for (const lp of legalPages) {
      const htmlPath = path.join(ROOT, 'src', 'config', 'legal', `${lp.slug}-${locale}-content.html`);
      const content = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
      
      pages.push({
        path: `${langPrefix}/legal/${lp.slug}`,
        template: 'legal',
        locals: {
          dict,
          locale,
          content
        },
        page: {
          title: `${locale === 'id' ? lp.titleId : lp.titleEn} | DIDI.BIKE`,
          description: dict.metadata.description,
          canonical: `${langPrefix}/legal/${lp.slug}`,
          ogImage: '/images/og-image.jpg',
          activeNav: null,
          bodyClass: null,
        }
      });
    }

    // blog 列表页
    const pillars = await fetchPillars(locale);
    const localePosts = loadAllPosts().filter((p: any) => p.locale === locale);

    pages.push({
      path: `${langPrefix}/blog`,
      template: 'blogList',
      locals: {
        dict,
        locale,
        pillars,
        clusters: CLUSTERS,
        allPosts: localePosts,
        posts: localePosts.filter((p: any) => !p.isPillar),
      },
      page: {
        title: `${dict.nav.blog} | DIDI.BIKE`,
        description: `Professional cycling telemetry science, aerodynamic drag profiling and bike fitting telemetry.`,
        canonical: `${langPrefix}/blog`,
        ogImage: '/images/og-image.jpg',
        activeNav: 'blog',
        bodyClass: null,
      }
    });

    // blog 分类列表页（静态物理路由）
    for (const c of CLUSTERS) {
      pages.push({
        path: `${langPrefix}/blog/category/${c.slug}`,
        template: 'blogList',
        locals: {
          dict,
          locale,
          pillars,
          clusters: CLUSTERS,
          allPosts: localePosts,
          posts: localePosts.filter((p: any) => p.cluster === c.slug && !p.isPillar),
          clusterParam: c.slug,
          currentCluster: c,
        },
        page: {
          title: `${c.name[locale] || c.name.en} | ${dict.nav.blog} | DIDI.BIKE`,
          description: c.description[locale] || c.description.en,
          canonical: `${langPrefix}/blog/category/${c.slug}`,
          ogImage: '/images/og-image.jpg',
          activeNav: 'blog',
          bodyClass: null,
        }
      });
    }
  }

  // 3. 动态博客详情页（带语言 fallback 容错补全）
  const blogSlugs = await fetchBlogSlugs();
  const uniqueSlugs = Array.from(new Set(blogSlugs.map(x => x.slug)));
  const supportedLocales: Array<'en' | 'id'> = ['en', 'id'];

  for (const slug of uniqueSlugs) {
    const existingItems = blogSlugs.filter(x => x.slug === slug);
    const existingLocales = existingItems.map(x => x.locale);

    for (const targetLocale of supportedLocales) {
      let post: any = null;
      let originalLocale = targetLocale;
      let contentHtml = '';

      if (existingLocales.includes(targetLocale)) {
        post = await fetchPost(slug, targetLocale);
        const htmlPath = path.join(ROOT, 'public', 'blog-html', `${slug}-${targetLocale}.html`);
        contentHtml = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
      } else {
        const fallbackLocale = existingLocales[0];
        post = await fetchPost(slug, fallbackLocale);
        if (post) {
          post = { ...post, originalLocale: fallbackLocale };
        }
        originalLocale = fallbackLocale;
        const htmlPath = path.join(ROOT, 'public', 'blog-html', `${slug}-${fallbackLocale}.html`);
        contentHtml = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';
      }

      if (!post) continue;

      const dict = getDictionary(targetLocale);
      const relatedPosts = await fetchRelated(post, targetLocale);

      pages.push({
        path: `/${targetLocale}/blog/${slug}`,
        template: 'blogDetail',
        locals: {
          dict,
          locale: targetLocale,
          post,
          relatedPosts,
          clusters: CLUSTERS,
          contentHtml,
          fallback: targetLocale !== originalLocale,
          originalLocale,
        },
        page: {
          title: `${post.title} | DIDI.BIKE Blog`,
          description: post.metaDescription || post.excerpt || '',
          canonical: `/${targetLocale}/blog/${slug}`,
          ogImage: post.cover || '/images/og-image.jpg',
          activeNav: 'blog',
          bodyClass: null,
        }
      });
    }
  }

  return pages;
}

// 导出异步构建的站点定义
export const getSiteDefinition = async (): Promise<SiteDefinition> => {
  const pages = await generatePages();
  const dictEn = getDictionary('en');

  return {
    root: ROOT,
    site,
    theme,
    themeOptions: {},
    pages,
    extraAssets: [
      'public/posts-index.json',
      'public/logo-icon.png',
      'public/logo-wordmark.png',
      'public/og-image.png'
    ],
    notFound: {
      path: '/404',
      template: 'notFound',
      locals: {
        dict: dictEn,
        locale: 'en'
      },
      page: {
        title: 'Page Not Found | DIDI.BIKE',
        description: 'The page you requested does not exist.',
        canonical: '/404',
        ogImage: '/images/og-image.jpg',
        activeNav: null,
        bodyClass: null,
      }
    }
  };
};
