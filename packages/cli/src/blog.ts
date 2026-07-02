/**
 * 博客集合（collection）—— 平台级通用能力：把一个 Markdown 草稿目录展开为
 * 「列表页 + N 篇详情页」，并按指定字段计算关联阅读。站点在 site.yaml 声明 collection，
 * 主题提供 list/detail 两个模板，正文与元数据全部来自草稿的 frontmatter + 正文。
 *
 * 通用逻辑放这里；站点专属数据（如作者中文名覆盖）由 site.yaml 的 collection 配置传入。
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import type { BlockInstance, PageDef, PageMeta } from '@matrix/site-kit';

export interface CollectionAuthor {
  id: string;
  name: string;
  bio: string;
}

/** 一篇文章的规范模型（主题 blog-list/blog-detail 模板消费的形状）。 */
export interface CollectionArticle {
  title: string;
  slug: string;
  locale: string;
  publishedAt: string;
  displayDate: string;
  author: CollectionAuthor;
  cluster: string;
  excerpt: string;
  tags: string[];
  contentHtml: string;
  contentMarkdown: string;
}

interface PageMetaTemplate extends Partial<PageMeta> {
  title?: string;
}

export interface CollectionConfig {
  name: string;
  /** 草稿目录，相对站点目录解析。 */
  from: string;
  /** 跳过的文件名（不含 .md），如 sample-article。 */
  exclude?: string[];
  /** 分组字段（关联阅读依据），默认 cluster。 */
  groupBy?: string;
  /** 关联阅读条数上限，默认 3。 */
  relatedLimit?: number;
  /** 作者画像 JSON 目录（{name,bio}），相对站点目录解析。 */
  authorsDir?: string;
  /** 站点专属的作者 name/bio 覆盖，优先级高于 JSON。 */
  authorOverrides?: Record<string, { name: string; bio: string }>;
  /** 作者兜底（JSON 缺失时）。name 缺省用作者 id。 */
  authorDefault?: { name?: string; bio: string };
  list: {
    path: string;
    template: string;
    localsKey?: string; // 注入模板的变量名，默认 articles
    meta: PageMetaTemplate;
  };
  detail: {
    pathPrefix: string;
    template: string;
    localsKey?: string; // 默认 article
    relatedKey?: string; // 默认 relatedArticles
    /** 详情页标题后缀，如 " | e代驾"。 */
    titleSuffix?: string;
    meta: PageMetaTemplate;
  };
}

function resolveAuthor(
  authorId: string | undefined,
  cfg: CollectionConfig,
  siteDir: string
): CollectionAuthor {
  const id = authorId || 'unknown';
  const defName = cfg.authorDefault?.name || id;
  const defBio = cfg.authorDefault?.bio || '';
  let name = authorId || defName;
  let bio = defBio;

  if (authorId && cfg.authorsDir) {
    const p = path.join(path.resolve(siteDir, cfg.authorsDir), `${authorId}.json`);
    if (fs.existsSync(p)) {
      try {
        const j = JSON.parse(fs.readFileSync(p, 'utf-8')) as { name?: string; bio?: string };
        name = j.name || name;
        bio = j.bio || bio;
      } catch {
        /* 忽略坏 JSON，用兜底 */
      }
    }
  }

  const override = authorId ? cfg.authorOverrides?.[authorId] : undefined;
  if (override) {
    name = override.name;
    bio = override.bio;
  }

  return { id, name, bio };
}

/** 加载并解析一个集合的全部文章，按发布日期降序。 */
export function loadArticles(siteDir: string, cfg: CollectionConfig): CollectionArticle[] {
  const dir = path.resolve(siteDir, cfg.from);
  if (!fs.existsSync(dir)) {
    console.warn(`[matrix] collection "${cfg.name}" 草稿目录不存在: ${dir}`);
    return [];
  }
  const exclude = new Set(cfg.exclude || []);
  const articles: CollectionArticle[] = [];

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const base = file.replace(/\.md$/, '');
    if (exclude.has(base) || exclude.has(file)) continue;

    const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
    const { data, content } = matter(raw);
    const slug = (data.slug as string) || base;

    // 正文 markdown → html，并剥离首个 h1（避免与模板标题重复）
    let contentHtml = (marked.parse(content) as string).trim();
    if (contentHtml.startsWith('<h1')) {
      const idx = contentHtml.indexOf('</h1>');
      if (idx !== -1) contentHtml = contentHtml.slice(idx + 5).trim();
    }

    const pubAt =
      data.publishedAt instanceof Date
        ? data.publishedAt.toISOString()
        : String(data.publishedAt || new Date().toISOString());

    articles.push({
      title: (data.title as string) || '无标题',
      slug,
      locale: (data.locale as string) || 'zh',
      publishedAt: pubAt,
      displayDate: pubAt.slice(0, 10),
      author: resolveAuthor(data.author as string | undefined, cfg, siteDir),
      cluster: (data.cluster as string) || 'general',
      excerpt: (data.excerpt as string) || '',
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      contentHtml,
      contentMarkdown: content,
    });
  }

  articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return articles;
}

/** 组装 PageMeta：collection 配置的 meta 模板 + 站点默认值。 */
function meta(
  route: string,
  tmpl: PageMetaTemplate,
  defaults: Partial<PageMeta>,
  overrides: Partial<PageMeta>
): PageMeta {
  const m = { ...defaults, ...tmpl, ...overrides };
  return {
    title: m.title || '',
    description: m.description || '',
    keywords: m.keywords,
    canonical: m.canonical ?? route,
    ogTitle: m.ogTitle,
    ogDescription: m.ogDescription,
    ogImage: m.ogImage || '',
    ogImageAlt: m.ogImageAlt,
    activeNav: m.activeNav ?? null,
    bodyClass: m.bodyClass ?? null,
    priority: m.priority,
    changefreq: m.changefreq,
    jsonLd: m.jsonLd ?? null,
    blocks: m.blocks as BlockInstance[] | undefined,
  };
}

/** 把一个 collection 展开为 [列表页, ...详情页] 的 PageDef 数组。 */
export function expandCollection(
  siteDir: string,
  cfg: CollectionConfig,
  defaults: Partial<PageMeta>
): PageDef[] {
  const articles = loadArticles(siteDir, cfg);
  const groupBy = cfg.groupBy || 'cluster';
  const relatedLimit = cfg.relatedLimit ?? 3;
  const listKey = cfg.list.localsKey || 'articles';
  const detailKey = cfg.detail.localsKey || 'article';
  const relatedKey = cfg.detail.relatedKey || 'relatedArticles';

  const pages: PageDef[] = [];

  // 列表页
  pages.push({
    path: cfg.list.path,
    template: cfg.list.template,
    locals: { [listKey]: articles },
    page: meta(cfg.list.path, cfg.list.meta, defaults, {}),
  });

  // 详情页
  for (const article of articles) {
    const route = `${cfg.detail.pathPrefix}/${article.slug}`;
    const related = articles
      .filter(
        (a) =>
          (a as unknown as Record<string, unknown>)[groupBy] ===
            (article as unknown as Record<string, unknown>)[groupBy] && a.slug !== article.slug
      )
      .slice(0, relatedLimit);

    const title = `${article.title}${cfg.detail.titleSuffix || ''}`;
    pages.push({
      path: route,
      template: cfg.detail.template,
      locals: { [detailKey]: article, [relatedKey]: related },
      page: meta(route, cfg.detail.meta, defaults, {
        title,
        description: cfg.detail.meta.description || article.excerpt,
      }),
    });
  }

  return pages;
}
