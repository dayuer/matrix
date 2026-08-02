import type { PageDef } from './types';

/** 从页面清单生成 sitemap.xml。逐页 lastmod 与 hreflang alternates 均可选。 */
export function generateSitemap(baseUrl: string, pages: PageDef[]): string {
  const base = baseUrl.replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10);
  const hasAlternates = pages.some((p) => (p.page.alternates || []).length > 0);

  const urls = pages
    .map((p) => {
      const loc = `${base}${p.page.canonical}`;
      const priority = (p.page.priority ?? (p.path === '/' ? 1.0 : 0.7)).toFixed(1);
      const changefreq = p.page.changefreq ?? 'monthly';
      const lastmod = p.page.updated ?? today;
      const lines = [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
      ];
      for (const alt of p.page.alternates || []) {
        lines.push(`    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${base}${alt.href}"/>`);
      }
      lines.push('  </url>');
      return lines.join('\n');
    })
    .join('\n');

  const ns = hasAlternates
    ? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
    : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

  return `<?xml version="1.0" encoding="UTF-8"?>\n${ns}\n${urls}\n</urlset>\n`;
}

/** 生成 robots.txt，并声明 sitemap 位置。 */
export function generateRobots(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '');
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${base}/sitemap.xml`, ''].join('\n');
}
