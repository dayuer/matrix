/**
 * 内容矩阵共享类型 —— 所有站点通用的结构。
 * 站点专属的内容模型（如 synon 的 FDE 步骤、案例）在各自 app 的 types.ts 中扩展 BaseSiteConfig。
 */

export type { BlockInstance, CustomHtmlBlockData } from '@matrix/blocks';
import type { BlockInstance } from '@matrix/blocks';

export interface NavItem {
  key: string;
  text: string;
  href: string;
}

export interface FooterLink {
  text: string;
  href: string;
  external?: boolean;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  text: string;
  href?: string;
}

export interface FooterLegal {
  contact: string;
  icp?: { text: string; href: string };
  company: { text: string; href: string };
  foundingYear: number;
}

export interface Brand {
  name: string;
  logo?: string;
  desc: string;
  favicon: string;
}

/** 各站点 site 配置的通用底座，可被扩展。 */
export interface BaseSiteConfig {
  baseUrl: string;
  brand: Brand;
  nav: NavItem[];
  cta: { text: string; href: string };
  footer: {
    columns: FooterColumn[];
    legal: FooterLegal;
    social: SocialLink[];
  };
}

export interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage: string;
  ogImageAlt?: string;
  activeNav: string | null;
  bodyClass: string | null;
  /** sitemap 权重/更新频率，可选 */
  priority?: number;
  changefreq?: string;
  jsonLd?: Record<string, unknown> | null;
  /** 页面内容块（可选）：由内容层组装，主题通用模板据此按 block.type 分发渲染。 */
  blocks?: BlockInstance[];
}

export interface PageDef {
  path: string;
  template: string;
  locals?: Record<string, unknown>;
  page: PageMeta;
}

/** 一个主题的清单：模板集 + 设计 token 默认值 + 资源。 */
export interface ThemeManifest {
  id: string;
  name: string;
  /** 主题包根目录，通常 path.resolve(__dirname, '..')（清单编译进 dist/）。 */
  dir: string;
  /** 基础布局，相对 views/，如 'layout.njk'。 */
  layout: string;
  /** 命名模板 → 相对 views/ 的文件路径。 */
  templates: Record<string, string>;
  /** CSS 自定义属性默认值：{ '--paper': '#faf9f6', ... } */
  tokens: Record<string, string>;
  /** 主题样式文件，相对 dir，如 'theme.css'。 */
  css: string;
  /** 主题客户端脚本产物，相对 dir，如 'public/app.js'。 */
  clientJs?: string;
  /** 主题自带 favicon 兜底路径（可选）。 */
  defaultFavicon?: string;
}

/** 一个站点的完整定义：根目录 + 配置 + 页面清单 + 404。 */
export interface SiteDefinition {
  /** app 根目录（含 views/、style.css、public/、images/），通常是 path.resolve(__dirname, '..') */
  root: string;
  site: BaseSiteConfig;
  pages: PageDef[];
  notFound: PageDef;
  /** 激活的主题（可选）。未设置时站点用自有 views/ + style.css（向后兼容）。 */
  theme?: ThemeManifest;
  /** 覆盖主题 token 的子集，如 { '--accent': '#1f5fbf' }。 */
  themeOptions?: Record<string, string>;
  /** 导出时额外需要拷贝到 out/ 根的文件（相对 root），如自定义脚本、清单等 */
  extraAssets?: string[];
}
