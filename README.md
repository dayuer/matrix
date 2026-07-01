# Matrix — 内容矩阵网站生产系统

一个用于批量生产、质检、管理与自动化发布静态站点的**内容矩阵生产系统**。基于 npm workspaces：
矩阵共享一套发布内核（`packages/site-kit`），每个站点退化为「一份 `site` 配置 + 内容 + 一份 `style.css`」，
可拥有完全不同的设计语言。

## 目录结构

```text
.
├── packages/
│   └── site-kit/           # 共享发布内核：Nunjucks 渲染运行时、静态导出、
│                           #   sitemap/robots 生成、参数化部署模板、通用类型、主题解析
├── themes/                 # 可复用主题（类 WordPress）：布局 + 样式 + 交互 + token
│   ├── dossier/            # 工程档案主题（synon.ai 激活）
│   ├── arrfunds/           # ARR 金融主题（arrfunds 激活）
│   ├── journal/            # journal 激活（企业官网资讯类主题，多页+博客+下单，表现层）
│   └── didi/               # didi 激活（didi.bike 独立暗色科技风主题表现层）
├── apps/                   # 各站点（激活主题；Express+Nunjucks）
│   ├── arrfunds/           # ARR Funds AI 订阅收入投资基金官网（Express+Nunjucks）
│   ├── didi.bike/          # DIDI.BIKE — 骑行遥测传感器官网（Express+Nunjucks，多语言）
│   ├── edaijia/            # e代驾 — 代驾行业资讯与洞察站点（Express+Nunjucks + 本地 Markdown 博客）
│   └── synon.ai/           # Synon Global — 全球化 FDE 交付与 AI 重构平台（Express+Nunjucks，工程档案设计）
├── config/                 # 全局配置层（作者 authors / 关键词库等）
├── docs/                   # 内容源（Markdown 草稿库）
├── scripts/                # 离线工具（sitemap 生成、内容质检）
└── package.json            # 根 workspaces 配置
```

## 发布内核 `@matrix/site-kit`

以前每个 Express 站点都各自复制一份 `server.ts` / `export.ts` / 部署脚本 / 类型定义，改动要改 N 遍。
现已收敛为共享内核，站点接入只需三行：

```ts
// apps/<site>/src/export.ts
import { exportSite } from '@matrix/site-kit';
import { siteDefinition } from './site-def';
exportSite(siteDefinition);
```

一次 `exportSite` 产出 `out/`：页面 + 404 + `style.css` + `app.js` + `images/` + `sitemap.xml` + `robots.txt`。
详见 [packages/site-kit/README.md](packages/site-kit/README.md)。

## 主题系统 `themes/`（类 WordPress）

表现层（布局 + 样式 + 交互）可进一步以**主题**为单位复用。一个主题 = 模板集 + 设计 token 默认值 +
`theme.css`（全基于 CSS 自定义属性）+ 客户端 JS。站点「激活」主题并覆盖部分 token 即可：

```ts
theme: dossier,
themeOptions: { '--accent': '#1f5fbf' },   // 仅改强调色，排版/结构不变
pages: [{ path: '/', template: 'home', page: { /* meta */ } }],
```

site-kit 合并 `theme.tokens` 与 `themeOptions` 注入 `:root{}`，因此同一主题可被多个站点复用、各自换色换字
（类似 WP customizer / theme.json）。三个 Express 站点均已激活各自主题、只剩「内容 + 激活」：

| 站点 | 主题 | 说明 |
|---|---|---|
| `synon.ai` | `themes/dossier` | 单页落地页，工程档案风；`themeOptions` 覆盖 token 可换色 |
| `arrfunds` | `themes/arrfunds` | 单页落地页，深绿金融风 |
| `edaijia` | `themes/journal` | **完整应用**（多页 + 博客 + 下单 + 设备分流）——应用逻辑仍在 app，主题只承载表现层 |
| `didi.bike` | `themes/didi` | **完整应用**（多语言 + 博客/Wiki + 遥测分析 + FAQ，黑白科技风） |

详见各主题 README（如 [themes/dossier/README.md](themes/dossier/README.md)、[themes/journal/README.md](themes/journal/README.md)）。

> **矩阵共享的是发布管道与可复用主题**——落地页站点激活主题即得整套外观；应用型站点（edaijia / didi.bike）
> 保留自己的服务器/路由/API，仅把表现层交给主题。

## 部署脚本与主题构建

各站点的 `deploy/deploy.sh` 在导出前都会先执行
[packages/site-kit/deploy/build-themes.sh](packages/site-kit/deploy/build-themes.sh)：
自动读取该站点 `package.json` 里所有 `@matrix/theme-*` 依赖并逐个 `npm run build -w <theme>`，
确保发布的是主题包最新编译产物（而不是 app 侧早已不存在的 `build:client`，或磁盘上残留的旧
`dist/`/`public/`）。新增主题化站点无需改部署脚本——只要在 `package.json` 声明主题依赖即可。

## 质检与内容 (`config/`, `docs/`, `scripts/`)

- `config/authors/` — 统一的作者身份/背景元数据。
- `config/edaijia-keywords.json` — 代驾行业关键词库。
- `docs/*-drafts/` — 各站点 Markdown 草稿库。
- `scripts/generate-sitemap.mjs` — 离线扫描 Markdown 生成多语言 sitemap（didi.bike / edaijia）。
- `scripts/verify-edaijia-articles.mjs` — edaijia 稿件的 Frontmatter / SEO / 合规质检。

> 注：早期基于 PocketBase 的同步管道 (`publish-articles.mjs`) 已下线，全部改为本地 Markdown 直读构建。

## 快速开始

```bash
npm install
npm run build -w @matrix/site-kit     # 先构建共享内核

# Express 系列站点（synon.ai / arrfunds / edaijia / didi.bike）
cd apps/synon.ai && npm run dev        # 本地开发
npm run export                         # 静态导出到 out/
```
