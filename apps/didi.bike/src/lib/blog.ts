/**
 * Enterprise Decoupled Static Data Provider — didi.bike blog markdown data layer
 * Reads directly from local docs/didi.bike-drafts/ folder.
 * Completely decommissions PocketBase.
 * Implements Decoupled Static Body Chunking (writing body HTML directly to public/blog-html/)
 * Features a placeholder-protected Server-Side JIT KaTeX compiler to ensure clean math formula rendering.
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import katex from 'katex';

import type { Post, PostList } from '../types/blog';
import type { Locale } from '../types/i18n';

const DRAFTS_DIR = path.resolve('../../docs/didi.bike-drafts');
const PUBLIC_DIR = path.resolve('./public');
const BLOG_HTML_DIR = path.resolve('./public/blog-html');

let cachedPosts: Post[] = [];

/**
 * Pre-compiles all Markdown bodies and dumps them directly as physical static html chunks.
 * Features a strict placeholder protection mechanism to shield LaTeX math blocks from Markdown parser corruption.
 */
function dumpStaticHtmlChunks(slug: string, locale: string, rawContent: string) {
  if (!rawContent) return;
  try {
    if (!fs.existsSync(BLOG_HTML_DIR)) {
      fs.mkdirSync(BLOG_HTML_DIR, { recursive: true });
    }
    const htmlPath = path.join(BLOG_HTML_DIR, `${slug}-${locale}.html`);

    const mathBlocks: { formula: string; displayMode: boolean }[] = [];

    // Phase 1: Shield block equations $$...$$
    let placeholderText = rawContent.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
      const id = mathBlocks.length;
      mathBlocks.push({ formula, displayMode: true });
      return `<!-- MATH_BLOCK_PLACEHOLDER_${id} -->`;
    });

    // Phase 2: Shield inline equations \(...\)
    placeholderText = placeholderText.replace(/\\\(([\s\S]+?)\\\)/g, (match, formula) => {
      const id = mathBlocks.length;
      mathBlocks.push({ formula, displayMode: false });
      return `<!-- MATH_BLOCK_PLACEHOLDER_${id} -->`;
    });

    // Phase 2.5: Shield block equations \[...\]
    placeholderText = placeholderText.replace(/\\\[([\s\S]+?)\\\]/g, (match, formula) => {
      const id = mathBlocks.length;
      mathBlocks.push({ formula, displayMode: true });
      return `<!-- MATH_BLOCK_PLACEHOLDER_${id} -->`;
    });

    // Phase 4: Parse markdown safely
    let compiled = marked.parse(placeholderText) as string;

    // Phase 5: Re-inject and compile LaTeX to KaTeX HTML elements
    compiled = compiled.replace(/<!-- MATH_BLOCK_PLACEHOLDER_(\d+) -->/g, (match, indexStr) => {
      const idx = parseInt(indexStr, 10);
      const block = mathBlocks[idx];
      if (!block) return match;
      try {
        return katex.renderToString(block.formula.trim(), {
          displayMode: block.displayMode,
          throwOnError: false,
        });
      } catch (err) {
        console.error('KaTeX rendering error during compilation:', err);
        return block.formula;
      }
    });

    // Phase 6: Inject interactive links to References
    compiled = compiled
      .replace(
        /<em>Journal of Sports Sciences<\/em>/g,
        '<a href="https://www.tandfonline.com/toc/rjsp20/current" target="_blank" rel="noopener noreferrer" style="color: var(--color-accent); text-decoration: underline;">Journal of Sports Sciences</a>'
      )
      .replace(
        /<em>DIDI\.BIKE Technical Reprints<\/em>/g,
        '<a href="/technology" style="color: var(--color-accent); text-decoration: underline;">DIDI.BIKE Technical Reprints</a>'
      )
      .replace(
        /<em>UCI Cycling Regulations<\/em>/g,
        '<a href="https://www.uci.org/inside-uci/constitutions-regulations/regulations" target="_blank" rel="noopener noreferrer" style="color: var(--color-accent); text-decoration: underline;">UCI Cycling Regulations</a>'
      )
      .replace(
        /<em>Swiss Federal Institute of Sport Magglingen<\/em>/g,
        '<a href="https://scholar.google.com/scholar?q=High-altitude+hypoxic+adaptation+and+cardiorespiratory+kinetics" target="_blank" rel="noopener noreferrer" style="color: var(--color-accent); text-decoration: underline;">Swiss Federal Institute of Sport Magglingen</a>'
      );

    fs.writeFileSync(htmlPath, compiled, 'utf8');
  } catch (err) {
    console.error(`Failed to dump static HTML chunk for ${slug}`, err);
  }
}

/**
 * Reads all Markdown files, compiles frontmatter metadata (without heavy HTML parsing),
 * then generates a lightweight search index under public/posts-index.json.
 */
export function loadAllPosts(): Post[] {
  if (cachedPosts.length > 0) return cachedPosts;

  if (typeof window !== 'undefined' || !fs.existsSync(DRAFTS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(DRAFTS_DIR);
  const posts: Post[] = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(DRAFTS_DIR, file);
    const fileStat = fs.statSync(filePath);

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data, content: rawContent } = matter(fileContent);

      const slug = data.slug || file.replace(/\.md$/, '');
      const locale: Locale = data.locale === 'id' ? 'id' : 'en';

      // Dump physical HTML chunk immediately during build-time loader pass
      dumpStaticHtmlChunks(slug, locale, rawContent);

      const post: Post = {
        id: file.replace(/\.md$/, ''),
        collectionId: 'posts',
        created: fileStat.birthtime.toISOString(),
        updated: fileStat.mtime.toISOString(),
        published: true,
        publishedAt: data.publishedAt || fileStat.birthtime.toISOString(),
        title: data.title || file.replace(/\.md$/, ''),
        slug,
        excerpt: data.metaDescription || data.excerpt || '',
        content: '', // Omit to secure absolute zero React Fiber heap size
        locale,
        cluster: data.cluster || undefined,
        isPillar: !!data.isPillar,
        pillarSlug: data.pillarSlug || undefined,
        metaTitle: data.metaTitle || data.title,
        metaDescription: data.metaDescription || data.excerpt || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        cover: data.cover || '',
        faqJson: data.faqJson || undefined,
      };

      posts.push(post);
    } catch (err) {
      console.error(`Failed to parse markdown: ${file}`, err);
    }
  }

  // Sort by publishedAt descending
  posts.sort((a, b) => new Date(b.publishedAt || '').getTime() - new Date(a.publishedAt || '').getTime());
  cachedPosts = posts;

  // Generate lightweight search index for Client-Side Search
  try {
    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }
    const indexPosts = posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      locale: p.locale,
      cluster: p.cluster,
      isPillar: p.isPillar,
      publishedAt: p.publishedAt,
      tags: p.tags,
    }));
    fs.writeFileSync(
      path.join(PUBLIC_DIR, 'posts-index.json'),
      JSON.stringify(indexPosts, null, 2),
      'utf8'
    );
  } catch (err) {
    console.error('Failed to write posts-index.json', err);
  }

  return cachedPosts;
}

export async function fetchPosts(
  page = 1,
  perPage = 20,
  opts: { locale?: Locale; cluster?: string; q?: string } = {}
): Promise<PostList> {
  const allPosts = loadAllPosts();
  const locale = opts.locale === 'id' ? 'id' : 'en';

  let filtered = allPosts.filter((p) => p.locale === locale);

  if (opts.cluster) {
    filtered = filtered.filter((p) => p.cluster === opts.cluster);
  }

  if (opts.q) {
    const q = opts.q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q)
    );
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const items = filtered.slice((page - 1) * perPage, page * perPage);

  return {
    items,
    totalPages,
    totalItems,
    page,
  };
}

export async function fetchPost(slug: string, locale?: Locale): Promise<Post | null> {
  const allPosts = loadAllPosts();
  const localeWant = locale === 'id' ? 'id' : 'en';
  const match = allPosts.find((p) => p.slug === slug && p.locale === localeWant);
  return match || null;
}

export async function fetchPostLocales(slug: string): Promise<('en' | 'id')[]> {
  const allPosts = loadAllPosts();
  const matches = allPosts.filter((p) => p.slug === slug);
  const locales = matches.map((p) => p.locale);
  return locales.length > 0 ? (Array.from(new Set(locales)) as ('en' | 'id')[]) : ['en'];
}

export async function fetchPillar(cluster: string, locale?: Locale): Promise<Post | null> {
  const allPosts = loadAllPosts();
  const localeWant = locale === 'id' ? 'id' : 'en';
  const match = allPosts.find((p) => p.cluster === cluster && p.isPillar && p.locale === localeWant);
  return match || null;
}

export async function fetchPillars(locale?: Locale): Promise<Post[]> {
  const allPosts = loadAllPosts();
  const localeWant = locale === 'id' ? 'id' : 'en';
  return allPosts.filter((p) => p.isPillar && p.locale === localeWant);
}

export async function fetchRelated(post: Post, locale?: Locale, limit = 4): Promise<Post[]> {
  const allPosts = loadAllPosts();
  const localeWant = locale === 'id' ? 'id' : 'en';
  if (!post.cluster) return [];

  return allPosts
    .filter((p) => p.cluster === post.cluster && p.slug !== post.slug && p.locale === localeWant)
    .slice(0, limit);
}

export async function fetchClusterPosts(
  cluster: string,
  locale?: Locale,
  excludeSlug?: string,
  includeMatrix = false
): Promise<Post[]> {
  const allPosts = loadAllPosts();
  const localeWant = locale === 'id' ? 'id' : 'en';

  let filtered = allPosts.filter((p) => p.cluster === cluster && p.locale === localeWant);
  if (excludeSlug) {
    filtered = filtered.filter((p) => p.slug !== excludeSlug);
  }
  return filtered;
}

export async function fetchBlogSlugs(): Promise<
  { slug: string; locale: 'en' | 'id'; publishedAt: string }[]
> {
  const allPosts = loadAllPosts();
  return allPosts.map((p) => ({
    slug: p.slug,
    locale: p.locale === 'id' ? 'id' : 'en',
    publishedAt: p.publishedAt || '',
  }));
}

export async function fetchTags(): Promise<string[]> {
  const allPosts = loadAllPosts();
  const tagSet = new Set<string>();
  allPosts.forEach((p) => {
    if (Array.isArray(p.tags)) p.tags.forEach((t) => tagSet.add(t));
  });
  return [...tagSet].sort();
}

export function fileUrl(record: Post, filename: string): string | null {
  return filename;
}
