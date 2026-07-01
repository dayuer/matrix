import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

export interface Author {
  id: string;
  name: string;
  bio: string;
}

export interface Article {
  title: string;
  slug: string;
  locale: string;
  publishedAt: string;
  displayDate: string;
  author: Author;
  cluster: string;
  excerpt: string;
  tags: string[];
  contentHtml: string;
  contentMarkdown: string;
}

const DRAFTS_DIR = path.resolve(__dirname, '../../../../docs/edaijia-drafts');
const AUTHORS_DIR = path.resolve(__dirname, '../../../../config/authors');

// 缓存文章以提高多次渲染时的性能
let cachedArticles: Article[] = [];

/**
 * 加载并解析所有本地的 Markdown 文章
 */
export function loadAllArticles(): Article[] {
  if (cachedArticles.length > 0) {
    return cachedArticles;
  }

  if (!fs.existsSync(DRAFTS_DIR)) {
    console.warn(`[blog] 草稿目录不存在: ${DRAFTS_DIR}`);
    return [];
  }

  const files = fs.readdirSync(DRAFTS_DIR);
  const articles: Article[] = [];

  for (const file of files) {
    if (!file.endsWith('.md') || file === 'sample-article.md' || file === 'redundancy_report.md') {
      continue;
    }

    const filePath = path.join(DRAFTS_DIR, file);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContent);

      const slug = data.slug || file.replace(/\.md$/, '');
      
      // 读取并解析作者画像信息 (EEAT)
      let authorInfo: Author = {
        id: data.author || 'unknown',
        name: data.author || '官方编辑',
        bio: 'e代驾安全合规与智能算法研究运营团队',
      };

      if (data.author) {
        const authorPath = path.join(AUTHORS_DIR, `${data.author}.json`);
        if (fs.existsSync(authorPath)) {
          try {
            const authorRaw = fs.readFileSync(authorPath, 'utf8');
            const authorJson = JSON.parse(authorRaw);
            
            // 设定中文译名对照，以便更好地符合中文语境
            const chineseNames: Record<string, { name: string; bio: string }> = {
              analyst: { name: '王建国', bio: 'e代驾资深运营数据分析师，专注于代驾定价模型、供需平衡算法与出行热力分析。' },
              journalist: { name: '李明', bio: 'e代驾安全合规运营专家，长期深耕代驾保险理赔政策、交通安全法规与责任划分规则。' },
              pm: { name: '陈经理', bio: 'e代驾企业服务（B2B）产品线负责人，致力于二手车商及金融机构车辆履约效率提升。' },
              academic: { name: '张华', bio: 'e代驾司机运营及服务质量研究员，长期从事代驾司机准入培训、实操路考与服务标准规范设计。' },
            };

            const mapping = chineseNames[data.author];
            authorInfo = {
              id: data.author,
              name: mapping ? mapping.name : authorJson.name,
              bio: mapping ? mapping.bio : authorJson.bio,
            };
          } catch (e) {
            // fallback
          }
        }
      }

      // 将 Markdown 转为 HTML
      const rawHtml = marked.parse(content) as string;

      // 移除首个 h1 标题，避免与模板中的 title 重复渲染
      let contentHtml = rawHtml.trim();
      if (contentHtml.startsWith('<h1')) {
        const h1CloseIdx = contentHtml.indexOf('</h1>');
        if (h1CloseIdx !== -1) {
          contentHtml = contentHtml.slice(h1CloseIdx + 5).trim();
        }
      }

      const pubAt = data.publishedAt instanceof Date
        ? data.publishedAt.toISOString()
        : String(data.publishedAt || new Date().toISOString());

      const displayDate = pubAt.slice(0, 10);

      articles.push({
        title: data.title || '无标题文章',
        slug,
        locale: data.locale || 'zh',
        publishedAt: pubAt,
        displayDate,
        author: authorInfo,
        cluster: data.cluster || 'general',
        excerpt: data.excerpt || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        contentHtml,
        contentMarkdown: content,
      });
    } catch (err) {
      console.error(`[blog] 解析 Markdown 文件失败: ${file}`, err);
    }
  }

  // 按照发布日期降序排序
  articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  cachedArticles = articles;
  return cachedArticles;
}

/**
 * 根据 slug 获取单篇文章详情
 */
export function getArticleBySlug(slug: string): Article | null {
  const all = loadAllArticles();
  const match = all.find(a => a.slug === slug);
  return match || null;
}

/**
 * 根据 Topic Cluster 筛选文章列表
 */
export function getArticlesByCluster(cluster: string): Article[] {
  const all = loadAllArticles();
  return all.filter(a => a.cluster === cluster);
}

/**
 * 获取文章关联的推荐阅读（同分类下排除当前文章，取最多 limit 篇）
 */
export function getRelatedArticles(currentArticle: Article, limit = 3): Article[] {
  const all = loadAllArticles();
  return all
    .filter(a => a.cluster === currentArticle.cluster && a.slug !== currentArticle.slug)
    .slice(0, limit);
}
