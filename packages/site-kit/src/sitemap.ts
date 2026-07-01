import type { PageDef } from './types';

/** 从页面清单生成 sitemap.xml（单语言站点）。 */
export function generateSitemap(baseUrl: string, pages: PageDef[]): string {
  const base = baseUrl.replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10);

  const urls = pages
    .map((p) => {
      const loc = `${base}${p.page.canonical}`;
      const priority = (p.page.priority ?? (p.path === '/' ? 1.0 : 0.7)).toFixed(1);
      const changefreq = p.page.changefreq ?? 'monthly';
      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** 生成 robots.txt，并声明 sitemap 位置。 */
export function generateRobots(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '');
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${base}/sitemap.xml`, ''].join('\n');
}
