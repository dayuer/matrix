# @matrix/site-kit

内容矩阵的**共享内核**。把此前每个站点各自复制一份的运行时逻辑收敛到一处，让新站点退化为
「一份 `site` 配置 + 一份内容模板 + 一份 `style.css`」。

## 提供什么

| 模块 | 作用 |
|---|---|
| `types` | 所有站点通用的 `BaseSiteConfig` / `PageDef` / `PageMeta` 等结构 |
| `createEnv` | 统一的 Nunjucks 环境（全局变量、模板搜索路径、缓存策略） |
| `createServer` / `startServer` | 用一份站点定义直接起 Express（含静态资源、sitemap/robots、404） |
| `exportSite` | 一次产出 `out/`：页面 + 404 + style.css + app.js + images + sitemap.xml + robots.txt |
| `generateSitemap` / `generateRobots` | 单语言站点的 SEO 产物 |
| `deploy/deploy.template.sh` | 参数化部署 + SSL 引导，站点只需声明 `SITE_DOMAIN` |

## 站点接入（三行）

```ts
// apps/<site>/src/export.ts
import { exportSite } from '@matrix/site-kit';
import { siteDefinition } from './config/site-def';
exportSite(siteDefinition);
```

```ts
// apps/<site>/src/server.ts
import { startServer } from '@matrix/site-kit';
import { siteDefinition } from './config/site-def';
startServer(siteDefinition);
```

**表现层（`views/` + `style.css`）仍归各站点自有** —— 矩阵共享的是管道，不是长相。
每个站点可以有完全不同的设计语言，只共用渲染/导出/部署的机械逻辑。

## 构建

```bash
npm run build -w @matrix/site-kit    # 产出 dist/
```

各 app 的 `export`/`dev` 通过 `tsx` 运行，会解析到编译后的 `dist/`。
CI/部署前请确保先构建本包。
