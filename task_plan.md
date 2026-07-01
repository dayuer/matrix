# didi.bike to site-kit Themes Refactoring Plan

本项目旨在将 `apps/didi.bike` 中的 React + CSS 页面与组件结构转换并重写为 site-kit 通用的 Themes 模式，存放在 `themes/didi` 中，并使用 Express 服务端驱动运行。

## 任务分解与检查清单

- [x] **Phase 1: CSS 融合与 Vanilla CSS 提取**
  - [x] 分析 `apps/didi.bike/app/globals.css` 中的全局变量和样式。
  - [x] 依次分析 `components/*.module.css` 的 CSS Modules 样式，去除混淆类名，转换为干净的 kebab-case 统一类名。
  - [x] 将所有 CSS 融合，成功生成 `themes/didi/theme.css`。
- [x] **Phase 2: 布局模板转换 (`layout.tsx` -> `base.njk`)**
  - [x] 提取 `apps/didi.bike/app/[locale]/layout.tsx` 的 HTML 骨架。
  - [x] 确保在 `base.njk` 中引入 Archivo 和 JetBrains Mono 字体，支持多语言、Canonical, Alternates, JSON-LD 等 SEO 元素。
  - [x] 支持动态注入的 `themeTokensCss` 和 `theme.css`。
  - [x] 写入 `themes/didi/views/layouts/base.njk`。
- [x] **Phase 3: 首页及局部组件转换**
  - [x] 转换 navbar, footer, hero, pillars, sensor, ecosystem, business, contact 局部模板并写入到 `themes/didi/views/partials/` 下。
  - [x] 转换首页 `app/[locale]/page.tsx` + 各板块组件，生成 `themes/didi/views/pages/index.njk`。
- [x] **Phase 4: 子页面及 404 转换**
  - [x] 转换 `about` 页面 -> `themes/didi/views/pages/about.njk`
  - [x] 转换 `specs` 页面 -> `themes/didi/views/pages/specs.njk`
  - [x] 转换 `technology` 页面 -> `themes/didi/views/pages/technology.njk`
  - [x] 转换 `use-cases` 页面 -> `themes/didi/views/pages/use-cases.njk`
  - [x] 转换 `faq` 页面 -> `themes/didi/views/pages/faq.njk`
  - [x] 转换 `legal` 页面 -> `themes/didi/views/pages/legal.njk`
  - [x] 转换 `blog` 列表及详情 -> `themes/didi/views/pages/blog-list.njk` 与 `blog-detail.njk`
  - [x] 转换 404 页面 -> `themes/didi/views/pages/404.njk`
- [x] **Phase 5: 主题描述文件及验证**
  - [x] 创建 `themes/didi/theme.ts` 以定义主题的配置与注册信息。
  - [x] 编写 `themes/didi/client/app.ts` 提供粒子画布、wiki 搜索、滚动等丰富客户端交互，并通过 `tsconfig.client.json` 顺利编译为 `public/app.js`。
  - [x] 重写并对齐 `apps/didi.bike` 的 Express 应用定义 `src/site-def.ts` 及 `src/config/site.ts`。
  - [x] 编译并通过了全量静态导出冒烟测试 (`npm run export -w didi-bike-website`)，共计生成 100+ 个多语言及博客静态文件。
  - [x] 更新 `AGENTS.md` 描述新主题。
