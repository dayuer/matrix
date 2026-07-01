# 设计规范：内容矩阵主题系统（WordPress-style Themes）

- 日期：2026-07-01
- 状态：已批准（approach A）
- 关联：[[matrix-architecture]]、`packages/site-kit`、`apps/synon.ai/docs/DESIGN.md`

## 1. 目标

让矩阵的**表现层（布局 + 样式 + 交互）以「主题」为单位复用**，类似 WordPress：

- 一个 theme = 可复用的模板集 + 设计 token 默认值 + 样式 + 客户端交互。
- 站点通过「激活」一个 theme 并**覆盖部分 token / 提供内容**来构建，不再各自手写 `views/` 与 `style.css`。
- 同一 theme 可被多个站点复用，各站仅通过 token 覆盖（颜色/字体/圆角）产生差异 —— 即 WP customizer 复用能力。
- 主题可换：站点切换 `theme` 即换整套外观。

**首期范围**：在 `site-kit` 中建立主题框架 + 把现有「工程档案」外观抽成 `themes/dossier` + 将 `synon.ai`
改造为激活该主题的站点。`arrfunds` / `edaijia` / `didi.bike` 本期不动。

## 2. 非目标（YAGNI）

- 不做运行时主题切换 UI / 主题市场预览器。
- 不做可视化 customizer 界面（token 覆盖用代码配置即可）。
- 不迁移 arrfunds / edaijia / didi.bike（各自 bespoke，未来可各自成主题）。
- 不引入 CSS 预处理器；主题样式仍是 vanilla CSS + CSS 自定义属性。

## 3. 主题的构成（unit of a theme）

主题是一个 workspace 包，位于 `themes/<id>/`，包名 `@matrix/theme-<id>`：

```
themes/dossier/
  package.json          # name @matrix/theme-dossier；main dist/theme.js
  tsconfig.json         # 编译 theme.ts + client/app.ts
  theme.ts              # 主题清单（manifest）
  theme.css             # 全部基于 CSS 自定义属性编写
  client/app.ts         # 主题交互，编译为 public/app.js
  public/app.js         # 编译产物
  views/
    layout.njk          # 基础文档（head / nav / footer）
    partials/logo.njk
    templates/home.njk
    templates/404.njk
```

主题**不含内容数据**；内容由激活它的站点通过 `site` 配置提供。

## 4. 主题清单（Manifest）

`theme.ts` 默认导出 `ThemeManifest`（类型定义在 site-kit）：

```ts
export interface ThemeManifest {
  id: string;                          // 'dossier'
  name: string;                        // 'Engineering Dossier'
  dir: string;                         // 主题包根目录（path.resolve(__dirname)）
  layout: string;                      // 'layout.njk'（相对 views/）
  templates: Record<string, string>;   // { home: 'templates/home.njk', notFound: 'templates/404.njk' }
  tokens: Record<string, string>;      // CSS 自定义属性默认值：{ '--paper': '#faf9f6', '--accent': '#c6431c', ... }
  css: string;                         // 'theme.css'（相对 dir）
  clientJs?: string;                   // 'public/app.js'（相对 dir，可选）
  defaultFavicon?: string;             // 主题自带的 favicon 兜底（可选）
}
```

`tokens` 是**扁平的 `--var → 值` 映射**（含颜色、字体、圆角）。`theme.css` 只引用这些变量，
因此覆盖某个 token 即可整体换色/换字。

## 5. Token 模型（customizer）

- 主题在 `manifest.tokens` 里给出全部默认值。
- 站点在 `siteDefinition.themeOptions?: Record<string,string>` 里覆盖任意子集。
- site-kit 合并 `{ ...theme.tokens, ...themeOptions }`，生成一段 `:root{ --x: v; ... }`，
  作为 `themeTokensCss` 注入 `layout.njk` 的 `<head>`（内联 `<style>`），排在 `theme.css` 之前。
- 未提供 `themeOptions` 时，站点外观 = 主题默认外观。

**复用证明**：另一个站点激活 `dossier` 并只设 `themeOptions: { '--accent': '#1f5fbf' }`，
即得到同样的工程档案排版、蓝色强调 —— 无需改任何模板或 CSS。

## 6. 模板层级（template hierarchy）

- 页面通过**模板名**引用主题模板，而非文件路径：`page.template = 'home'`。
- site-kit 用 `manifest.templates[name]` 解析到实际文件，渲染时 `{% extends manifest.layout %}`。
- `notFound` 走 `manifest.templates.notFound`。
- 主题模板期望的**内容契约**由主题文档声明（dossier 期望 FDE landing 结构：
  `site.fdeSteps / teamModels / portfolio / faqs / nav / footer / cta / brand`）。
  复用主题的站点必须提供同形状内容（与 WP 主题期望特定字段一致）。

## 7. site-kit 改动（扩展，不推翻）

### 7.1 类型
- 新增 `ThemeManifest`（第 4 节）。
- `SiteDefinition` 增加：`theme?: ThemeManifest`（**可选**）；`themeOptions?: Record<string,string>`。
- `PageDef.template` 支持两种：主题模板名（有 `theme` 时优先按 `manifest.templates[name]` 解析）或
  字面模板路径（如 `pages/index.njk`）。

**向后兼容**：`resolveTemplate` 规则 = 若存在 `theme` 且 `name` 命中 `manifest.templates` 则用主题模板；
否则原样作为字面路径。这样**未接入主题的站点（arrfunds / edaijia）零改动**：不设 `theme`、
`themeOptions`，继续用 `pages/index.njk` 字面路径、自有 `views/` 与 `style.css`，行为与现在完全一致。
`themeTokensCss` 在无主题时为空字符串。

### 7.2 渲染（`render.ts`）
- Nunjucks 搜索路径改为按优先级：`[ path.join(site.root,'views')（若存在，子主题覆盖）, theme.dir/views, site-kit/views ]`。
- 新增全局 `themeTokensCss`（合并后的 `:root{}` 字符串）。
- 新增辅助 `resolveTemplate(theme, name)` → 主题模板相对路径。

### 7.3 运行时 / 导出（`server.ts` / `export.ts`）
- 渲染页面时用 `resolveTemplate` 把 `page.template` 名解析为实际模板。
- 导出资产：
  - `theme.css` → `out/theme.css`
  - `manifest.clientJs`（若有）→ `out/app.js`
  - 站点 `public/app.js`（若有，覆盖主题 JS）→ `out/app.js`
  - 站点 `style.css`（若有，子主题追加样式）→ `out/style.css`
  - 站点 `images/` → `out/images/`
  - `sitemap.xml` / `robots.txt`（不变）
- `layout.njk` 的 `<head>` 顺序：内联 `themeTokensCss` → `theme.css` →（可选）站点 `style.css`。

### 7.4 静态挂载
`server.ts` 需同时挂载主题的 `theme.css` / `app.js` 与站点自有资源；导出侧对应拷贝。

## 8. `themes/dossier` 内容

把 `apps/synon.ai` 现有表现层平移过来并参数化：

- `views/layout.njk` ← 当前 `base.njk`（引用 `themeTokensCss`、`theme.css`）。
- `views/partials/logo.njk` ← 当前 logo 分片。
- `views/templates/home.njk` ← 当前 `index.njk`（`{% extends "layout.njk" %}`）。
- `views/templates/404.njk` ← 当前 404。
- `theme.css` ← 当前 `style.css`，其中 `:root{}` 的 token 值**移入 `manifest.tokens`**，
  `theme.css` 自身删掉 `:root` 定义（改由注入提供），其余选择器不变。
- `client/app.ts` ← 当前 `src/client/app.ts`。
- `theme.ts` ← 声明 tokens（从 DESIGN.md 的调色板/字体/圆角）、templates、layout。

## 9. `apps/synon.ai` 改造后形态

保留：
- `src/config/site.ts`（内容，不变）
- `src/types.ts`（内容模型，仍继承 site-kit）
- `src/site-def.ts`：`import { dossier } from '@matrix/theme-dossier'`；`theme: dossier`；
  `themeOptions: {}`（默认外观即 synon 外观）；`pages[].template: 'home'`；`notFound.template: 'notFound'`。
- `src/server.ts` / `src/export.ts`（仍是三行）
- `images/`（favicon.svg、og-image.svg）

删除：`views/`、`style.css`、`src/client/app.ts`、`public/app.js`（迁入主题）。
`tsconfig.client.json` 与 `build:client` 由主题承担；synon 的 `dev`/`export` 不再需要编译 client。

## 10. 构建与依赖顺序

- 新 workspace glob：`themes/*`。
- 依赖链：`@matrix/theme-dossier` 依赖 `@matrix/site-kit`（类型）；`apps/synon.ai` 依赖二者。
- 构建顺序：`site-kit` → `theme-dossier`（编译 theme.ts + client）→ 站点 export。
- 主题 `build` 脚本：`tsc`（manifest）+ `tsc -p tsconfig.client.json`（client → public/app.js）。

## 11. 验证计划

1. `npm run build -w @matrix/site-kit && npm run build -w @matrix/theme-dossier` 通过。
2. `npm run build:server -w synon-website` typecheck 通过。
3. `npm run export -w synon-website` 产出 `out/`：index/404/sitemap/robots/theme.css/app.js/images。
4. 浏览器（桌面 + 375px）核对 synon.ai 与迁移前**像素级一致**（同一设计，来源变主题）。
5. **复用证明**：临时用 `themeOptions: { '--accent': '#1f5fbf' }` 重导出，确认全站强调色变蓝而排版不变
   （验证后回退）。

## 12. 风险与权衡

- **内容契约耦合**：dossier 模板绑定 FDE landing 内容形状；复用需同形状。可接受（WP 同理），在主题 README 声明。
- **跨包 .ts 运行**：主题编译为 `dist/` + `public/app.js`，站点经 tsx/node 解析编译产物；改主题需先构建。
- **git**：当前工作区非 git 仓库，spec 不提交 git（仅落盘）。
