/**
 * 站点加载器 —— 平台的核心：把一个纯数据目录（sites/<站点>）翻译为 SiteDefinition。
 *
 *   sites/<站点>/
 *     site.yaml            品牌/导航/页脚 + theme 选择 + 各页 meta 默认值
 *     content/*.yaml       结构化页面：meta + blocks 数组
 *     content/*.md         文档页面：frontmatter(meta) + Markdown 正文 → custom-html block
 *     images/ public/ …    静态资源（由 site-kit 导出管线处理）
 *
 * 之后交给 @matrix/site-kit 现有的 createServer / exportSite，渲染管线零特判。
 */
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import matter from 'gray-matter';
import { marked } from 'marked';
import type {
  BaseSiteConfig,
  BlockInstance,
  PageDef,
  PageMeta,
  SiteDefinition,
  ThemeManifest,
  ThemeOptions,
} from '@matrix/site-kit';
import { expandCollection, type CollectionConfig } from './blog';

/** site.yaml 的形状：BaseSiteConfig + 平台字段。 */
interface SiteYaml extends BaseSiteConfig {
  theme?: string;
  themeOptions?: ThemeOptions;
  extraAssets?: string[];
  cssAliases?: string[];
  /** 页面 meta 的站点级默认值（ogImage、changefreq 等）。 */
  defaults?: Partial<PageMeta>;
  /** 博客/文档等集合：从草稿目录展开为列表页 + 详情页。 */
  collections?: CollectionConfig[];
}

/** content 文件（yaml 或 md frontmatter）里允许的页面级字段。 */
interface ContentDoc {
  path?: string;
  template?: string;
  meta?: Partial<PageMeta> & { title?: string };
  blocks?: BlockInstance[];
  /** 透传给模板的额外变量（如 journal 主题的 faq / partner）。 */
  locals?: Record<string, unknown>;
}

function fail(file: string, msg: string): never {
  throw new Error(`[matrix] ${file}: ${msg}`);
}

/** 按 id 解析主题包：theme: dossier → @matrix/theme-dossier 的清单导出。 */
function resolveTheme(id: string, siteFile: string): ThemeManifest {
  const pkg = `@matrix/theme-${id}`;
  let mod: Record<string, unknown>;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = require(pkg);
  } catch {
    fail(siteFile, `无法加载主题 "${id}"（${pkg}）。请确认 themes/${id} 存在且已构建（npm run build -w ${pkg}）。`);
  }
  const manifest = (mod.default ?? mod[id] ?? Object.values(mod)[0]) as ThemeManifest | undefined;
  if (!manifest || !manifest.dir || !manifest.layout) {
    fail(siteFile, `主题包 ${pkg} 未导出合法的 ThemeManifest。`);
  }
  return manifest;
}

/** 文件相对路径（去扩展名）→ 路由：home → /，about → /about，guides/faq → /guides/faq。 */
function routeFromFile(rel: string): string {
  const noExt = rel.replace(/\.(ya?ml|md)$/i, '');
  if (noExt === 'home' || noExt === 'index') return '/';
  return '/' + noExt.split(path.sep).join('/');
}

/** 组装 PageMeta：显式 meta > 站点默认值 > 从路由推导（canonical）。 */
function buildMeta(
  file: string,
  route: string,
  meta: (Partial<PageMeta> & { title?: string }) | undefined,
  defaults: Partial<PageMeta>
): PageMeta {
  const m = { ...defaults, ...(meta || {}) };
  if (!m.title) fail(file, '缺少必填字段 meta.title');
  if (!m.description) fail(file, '缺少必填字段 meta.description');
  if (!m.ogImage) fail(file, '缺少 meta.ogImage（可在 site.yaml 的 defaults.ogImage 设置站点默认值）');
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    canonical: m.canonical ?? route,
    ogTitle: m.ogTitle,
    ogDescription: m.ogDescription,
    ogImage: m.ogImage,
    ogImageAlt: m.ogImageAlt,
    activeNav: m.activeNav ?? null,
    bodyClass: m.bodyClass ?? null,
    priority: m.priority,
    changefreq: m.changefreq,
    jsonLd: m.jsonLd ?? null,
    lang: m.lang,
    blocks: m.blocks,
  };
}

/** 单个内容文件 → PageDef。md 正文编译为 custom-html block（即 WordPress 的 the_content）。 */
function loadContentFile(contentDir: string, rel: string, defaults: Partial<PageMeta>): PageDef {
  const file = path.join(contentDir, rel);
  const raw = fs.readFileSync(file, 'utf-8');
  const isMd = /\.md$/i.test(rel);

  let doc: ContentDoc;
  let blocks: BlockInstance[];
  if (isMd) {
    const { data, content } = matter(raw);
    const { path: p, template, blocks: fmBlocks, ...meta } = data as ContentDoc & Record<string, unknown>;
    doc = { path: p, template, meta: meta as ContentDoc['meta'] };
    blocks = [
      ...((fmBlocks as BlockInstance[] | undefined) || []),
      { type: 'custom-html', data: { html: marked.parse(content) as string } },
    ];
  } else {
    doc = (yaml.load(raw) as ContentDoc) || {};
    blocks = doc.blocks || [];
  }

  const isNotFound = /^404\.(ya?ml|md)$/i.test(rel);
  const route = doc.path ?? (isNotFound ? '/404' : routeFromFile(rel));
  const template = doc.template ?? (isNotFound ? 'notFound' : route === '/' ? 'home' : 'page');
  const meta = buildMeta(file, route, doc.meta, defaults);
  if (blocks.length > 0) meta.blocks = blocks;

  const def: PageDef = { path: route, template, page: meta };
  if (doc.locals && Object.keys(doc.locals).length > 0) def.locals = doc.locals;
  return def;
}

/** 把 sites/<站点> 纯数据目录加载为 SiteDefinition。 */
export function loadSite(siteDir: string): SiteDefinition {
  const root = path.resolve(siteDir);
  const siteFile = path.join(root, 'site.yaml');
  if (!fs.existsSync(siteFile)) fail(siteFile, '不存在。一个站点目录至少需要 site.yaml。');

  const raw = (yaml.load(fs.readFileSync(siteFile, 'utf-8')) || {}) as SiteYaml;
  const {
    theme: themeId,
    themeOptions,
    extraAssets,
    cssAliases,
    defaults = {},
    collections = [],
    ...site
  } = raw;
  if (!site.baseUrl) fail(siteFile, '缺少必填字段 baseUrl');
  if (!site.brand?.name) fail(siteFile, '缺少必填字段 brand.name');
  if (!Array.isArray(site.nav)) fail(siteFile, '缺少必填字段 nav（数组）');
  if (!site.footer) fail(siteFile, '缺少必填字段 footer');

  const contentDir = path.join(root, 'content');
  if (!fs.existsSync(contentDir)) fail(contentDir, '不存在。页面内容放在 content/ 下（*.yaml 或 *.md）。');

  const rels: string[] = [];
  (function walk(dir: string) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ya?ml|md)$/i.test(e.name)) rels.push(path.relative(contentDir, p));
    }
  })(contentDir);
  if (rels.length === 0) fail(contentDir, '没有任何内容文件（*.yaml / *.md）。');

  const pages: PageDef[] = [];
  let notFound: PageDef | undefined;
  for (const rel of rels.sort()) {
    const def = loadContentFile(contentDir, rel, defaults);
    if (def.template === 'notFound' || def.path === '/404') notFound = def;
    else pages.push(def);
  }
  if (!notFound) fail(contentDir, '缺少 404 页（content/404.yaml 或 404.md）。');

  // 集合（博客等）：从草稿目录展开为列表页 + 详情页
  for (const cfg of collections) {
    pages.push(...expandCollection(root, cfg, defaults));
  }

  if (pages.length === 0) fail(contentDir, '除 404 外没有任何页面。');

  return {
    root,
    site: site as BaseSiteConfig,
    pages,
    notFound,
    theme: themeId ? resolveTheme(themeId, siteFile) : undefined,
    themeOptions,
    extraAssets,
    cssAliases,
  };
}
