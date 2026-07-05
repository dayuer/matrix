# Architecture Documentation (AGENTS.md)

## 目录结构树

```
matrix/
├── packages/
│   └── site-kit/       # 共享发布内核（各 Express 站点复用）
├── themes/             # 可复用主题（类 WordPress）：布局+样式+交互+token
│   ├── dossier/        # synon.ai 激活（工程档案风）
│   ├── arrfunds/       # arrfunds 激活（深绿金融风）
│   ├── journal/        # journal 激活（企业官网资讯类主题，多页+博客+下单，表现层）
│   ├── didi/           # didi 激活（didi.bike 独立暗色科技风主题表现层）
│   └── yaodriver/      # yaodriver 激活（曜行智能企业 AI 流程再造官网主题）
├── apps/
│   ├── arrfunds/       # ARR Funds AI 订阅收入投资基金官网
│   ├── didi.bike/      # didi.bike 站点
│   ├── edaijia/        # edaijia 代驾行业资讯与前沿洞察站点
│   ├── synon.ai/       # Synon Global 全球化 FDE 交付与 AI 数字化重构平台官网
│   └── yaodriver/      # yaodriver 站点（曜行智能）
├── sites/              # 纯数据驱动与纯静态站点（site.yaml + 配置文件/页面）
│   ├── synon.ai/       # Synon Global 官网（dossier 主题）
│   ├── silkline.id/    # SilkLine 印尼企业数字基础设施平台（arrfunds 主题，EN/ID 双语）
│   └── voicebridge.top/ # VoiceBridge 畅译 App 官网（纯静态 HTML 页面同步）
├── config/             # 全局/子应用配置文件
├── docs/               # 行业洞察、研报与草稿目录
├── scripts/            # 辅助脚本（如网站地图生成等）
├── package.json        # 根目录 npm workspaces 配置
└── AGENTS.md           # 本系统架构文档
```

## 每文件核心职责（一句话）

- `packages/site-kit/src/index.ts`: 共享发布内核入口（createServer / exportSite / sitemap / 通用类型）。
- `packages/site-kit/src/server.ts` · `export.ts`: Express 运行时与静态导出工厂，各站点复用。
- `packages/site-kit/src/theme.ts`: 主题解析（token 合并注入 `buildTokensCss` / 命名模板 `resolveTemplate`）。
- `packages/site-kit/deploy/deploy.template.sh`: 参数化部署 + SSL 引导模板，站点只声明 `SITE_DOMAIN`。
- `themes/<name>/theme.ts`: 主题清单（token 默认值 + 模板注册表 + 资源路径）。dossier/arrfunds 暴露 token；journal `tokens` 为空。
- `themes/<name>/theme.css` · `views/` · `client/`: 主题样式（基于注入 token）、模板与交互。
- `themes/didi/client/app.ts`: didi 主题的客户端交互与 wiki 前端搜索、表单提交逻辑。
- `themes/didi/views/`: didi 主题对应的 Nunjucks 模板集，支持多语言和 SEO。
- `apps/synon.ai`·`apps/arrfunds`/src/site-def.ts: 落地页站点定义（`theme`/`themeOptions` + 页面清单 + 404）。
- `apps/edaijia/src/server.ts`·`export.ts`: 应用型站点，保留路由/API/博客/设备分流，经 `createEnv({ theme })` 加载 `themes/journal`。
- `apps/<site>/src/config/site.ts`: 站点单源内容与配置。
- `apps/<site>/views/` · `style.css`: 站点专属表现层（各站设计语言独立）。
- `apps/synon.ai/docs/DESIGN.md`: Synon Global「工程档案」设计规范（配色/字体/组件/动效）。
- `sites/voicebridge.top/deploy/deploy.sh` · `nginx.conf`: VoiceBridge 官网发布与 Nginx 路由配置。
- `config/authors/` · `config/edaijia-keywords.json`: 全局作者元数据与关键词库。

## 模块间依赖关系

- 各 `apps` 通过 workspace 依赖 `@matrix/site-kit` 复用发布/导出/部署逻辑；表现层各自独立。
- `site-kit` 需先 `npm run build -w @matrix/site-kit` 产出 `dist/`，再运行各站点的 export/dev。
- `didi.bike` 已经成功重构为基于 Express + Nunjucks 的 site-kit 驱动应用，与 dossier/arrfunds 架构对齐。
