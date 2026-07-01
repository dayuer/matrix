/**
 * 静态导出脚本：将 Nunjucks 模板预渲染为纯 HTML，用于 GitHub Pages 部署。
 *
 * 用法：npx tsx src/export.ts
 * 产物：out/ 目录，可直接推送至 GitHub Pages
 */

import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { createEnv } from '@matrix/site-kit';
import { journal as theme } from '@matrix/theme-journal';

import site from './config/site';
import faq from './data/faq';
import partner from './data/partner';
import type { PageDef } from './types';
import { loadAllArticles, getRelatedArticles } from './lib/blog';

// ── 配置 ──
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'out');
const ASSET_VERSION = String(Date.now());

// GitHub Pages 基础路径（通过环境变量注入，默认为根路径）
const BASE_PATH = (process.env.BASE_PATH || '').replace(/\/$/, '');

// ── Nunjucks（表现层来自 @matrix/theme-journal，经 site-kit 主题感知环境加载） ──
const env = createEnv(ROOT, {
  site,
  basePath: BASE_PATH,
  assetVersion: ASSET_VERSION,
  noCache: true,
  theme,
});

// ── 页面定义（复用 server.ts 的结构） ──
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

const pages: PageDef[] = [
  {
    path: '/',
    template: 'pages/index.njk',
    locals: { faq },
    page: {
      title: 'e代驾 — 您的车，放心交给我们',
      description: 'e代驾 — 您的车，放心交给我们。酒后代驾、跨城送车、代保养代检车，覆盖全国300+城市，实惠更安全。',
      keywords: 'e代驾,代驾,酒后代驾,二手车履约,车管家,商务代驾,代保养,代检车',
      canonical: '/',
      ogImage: '/images/bento-service-driver.png',
      ogImageAlt: 'e代驾专业代驾司机',
      activeNav: null,
      bodyClass: null,
      jsonLd: ORG_JSONLD,
    },
  },
  {
    path: '/questions',
    template: 'pages/questions.njk',
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

// 动态载入博客草稿文章，并加入到静态导出列表中
const articles = loadAllArticles();

pages.push({
  path: '/blog',
  template: 'pages/blog-list.njk',
  locals: { articles },
  page: {
    title: '代驾行业资讯与前沿洞察 | e代驾 — 您的车，放心交给我们',
    description: 'e代驾行业洞察频道：聚焦代驾出行行业动态、车险增值服务标准化、智能驾驶人机协同及车辆履约等前沿深度研究与指南。',
    canonical: '/blog',
    ogImage: '/images/bento-service-driver.png',
    activeNav: 'blog',
    bodyClass: 'subpage',
  }
});

for (const article of articles) {
  pages.push({
    path: `/blog/${article.slug}`,
    template: 'pages/blog-detail.njk',
    locals: { 
      article, 
      relatedArticles: getRelatedArticles(article, 3) 
    },
    page: {
      title: `${article.title} | e代驾 — 您的车，放心交给我们`,
      description: article.excerpt,
      canonical: `/blog/${article.slug}`,
      ogImage: '/images/bento-service-driver.png',
      activeNav: 'blog',
      bodyClass: 'subpage',
    }
  });
}

// ── 工具函数 ──
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src: string, dest: string): void {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── 执行导出 ──
console.log('🚀 开始静态导出...\n');

// 清空输出目录
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
ensureDir(OUT);

// 1. 渲染页面
for (const p of pages) {
  const html = env.render(p.template, { page: p.page, ...(p.locals || {}) });

  if (p.path === '/') {
    fs.writeFileSync(path.join(OUT, 'index.html'), html);
    console.log('  ✅ / → out/index.html');
  } else {
    const dir = path.join(OUT, p.path.slice(1));
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    console.log(`  ✅ ${p.path} → out${p.path}/index.html`);
  }
}

// 2. 404 页面
const html404 = env.render('pages/404.njk', {
  page: {
    title: '页面未找到 | e代驾',
    description: '',
    canonical: '/404',
    ogImage: '/images/bento-service-driver.png',
    activeNav: null,
    bodyClass: 'subpage',
  },
});
fs.writeFileSync(path.join(OUT, '404.html'), html404);
console.log('  ✅ 404.html');

// 3. 复制静态资源（样式与客户端脚本来自主题包 @matrix/theme-journal）
fs.copyFileSync(path.join(theme.dir, 'theme.css'), path.join(OUT, 'style.css'));
fs.copyFileSync(path.join(theme.dir, 'theme.css'), path.join(OUT, 'theme.css'));
console.log('  ✅ theme.css (+ style.css 兼容别名)');

// 客户端 JS（主题包内，先确保编译过）
const appJsSrc = path.join(theme.dir, 'public', 'app.js');
if (fs.existsSync(appJsSrc)) {
  fs.copyFileSync(appJsSrc, path.join(OUT, 'app.js'));
  console.log('  ✅ app.js');
} else {
  console.warn('  ⚠️  主题 public/app.js 不存在，请先运行 npm run build -w @matrix/theme-journal');
}

// 图片
copyDir(path.join(ROOT, 'images'), path.join(OUT, 'images'));
console.log('  ✅ images/');

// 4. sitemap.xml
const sitemapUrls = pages
  .map((p) => `  <url><loc>${site.baseUrl}${p.path}</loc></url>`)
  .join('\n');
fs.writeFileSync(
  path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`
);
console.log('  ✅ sitemap.xml');

// 5. robots.txt
fs.writeFileSync(
  path.join(OUT, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${site.baseUrl}/sitemap.xml\n`
);
console.log('  ✅ robots.txt');

// 6. .nojekyll（告诉 GitHub Pages 不要用 Jekyll 处理）
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log('  ✅ .nojekyll');

console.log(`\n🎉 导出完成！共 ${pages.length} 个页面 → out/\n`);
