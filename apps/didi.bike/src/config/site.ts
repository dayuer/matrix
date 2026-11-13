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
  // 合作推广位（VoiceBridge）。只在 locales 列出的语言下渲染（VoiceBridge 不支持印尼语）。
  // 三个广告位：bar=博客页顶部通栏（可关闭），card=文章正文后原生卡片，footer=全站页脚合作条。
  // 链接会自动追加 ?ct=didi-<slot> 便于在 App Store Connect 区分来源。
  promo: {
    enabled: true,
    locales: ['en'],
    name: 'VoiceBridge',
    url: 'https://apps.apple.com/app/id6777320238',
    // 素材取自 VoiceBridge iOS 工程（~/sproot/translate）：AppIcon 与 2.1.1 英文 Watch 商店截图
    icon: '/images/vb-icon.png',
    image: '/images/vb-watch-recording.png',
    imageAlt: 'VoiceBridge on Apple Watch: recording in progress, 8:12, with Idea and Flag buttons',
    bar: {
      enabled: true,
      label: 'Sponsored',
      text: 'VoiceBridge — tap your Apple Watch, talk through the ride, get searchable notes on your iPhone.',
      cta: 'View on App Store',
    },
    card: {
      enabled: true,
      label: 'Sponsored · From our partners',
      title: 'Your post-ride debrief, written for you.',
      body: 'VoiceBridge records with one tap on Apple Watch — coach debriefs, bike-fit sessions, the thoughts you have after an interval set. Back on your iPhone it transcribes on device, tells speakers apart and pulls out the to-dos. Your audio never leaves your phone.',
      points: [
        'Tap-to-record on Apple Watch',
        'On-device transcription & speaker separation',
        'Heart-rate curve on your daily timeline',
      ],
      meta: 'iPhone + Apple Watch · iOS 18+',
      cta: 'Download on the App Store',
    },
    footer: {
      enabled: true,
      label: 'Partner app',
      text: 'VoiceBridge, the AI note taker on your wrist. Record on Apple Watch, transcribe on iPhone, audio stays on device.',
      cta: 'Get it on the App Store',
    },
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
