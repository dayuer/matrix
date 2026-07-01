# e代驾官网

> 您的车，放心交给我们。

e代驾品牌官网。Express + Nunjucks 服务端渲染，**全 TypeScript** 编写，通用部分（`<head>`、导航、页脚）组件化，重复内容数据化——单一真源，杜绝多页复制粘贴导致的不一致。

## 技术栈

| 层 | 选型 |
|----|------|
| 运行时 | Node.js ≥ 20 |
| 服务端 | Express 4 + TypeScript（编译为 CommonJS） |
| 模板 | Nunjucks（布局继承 + partial + 宏） |
| 客户端 | TypeScript（编译为浏览器 IIFE） |
| 样式 | 手写 `style.css`（Apple 风格设计系统，无构建） |

## 目录结构

```text
src/                       # TypeScript 源码（唯一真源）
├── server.ts              # Express 入口：路由 / 301 / sitemap / 静态资源
├── types.ts               # 全站共享类型
├── config/site.ts         # 导航 / 页脚 / 品牌 / 域名 / 埋点（单一真源）
├── data/                  # 数据化的重复内容
│   ├── faq.ts             #   FAQ
│   └── partner.ts         #   加盟支持卡 + 合伙人名片
└── client/app.ts          # 浏览器交互 → 编译为 public/app.js
views/                     # Nunjucks 模板
├── layouts/base.njk       # 基础布局
├── partials/              # head / nav / footer / analytics / card-manager(宏)
└── pages/                 # index / questions / partner / entry / serves / 404
style.css                  # 设计系统（静态）
images/                    # 图片资源
public/app.js              # 客户端编译产物（构建生成，不入库）
dist/                      # 服务端编译产物（构建生成，不入库）
docs/                      # 迁移方案与实施细则
```

## 快速开始

需要 Node.js ≥ 20。

```bash
# 安装依赖
npm install

# 开发（编译客户端 + tsx 监听服务端，改动自动重启）
npm run dev

# 生产构建 + 启动
npm run build
npm start          # 等价于 prestart 自动构建后 node dist/server.js
```

默认运行在 http://localhost:3000 。

### 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 编译客户端 + `tsx watch` 服务端（热重启） |
| `npm run build` | 编译服务端（→ `dist/`）和客户端（→ `public/app.js`） |
| `npm start` | 启动生产服务（`prestart` 自动先 build） |
| `npm run build:client` | 仅编译客户端 |
| `npm run dev:client` | 客户端 `tsc --watch`（调试 `src/client/app.ts` 时用） |

## 环境变量

复制 `.env.example` 为 `.env`：

| 变量 | 说明 | 默认 |
|------|------|------|
| `PORT` | 服务端口 | `3000` |
| `SITE_BASE_URL` | 所有绝对 URL（canonical / OG / JSON-LD）基准域名 | `https://www.edaijia.cn` |
| `ASSET_VERSION` | 静态资源指纹；留空则启动时用时间戳 | 时间戳 |
| `ANALYTICS_PROVIDER` | 埋点平台：`none` / `ga4` / `baidu` / `sensors` | `none` |
| `ANALYTICS_ID` | 对应平台的统计 ID | 空 |

> 换域名只改 `SITE_BASE_URL` 一处。

## 页面与路由

| 路径 | 页面 |
|------|------|
| `/` | 首页（Hero / 服务 Bento / 信任 / 历程 / 合作伙伴 / 下载 CTA） |
| `/questions` | 常见问答（FAQ 手风琴） |
| `/partner` | 城市加盟与合伙人计划 |
| `/entry` | 司机招募 |
| `/serves` | 商务合作 |
| `/sitemap.xml`、`/robots.txt` | SEO |

旧的 `*.html` 地址会 **301** 重定向到对应 clean URL。

## 改内容去哪改

| 想改 | 改这里 |
|------|--------|
| 导航 / 页脚链接、品牌、热线、域名 | `src/config/site.ts` |
| FAQ 问答 | `src/data/faq.ts` |
| 加盟支持卡 / 合伙人名片 | `src/data/partner.ts` |
| 页面正文结构 | `views/pages/*.njk` |
| 公共头部 / 导航 / 页脚外观 | `views/partials/*.njk` |
| 视觉样式 | `style.css` |
| 客户端交互 | `src/client/app.ts` |

## 埋点

`data-track` 属性 + 客户端事件委托上报，覆盖：下载点击、FAQ 展开、复制联系方式、外链点击。统计平台由 `ANALYTICS_PROVIDER` 切换（GA4 / 百度统计 / 神策），都为空时降级 `console.debug` 便于本地调试。

## 部署

- **PM2**：`pm2 start dist/server.js --name edaijia -i max`（先 `npm run build`）。
- **Docker**：基于 `node:20-alpine`，构建后 `CMD ["node","dist/server.js"]`，`EXPOSE 3000`。
- **Nginx 反代**：80/443 → `localhost:3000`，开启 gzip/brotli、HTTP/2。

更详细的方案与验收清单见 [`docs/nodejs-migration-plan.md`](docs/nodejs-migration-plan.md)，架构说明见 [`AGENTS.md`](AGENTS.md)。

## 版权

© 北京亿心宜行汽车技术开发服务有限公司
