# @matrix/theme-dossier — 工程档案主题

内容矩阵的可复用主题（类 WordPress theme）。浅色技术纸底 + 蓝图网格 + Archivo/JetBrains Mono +
单一朱红标注强调色 + 近方角。设计规范见 `themes/dossier/docs/DESIGN.md`。

## 构成

- `theme.ts` — 主题清单（`ThemeManifest`）：token 默认值 + 命名模板注册表 + 资源路径。
- `theme.css` — 全部基于 CSS 自定义属性编写（`:root{}` 由 site-kit 注入，不在此文件）。
- `client/app.ts` → `public/app.js` — 主题交互（移动端导航、滚动渐入、表单）。
- `views/layout.njk` · `partials/` · `templates/{home,404}.njk` — 布局与页面模板。

## 激活（站点侧）

```ts
import { dossier } from '@matrix/theme-dossier';

export const siteDefinition: SiteDefinition = {
  root: ROOT,
  site,                       // 内容（见下方契约）
  theme: dossier,
  themeOptions: {},           // 可覆盖任意 token，如 { '--accent': '#1f5fbf' }
  pages: [{ path: '/', template: 'home', page: { /* meta */ } }],
  notFound: { path: '/404', template: 'notFound', page: { /* meta */ } },
};
```

## 内容契约（theme 期望的 `site` 字段）

`home.njk` 期望站点 `site` 提供以下形状（与 WP 主题期望特定字段一致）：

- `brand` `{ name, desc, favicon }`
- `nav[]` `{ key, text, href }`、`cta` `{ text, href }`
- `fdeSteps[]` `{ num, title, desc, subItems[] }`
- `teamModels[]` `{ name, role, desc, points[] }`
- `portfolio[]` `{ ref, title, clientType, region, metrics, desc, charts[], bulletPoints[] }`
  - `charts[]` `{ title, beforeLabel, beforeVal, beforeRatio, afterLabel, afterVal, afterRatio, delta, lowerIsBetter? }`
- `faqs[]` `{ question, answer }`
- `footer` `{ columns[], legal, social[] }`

复用主题的新站点提供同形状内容即可获得相同排版；通过 `themeOptions` 覆盖 token 即可换色/换字。

## 可覆盖的 token

见 `theme.ts` 的 `tokens`：`--paper* / --ink* / --muted / --line* / --grid / --accent* /
--font-* / --r-* / --container / --ease`。

## 构建

```bash
npm run build -w @matrix/theme-dossier   # 编译 theme.ts → dist/ 且 client → public/app.js
```
改动主题后需重新构建，站点再 export。
