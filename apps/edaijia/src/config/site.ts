import type { SiteConfig, AnalyticsProvider } from '../types';

/**
 * 全站单一真源：导航、页脚、品牌、埋点。
 * 所有"出现在多个页面"的内容只在这里维护一次，杜绝复制粘贴导致的不一致。
 */

const baseUrl = (process.env.SITE_BASE_URL || 'https://www.edaijia.cn').replace(/\/$/, '');

const site: SiteConfig = {
  baseUrl,

  brand: {
    name: 'e代驾',
    hotline: '95139',
    logo: '/images/logo.png',
    desc: '您的车，放心交给我们。实惠更安全，美好车生活。',
    favicon: 'https://www.edaijia.cn/img/favicon20151021.ico',
    appStoreUrl: 'https://apps.apple.com/cn/app/e-dai-jia/id468591734',
    androidApkUrl: 'https://d.edaijia.cn/client/edaijia_v9.18.3.apk',
    userRuleUrl: 'https://www.edaijia.cn/userrule.html',
    driverAgreementUrl: 'https://www.edaijia.cn/edj-agreement.html',
    infoAgreementUrl: 'https://www.edaijia.cn/agreement.html',
  },

  nav: [
    { key: 'order', text: '叫代驾', href: '/order' },
    { key: 'blog', text: '行业洞察', href: '/blog' },
    { key: 'questions', text: '常见问答', href: '/questions' },
    { key: 'partner', text: '城市加盟', href: '/partner' },
    { key: 'entry', text: '司机招募', href: '/entry' },
    { key: 'serves', text: '商务合作', href: '/serves' },
  ],
  cta: { text: '下载 App', href: '/#download' },

  footer: {
    columns: [
      {
        title: '服务',
        links: [
          { text: '酒后代驾', href: '/#services' },
          { text: '车辆履约', href: '/#services' },
          { text: '车管家', href: '/#services' },
          { text: '商务代驾', href: 'https://www.edaijia.cn/business.html', external: true },
        ],
      },
      {
        title: '合作',
        links: [
          { text: '企业 VIP 办理', href: 'https://www.edaijia.cn/vip.html', external: true },
          { text: '商务合作', href: '/serves' },
          { text: '城市加盟', href: '/partner' },
          { text: '司机招募', href: '/entry' },
        ],
      },
      {
        title: '关于',
        links: [
          { text: '关于 e代驾', href: '/#trust' },
          { text: '发展历程', href: '/#timeline' },
          { text: '常见问答', href: '/questions' },
          { text: '法律条款', href: 'https://www.edaijia.cn/platform-rules.html', external: true },
        ],
      },
    ],
    legal: {
      contact: 'VIP 办理 010-6439-2767（10:00-19:00）· 司机咨询 010-58103866',
      icp: { text: '京ICP备13048976号-1', href: 'https://beian.miit.gov.cn' },
      police: {
        text: '京公网安备 11010502030468号',
        href: 'http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11010502030468',
      },
      company: {
        text: '北京亿心宜行汽车技术开发服务有限公司',
        href: 'http://h5.edaijia.cn/user-app-client/deleteAccount/companyCertificate.html',
      },
      foundingYear: 2011,
    },
    social: [
      { text: '微博 @e代驾', href: 'http://weibo.com/edaijia?s=6cm7D0' },
      { text: '微信号 edaijia' },
    ],
  },

  analytics: {
    provider: (process.env.ANALYTICS_PROVIDER as AnalyticsProvider) || 'none',
    id: process.env.ANALYTICS_ID || '',
  },
};

export default site;
