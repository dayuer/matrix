// 全站共享类型定义

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
  icp: { text: string; href: string };
  police: { text: string; href: string };
  company: { text: string; href: string };
  foundingYear: number;
}

export interface Brand {
  name: string;
  hotline: string;
  logo: string;
  desc: string;
  favicon: string;
  appStoreUrl?: string;
  androidApkUrl?: string;
  userRuleUrl?: string;
  driverAgreementUrl?: string;
  infoAgreementUrl?: string;
}

export type AnalyticsProvider = 'none' | 'ga4' | 'baidu' | 'sensors';

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  id: string;
}

export interface SiteConfig {
  baseUrl: string;
  brand: Brand;
  nav: NavItem[];
  cta: { text: string; href: string };
  footer: {
    columns: FooterColumn[];
    legal: FooterLegal;
    social: SocialLink[];
  };
  analytics: AnalyticsConfig;
}

export interface FaqItem {
  q: string;
  /** answer 为 HTML 片段（可含 <br>），模板用 | safe 渲染 */
  a: string;
}

export interface Manager {
  avatar: string;
  name: string;
  title: string;
  phone: string;
  wechat?: string;
  email: string;
  regions?: string;
}

export interface SupportCard {
  title: string;
  desc: string;
  /** SVG 内部元素，外层 <svg> 由模板包裹 */
  icon: string;
}

export interface PartnerData {
  support: SupportCard[];
  managers: Manager[];
}

/** 每个页面传给模板的元数据 */
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
  jsonLd?: Record<string, unknown> | null;
}

/** 路由 + 页面定义 */
export interface PageDef {
  path: string;
  template: string;
  legacy?: string;
  locals?: Record<string, unknown>;
  page: PageMeta;
}
