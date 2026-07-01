import type { BaseSiteConfig } from '@matrix/site-kit';

const baseUrl = (process.env.SITE_BASE_URL || 'https://didi.bike').replace(/\/$/, '');

// didi.bike 站点单源基础配置，对齐 site-kit 规范
export const site: BaseSiteConfig & Record<string, any> = {
  baseUrl,
  brand: {
    name: 'DIDI.BIKE',
    desc: 'Professional cycling telemetry sensor for real-time aerodynamic profiling and biomechanics analysis.',
    favicon: '/favicon.ico',
  },
  nav: [
    { key: 'sensor', text: 'The Sensor', href: '/#sensor' },
    { key: 'technology', text: 'Technology', href: '/technology' },
    { key: 'specs', text: 'Specs', href: '/specs' },
    { key: 'use-cases', text: 'Use Cases', href: '/use-cases' },
    { key: 'faq', text: 'FAQ', href: '/faq' },
    { key: 'blog', text: 'Blog', href: '/blog' },
    { key: 'about', text: 'About', href: '/about' },
  ],
  cta: {
    text: 'Get Sensor',
    href: '/#contact'
  },
  footer: {
    columns: [],
    social: [],
    legal: {
      company: {
        text: 'DIDI.BIKE Technology Inc.',
        href: '#',
      },
      foundingYear: 2026,
      contact: 'info@didi.bike'
    }
  }
};

export default site;
