#!/usr/bin/env node

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const TARGET_SITE = process.env.TARGET_SITE || 'didi.bike';
const PUBLIC_DIR = path.resolve(process.env.PUBLIC_DIR || `apps/${TARGET_SITE}/public`);
const DRAFTS_DIR = path.resolve(process.env.DRAFTS_DIR || `docs/${TARGET_SITE}-drafts`);
const BASE_URL = process.env.BASE_URL || (TARGET_SITE === 'edaijia' ? 'https://www.edaijia.cn' : 'https://didi.bike');
const LOCALES = ['en', 'id'];
const LIMIT_PER_SITEMAP = 100; // Limit of blog post groups per sitemap

const STATIC_PAGES = [
  { path: '', priority: 1.0, changefreq: 'weekly' },
  { path: '/technology', priority: 0.9, changefreq: 'monthly' },
  { path: '/specs', priority: 0.8, changefreq: 'monthly' },
  { path: '/use-cases', priority: 0.8, changefreq: 'monthly' },
  { path: '/faq', priority: 0.8, changefreq: 'monthly' },
  { path: '/blog', priority: 0.8, changefreq: 'weekly' },
  { path: '/about', priority: 0.7, changefreq: 'monthly' },
  { path: '/legal/privacy-policy', priority: 0.3, changefreq: 'monthly' },
  { path: '/legal/terms-of-service', priority: 0.3, changefreq: 'monthly' },
  { path: '/legal/cookie-policy', priority: 0.3, changefreq: 'monthly' },
  { path: '/legal/trademark-notice', priority: 0.3, changefreq: 'monthly' },
];

function generateUrlXml(path, priority, changefreq, lastmod, locales = LOCALES) {
  let xml = '';
  for (const locale of locales) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/${locale}${path}</loc>\n`;
    if (lastmod) {
      // Normalize lastmod to ISO format date part (YYYY-MM-DD)
      const dateStr = new Date(lastmod).toISOString().slice(0, 10);
      xml += `    <lastmod>${dateStr}</lastmod>\n`;
    }
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority.toFixed(1)}</priority>\n`;
    for (const l of locales) {
      xml += `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}/${l}${path}"/>\n`;
    }
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/en${path}"/>\n`;
    xml += `  </url>\n`;
  }
  return xml;
}

function wrapUrlset(content) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${content}</urlset>\n`;
}

function wrapSitemapIndex(content) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${content}</sitemapindex>\n`;
}

async function cleanOldSitemaps() {
  try {
    const files = await fs.readdir(PUBLIC_DIR);
    for (const file of files) {
      if (file.startsWith('sitemap-blog-') && file.endsWith('.xml')) {
        await fs.unlink(path.join(PUBLIC_DIR, file));
        console.log(`  Removed old sitemap: ${file}`);
      }
    }
  } catch (err) {
    console.error(`  Warning: Failed to clean old sitemaps: ${err.message}`);
  }
}

async function getAllBlogPosts() {
  const all = [];
  if (!existsSync(DRAFTS_DIR)) {
    console.warn(`  Warning: Drafts directory does not exist: ${DRAFTS_DIR}`);
    return all;
  }
  
  const files = await fs.readdir(DRAFTS_DIR);
  for (const file of files) {
    if (!file.endsWith('.md') || file === 'sample-article.md' || file === 'redundancy_report.md') {
      continue;
    }
    try {
      const raw = await fs.readFile(path.join(DRAFTS_DIR, file), 'utf8');
      const { data } = matter(raw);
      const slug = data.slug || file.replace(/\.md$/, '');
      const locale = data.locale || 'en';
      const fileStat = await fs.stat(path.join(DRAFTS_DIR, file));
      const publishedAt = data.publishedAt || fileStat.birthtime.toISOString();
      
      all.push({
        slug,
        locale,
        publishedAt
      });
    } catch (e) {
      console.warn(`  Warning: Failed to parse ${file}: ${e.message}`);
    }
  }
  return all;
}

function aggregatePosts(posts) {
  const bySlug = new Map();
  for (const post of posts) {
    const slug = post.slug;
    const locale = post.locale === 'id' ? 'id' : 'en';
    const publishedAt = post.publishedAt || new Date().toISOString();
    
    const entry = bySlug.get(slug) || { locales: new Set(), publishedAt };
    entry.locales.add(locale);
    if (publishedAt > entry.publishedAt) {
      entry.publishedAt = publishedAt;
    }
    bySlug.set(slug, entry);
  }
  return Array.from(bySlug.entries()).map(([slug, data]) => ({
    slug,
    locales: Array.from(data.locales),
    publishedAt: data.publishedAt
  }));
}

async function main() {
  console.log(`Starting Sitemap Generation from Local Markdown: ${DRAFTS_DIR}`);
  
  // 1. Clean old blog sitemaps
  await cleanOldSitemaps();

  const indexSitemaps = [];
  const todayStr = new Date().toISOString().slice(0, 10);

  // 2. Generate sitemap-pages.xml
  let pagesContent = '';
  for (const page of STATIC_PAGES) {
    pagesContent += generateUrlXml(page.path, page.priority, page.changefreq, new Date());
  }
  const pagesFile = 'sitemap-pages.xml';
  await fs.writeFile(path.join(PUBLIC_DIR, pagesFile), wrapUrlset(pagesContent), 'utf8');
  console.log(`  Created: ${pagesFile}`);
  indexSitemaps.push({ file: pagesFile, lastmod: todayStr });

  // 3. Fetch and aggregate blog posts
  let posts = [];
  try {
    const rawPosts = await getAllBlogPosts();
    posts = aggregatePosts(rawPosts);
    console.log(`  Aggregated ${posts.length} unique blog posts from local drafts.`);
  } catch (err) {
    console.error(`  Warning: Failed to scan posts from local Markdown (${err.message}). Blog sitemaps will be empty.`);
  }

  // 4. Generate paginated sitemap-blog-*.xml files
  const totalPages = Math.ceil(posts.length / LIMIT_PER_SITEMAP);
  for (let i = 0; i < totalPages; i++) {
    const chunk = posts.slice(i * LIMIT_PER_SITEMAP, (i + 1) * LIMIT_PER_SITEMAP);
    let blogContent = '';
    let maxLastMod = '';

    for (const post of chunk) {
      blogContent += generateUrlXml(`/blog/${post.slug}`, 0.7, 'monthly', post.publishedAt, post.locales);
      if (!maxLastMod || post.publishedAt > maxLastMod) {
        maxLastMod = post.publishedAt;
      }
    }

    const blogFile = `sitemap-blog-${i + 1}.xml`;
    await fs.writeFile(path.join(PUBLIC_DIR, blogFile), wrapUrlset(blogContent), 'utf8');
    console.log(`  Created: ${blogFile} (${chunk.length} posts)`);
    indexSitemaps.push({
      file: blogFile,
      lastmod: maxLastMod ? new Date(maxLastMod).toISOString().slice(0, 10) : todayStr
    });
  }

  // 5. Generate sitemap.xml (Sitemap Index)
  let indexContent = '';
  for (const s of indexSitemaps) {
    indexContent += `  <sitemap>\n`;
    indexContent += `    <loc>${BASE_URL}/${s.file}</loc>\n`;
    indexContent += `    <lastmod>${s.lastmod}</lastmod>\n`;
    indexContent += `  </sitemap>\n`;
  }
  await fs.writeFile(path.join(PUBLIC_DIR, 'sitemap.xml'), wrapSitemapIndex(indexContent), 'utf8');
  console.log(`  Created Sitemap Index: sitemap.xml`);
  console.log('Sitemap Generation Complete! 🚀');
}

main().catch(err => {
  console.error('Fatal Error during sitemap generation:', err);
  process.exit(1);
});
