import 'dotenv/config';
import path from 'path';
import express, { type Request, type Response, type NextFunction } from 'express';
import compression from 'compression';
import { createEnv } from '@matrix/site-kit';
import { journal as theme } from '@matrix/theme-journal';

import site from './config/site';
import faq from './data/faq';
import partner from './data/partner';
import { loadAllArticles, getArticleBySlug, getRelatedArticles } from './lib/blog';

import type { PageDef } from './types';
import { createApiRouter } from './api/index';
import { getDeps } from './adapters/index';
import { deviceMiddleware } from './lib/device';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ASSET_VERSION = process.env.ASSET_VERSION || String(Date.now());

// 项目根目录：dev 下 __dirname=src，编译后 __dirname=dist，两者上一级都是项目根
const ROOT = path.resolve(__dirname, '..');

// ── Nunjucks（表现层来自 @matrix/theme-journal，经 site-kit 主题感知环境加载） ──
const env = createEnv(ROOT, {
  site,
  basePath: (process.env.BASE_PATH || '').replace(/\/$/, ''),
  assetVersion: ASSET_VERSION,
  noCache: process.env.NODE_ENV !== 'production',
  theme,
});
env.express(app);
app.set('view engine', 'njk');

// ── 全局中间件 ──
app.use(compression());
app.use(deviceMiddleware);

// ── BFF API（须在静态资源 / 页面路由之前挂载，避免被遮蔽） ──
// JSON body parser 已移入 API router 内部，仅对 /api 路由生效
app.use('/api', createApiRouter(getDeps()));

// 访问日志（开发模式下打印每个请求的状态码和路径）
app.use((req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    const status = res.statusCode;
    if (status >= 400) {
      console.log(`[${status}] ${req.method} ${req.originalUrl}`);
    }
  });
  next();
});

// 全局模板变量（site/assetVersion/currentYear/basePath）已由 createEnv 注入为 env 全局；
// 逐请求的 res.locals.device 仍由 deviceMiddleware 提供。

// ── 静态资源 ──
// 品牌图片仍归 app；样式与客户端脚本来自主题包 @matrix/theme-journal。
const oneYear = { maxAge: '365d', immutable: true } as const;
const THEME_DIR = theme.dir;
app.use('/images', express.static(path.join(ROOT, 'images'), oneYear));
app.get('/style.css', (_req: Request, res: Response) => res.sendFile(path.join(THEME_DIR, 'theme.css')));
app.get('/theme.css', (_req: Request, res: Response) => res.sendFile(path.join(THEME_DIR, 'theme.css')));
// 客户端 TS 编译产物（主题包内）
app.get('/app.js', (_req: Request, res: Response) => res.sendFile(path.join(THEME_DIR, 'public', 'app.js')));
app.get('/order.js', (_req: Request, res: Response) => res.sendFile(path.join(THEME_DIR, 'public', 'order.js')));
app.get('/order-status.js', (_req: Request, res: Response) => res.sendFile(path.join(THEME_DIR, 'public', 'order-status.js')));
// favicon：浏览器自动请求，重定向到外部 favicon
app.get('/favicon.ico', (_req: Request, res: Response) => res.redirect(301, 'https://www.edaijia.cn/img/favicon20151021.ico'));

// ── 拦截浏览器翻译插件产生的 /en 等语言前缀路径，301 回首页 ──
app.get(/^\/(?:en|zh|ja|ko|fr|de|es|pt|ru|ar|hi)\b/, (_req: Request, res: Response) => res.redirect(301, '/'));

// ── 页面定义（单一来源，循环注册路由） ──
const ORG_JSONLD: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'e代驾',
  legalName: '北京亿心宜行汽车技术开发服务有限公司',
  url: site.baseUrl + '/',
  logo: site.baseUrl + '/images/logo.png',
  image: site.baseUrl + '/images/bento-service-driver.png',
  description: 'e代驾提供酒后代驾、跨城送车、代保养代检车等服务，覆盖全国 300+ 城市，实惠更安全，代驾行业国家标准主笔单位。',
  foundingDate: '2011',
  slogan: '您的车，放心交给我们',
  areaServed: 'CN',
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '95139',
      contactType: 'customer service',
      areaServed: 'CN',
      availableLanguage: 'zh-CN',
    },
  ],
  sameAs: ['https://weibo.com/edaijia'],
};

// ── 首页与下单页配置 ──
const INDEX_PAGE_CONFIG = {
  title: 'e代驾 — 您的车，放心交给我们',
  description: 'e代驾 — 您的车，放心交给我们。酒后代驾、跨城送车、代保养代检车，覆盖全国300+城市，实惠更安全。',
  keywords: 'e代驾,代驾,酒后代驾,二手车履约,车管家,商务代驾,代保养,代检车',
  canonical: '/',
  ogImage: '/images/bento-service-driver.png',
  ogImageAlt: 'e代驾专业代驾司机',
  activeNav: null,
  bodyClass: null,
  jsonLd: ORG_JSONLD,
};

const ORDER_PAGE_CONFIG = {
  title: '叫代驾 | e代驾 — 您的车，放心交给我们',
  description: '在线叫代驾，说一句话即可下单，酒后代驾安全到家。',
  keywords: 'e代驾,代驾,酒后代驾,叫代驾,在线下单',
  canonical: '/order',
  ogImage: '/images/bento-service-driver.png',
  activeNav: null,
  bodyClass: 'order-page-body',
  jsonLd: ORG_JSONLD,
};

app.get('/', (req: Request, res: Response) => {
  const device = res.locals.device || 'desktop';
  if (device === 'mobile') {
    res.render('pages/index-mobile.njk', { page: INDEX_PAGE_CONFIG });
  } else {
    res.render('pages/index.njk', { page: INDEX_PAGE_CONFIG, faq });
  }
});
app.get('/index.html', (_req: Request, res: Response) => res.redirect(301, '/'));

// ── 其他页面 ──
const pages: PageDef[] = [
  {
    path: '/questions',
    template: 'pages/questions.njk',
    legacy: '/questions.html',
    locals: { faq },
    page: {
      title: '常见问答 - FAQ | e代驾 — 您的车，放心交给我们',
      description: '您关心的e代驾服务收费、违规交通处理、发票开具、消单规则及代驾司机到达耗时等问题，在此提供官方权威的解答。',
      ogTitle: '常见问答 - FAQ | e代驾',
      canonical: '/questions',
      ogImage: '/images/bento-service-driver.png',
      activeNav: 'questions',
      bodyClass: 'subpage',
    },
  },
  {
    path: '/partner',
    template: 'pages/partner.njk',
    legacy: '/partner.html',
    locals: { partner },
    page: {
      title: '城市加盟与合伙人计划 | e代驾 — 您的车，放心交给我们',
      description: '加入e代驾城市加盟与合伙人计划，享受品牌、技术、运营、流量全方位支持，与我们共建本地代驾生态。',
      ogTitle: '城市加盟与合伙人计划 | e代驾',
      canonical: '/partner',
      ogImage: '/images/bento-service-driver.png',
      activeNav: 'partner',
      bodyClass: 'subpage',
    },
  },
  {
    path: '/entry',
    template: 'pages/entry.njk',
    legacy: '/entry.html',
    page: {
      title: '司机招募 | e代驾 — 您的车，放心交给我们',
      description: '成为e代驾司机：时间自由、收入丰厚、保障齐全、智能派单。扫码报名，开启你的代驾事业。',
      ogTitle: '司机招募 | e代驾',
      canonical: '/entry',
      ogImage: '/images/bento-service-driver.png',
      activeNav: 'entry',
      bodyClass: 'subpage',
    },
  },
  {
    path: '/serves',
    template: 'pages/serves.njk',
    legacy: '/serves.html',
    page: {
      title: '商务合作 | e代驾 — 您的车，放心交给我们',
      description: 'e代驾商务合作：代驾抵用券、后台连接端口、集团VIP账户，为企业提供一站式商务代驾解决方案。',
      ogTitle: '商务合作 | e代驾',
      canonical: '/serves',
      ogImage: '/images/bento-service-driver.png',
      activeNav: 'serves',
      bodyClass: 'subpage',
    },
  },
];

// 注册页面路由 + 旧 .html 的 301 重定向
pages.forEach((p) => {
  app.get(p.path, (_req: Request, res: Response) => {
    res.render(p.template, { page: p.page, ...(p.locals || {}) });
  });
  if (p.legacy) {
    app.get(p.legacy, (_req: Request, res: Response) => res.redirect(301, p.path));
  }
});

// ── 叫车下单链路页面 ──
app.get('/order', (_req: Request, res: Response) => {
  res.render('pages/order.njk', { page: ORDER_PAGE_CONFIG });
});

app.get('/order/status/:token', (req: Request, res: Response) => {
  res.render('pages/order-status.njk', {
    page: {
      title: '订单状态 | e代驾',
      description: '查看您的代驾订单实时状态。',
      canonical: `/order/status/${req.params.token}`,
      ogImage: '/images/bento-service-driver.png',
      activeNav: null,
      bodyClass: 'status-page-body',
    },
    queryToken: req.params.token,
  });
});

// ── 博客与内容矩阵页面 ──
app.get('/blog', (_req: Request, res: Response) => {
  const articles = loadAllArticles();
  res.render('pages/blog-list.njk', {
    page: {
      title: '代驾行业资讯与前沿洞察 | e代驾 — 您的车，放心交给我们',
      description: 'e代驾行业洞察频道：聚焦代驾出行行业动态、车险增值服务标准化、智能驾驶人机协同及车辆履约等前沿深度研究与指南。',
      canonical: '/blog',
      ogImage: '/images/bento-service-driver.png',
      activeNav: 'blog',
      bodyClass: 'subpage',
    },
    articles,
  });
});

app.get('/blog/:slug', (req: Request, res: Response, next: NextFunction) => {
  const article = getArticleBySlug(req.params.slug);
  if (!article) {
    return next(); // 404
  }
  const relatedArticles = getRelatedArticles(article, 3);
  res.render('pages/blog-detail.njk', {
    page: {
      title: `${article.title} | e代驾 — 您的车，放心交给我们`,
      description: article.excerpt,
      canonical: `/blog/${article.slug}`,
      ogImage: '/images/bento-service-driver.png',
      activeNav: 'blog',
      bodyClass: 'subpage',
    },
    article,
    relatedArticles,
  });
});

// robots.txt
app.get('/robots.txt', (_req: Request, res: Response) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${site.baseUrl}/sitemap.xml\n`);
});

// sitemap.xml
app.get('/sitemap.xml', (_req: Request, res: Response) => {
  const urls = pages.map((p) => `  <url><loc>${site.baseUrl}${p.path}</loc></url>`).join('\n');
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
});

// 404
app.use((req: Request, res: Response) => {
  res.status(404).render('pages/404.njk', {
    page: {
      title: '页面未找到 | e代驾',
      description: '',
      canonical: req.path,
      ogImage: '/images/bento-service-driver.png',
      activeNav: null,
      bodyClass: 'subpage',
    },
  });
});

app.listen(PORT, () => {
  console.log(`e代驾 server running at http://localhost:${PORT}  (assetVersion=${ASSET_VERSION})`);
});
