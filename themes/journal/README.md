# @matrix/theme-journal — 企业官网资讯主题（表现层）

内容矩阵主题，承载企业官网资讯站点的**表现层**：多页布局 + Bento 卡片 + 博客模板 + 下单链路视图。

## 与其他主题的不同：这是「应用的表现层」，不是落地页

e代驾是完整应用（设备分流、`/api` BFF、博客、下单状态机、动态路由）。这些**应用逻辑仍在
`apps/edaijia`**，主题只提供 `views/` + `theme.css` + `client/`。`apps/edaijia` 的
`server.ts` / `export.ts` 通过 site-kit 的 `createEnv({ theme })` 加载本主题的视图并注入 token。

## 构成

- `views/layouts/{base,order-base}.njk` — 两套布局（站点主布局 + 下单链路布局）。
- `views/partials/{head,nav,footer,analytics,card-manager}.njk` — 公共分片。
- `views/pages/*.njk` — 11 个页面模板（首页/移动首页/问答/加盟/招募/合作/下单/订单状态/博客列表/详情/404）。
- `theme.css` — 站点样式（该主题不暴露全局 `:root` token，`tokens` 为空）。
- `client/{app,order,order-status}.ts` → `public/{app,order,order-status}.js` — 三个独立脚本包。

## 接入（apps/edaijia）

```ts
import { createEnv } from '@matrix/site-kit';
import { journal as theme } from '@matrix/theme-journal';

const env = createEnv(ROOT, { site, basePath, assetVersion, noCache, theme });
env.express(app);                    // 或 export 场景直接 env.render(...)
// 样式/脚本从 theme.dir 提供：
app.get('/style.css', (_q, r) => r.sendFile(path.join(theme.dir, 'theme.css')));
app.get('/app.js', (_q, r) => r.sendFile(path.join(theme.dir, 'public', 'app.js')));
```

模板由应用以字面路径渲染（如 `res.render('pages/index.njk')`）；设备分流在应用侧选择
`pages/index.njk` 或 `pages/index-mobile.njk`。

## 构建

```bash
npm run build -w @matrix/theme-journal   # 清单 + 三个 client 脚本包
```
改动主题后需重新构建，应用再 dev/export。
