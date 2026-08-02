import type { PageDef } from './types';

/**
 * XML 文本转义。裸 `&` 会让整份 sitemap.xml 不是良构 XML——Google 不是跳过那一条，
 * 而是拒绝解析整个文件。数据源虽是站点自己的 yaml（可信输入），但这是格式合法性问题，
 * 不是安全问题：一个带 query 的 alternate 链接就能让全站 sitemap 失效。
 */
function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * lastmod 只接受 YYYY-MM-DD 字符串。
 * js-yaml 会把不加引号的 `updated: 2026-08-02` 解析成 Date 对象而非字符串，
 * 而 `??` 只挡 null/undefined，Date 是真值会直接漏进去，产出
 * `<lastmod>Sun Aug 02 2026 07:00:00 GMT+0800 …</lastmod>` 这种非法值，
 * Google 会静默丢弃该 URL 的 lastmod 信号——构建期毫无征兆。
 */
function normalizeLastmod(value: unknown, canonical: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  console.warn(`  ⚠️  ${canonical} 的 updated 不是 YYYY-MM-DD（收到 ${JSON.stringify(value)}），本页 lastmod 回退为导出当天。`);
  return undefined;
}

/** 从页面清单生成 sitemap.xml。逐页 lastmod 与 hreflang alternates 均可选。 */
export function generateSitemap(baseUrl: string, pages: PageDef[]): string {
  const base = baseUrl.replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10);
  const hasAlternates = pages.some((p) => (p.page.alternates || []).length > 0);

  const urls = pages
    .map((p) => {
      const loc = escapeXml(`${base}${p.page.canonical}`);
      const priority = (p.page.priority ?? (p.path === '/' ? 1.0 : 0.7)).toFixed(1);
      const changefreq = escapeXml(p.page.changefreq ?? 'monthly');
      const lastmod = normalizeLastmod(p.page.updated, p.page.canonical) ?? today;
      const lines = [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
      ];
      for (const alt of p.page.alternates || []) {
        lines.push(
          `    <xhtml:link rel="alternate" hreflang="${escapeXml(alt.hreflang)}" href="${escapeXml(`${base}${alt.href}`)}"/>`
        );
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

/**
 * 生成 robots.txt。默认放行全部 UA 并声明 sitemap；
 * 站点可用 site.yaml 的 robots 字段追加自定义规则行（如逐个 AI 爬虫的放行段）。
 */
export function generateRobots(baseUrl: string, extraRules: string[] = []): string {
  const base = baseUrl.replace(/\/$/, '');
  const lines = ['User-agent: *', 'Allow: /'];
  if (extraRules.length > 0) lines.push('', ...extraRules);
  lines.push('', `Sitemap: ${base}/sitemap.xml`, '');
  return lines.join('\n');
}
