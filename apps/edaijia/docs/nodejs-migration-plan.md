# e代驾官网 · 静态站 → Node.js 迁移方案与实施细则

> 交付对象：人类程序员
> 目标读者无需了解本仓库历史，本文自包含。
> 方案定型（已与产品确认）：**Express + 模板引擎做去重 + Node 静态托管 + 轻量埋点**。
> **不做**：表单提交后端、CMS、数据库、SSR/前端框架重写。

---

## ✅ 实现状态：已落地（TypeScript）

本方案已实现，且在原计划基础上**全量 TypeScript 化**。以下为实际产物，覆盖本文档下方的"计划"描述——如有出入以实现为准：

- **技术栈**：Express + Nunjucks + **TypeScript**（双 `tsconfig`：服务端 CommonJS、客户端 DOM）。
- **实际目录**：源码全在 `src/`（`server.ts`、`types.ts`、`config/site.ts`、`data/*.ts`、`client/app.ts`），模板在 `views/`（`layouts/base.njk` + `partials/` + `pages/`），样式/图片 `style.css`、`images/` 不变；构建产物 `dist/`（服务端）、`public/app.js`（客户端），均不入库。
- **命令**：`npm run dev`（编译 client + `tsx watch` 服务端）、`npm run build`、`npm start`。
- **已实现项**：base 布局 + head/nav/footer/analytics partial、`card-manager` 宏；config 单一真源驱动导航/页脚；FAQ/加盟卡/名片数据化循环；clean URL + 旧 `.html` 301；`sitemap.xml`/`robots.txt`/404；资源指纹 `?v={assetVersion}`；`data-track` 埋点委托层。
- 详细的"as-built"结构与职责见仓库根 `AGENTS.md`。

下方章节保留为**原始设计依据与实施细则**，仍可作为思路与验收清单参考。

---

## 1. 背景与现状

当前是一个**纯静态站**，共 5 个独立 HTML 页面，彼此复制粘贴了相同的 `<head>`、导航栏、页脚：

| 页面 | 路径 | 内容 |
|------|------|------|
| 首页 | `index.html` | Hero（代言人 banner）、服务 Bento、信任统计、发展历程、合作伙伴、下载 CTA |
| 常见问答 | `questions.html` | 10 条 FAQ 手风琴 |
| 城市加盟 | `partner.html` | 八大支持网格 + 4 名合伙人名片（一键复制） |
| 司机招募 | `entry.html` | 招募优势、3 步流程、须知、电话 CTA |
| 商务合作 | `serves.html` | 产品网格、优势、收费面板、6 名商务名片（一键复制） |

共享资源：`style.css`（单一设计系统）、`app.js`（全部客户端交互）、`images/`。

### 现状的核心痛点（即本次迁移要解决的问题）
1. **导航栏 / 页脚 / `<head>` 在 5 个文件里重复**。任何一处改动要手动同步 5 次，已经因此产生过页脚栏目命名不一致（"合作" vs "商务"）、`serves.html` 相对链接 404 等 bug。
2. **重复性内容块是手写 HTML**（FAQ 10 条、名片 4+6 张、合作伙伴 5 个、时间轴 8 条），应数据化后由模板循环渲染。
3. **每页 SEO 元数据（title/OG/canonical/JSON-LD）散落各处**，域名硬编码，换域名要全局替换。
4. 没有统一埋点，无法量化"下载点击 / 复制联系方式 / FAQ 展开"等关键转化。

### 必须无损保留的客户端交互（继续放在 `app.js`，**不要**搬到服务端）
- 导航栏滚动透明度切换、移动端抽屉菜单（含 `aria-expanded`）
- `data-reveal` 滚动进入动画（IntersectionObserver + 首屏防闪烁 + 2.5s 兜底）
- `easeOutCubic` 数字计数器（`data-target` / `data-founding`）
- 平滑锚点滚动
- FAQ 手风琴折叠
- 一键复制微信/邮箱 + Toast
- 版权年份动态生成（`#copyrightYear`）、信任区年数（`#trustYears`）

---

## 2. 技术选型

| 项 | 选型 | 理由 |
|----|------|------|
| 运行时 | **Node.js ≥ 20 LTS** | 长期支持 |
| Web 框架 | **Express 4** | 团队熟悉、生态稳、够用 |
| 模板引擎 | **Nunjucks** | 支持布局继承（`extends`/`block`）、`include`、宏（`macro`）、循环；语法接近 Jinja2，最适合"一套布局 + 多页内容 + 数据循环"。比 EJS 更适合做去重 |
| 静态资源 | `express.static` + 长缓存 + 文件指纹 | 见 §7 |
| 进程管理 | **PM2**（或 Docker，二选一） | 见 §11 |
| 埋点 | 可配置注入（GA4 / 百度统计 / 神策三选一）+ 自定义事件 | 见 §8 |

> 不引入前端构建（Webpack/Vite）。CSS/JS 保持手写单文件，仅做指纹与压缩（可选）。保持"无前端工具链"的轻量特性。

---

## 3. 目标目录结构

```text
edaijia/
├── package.json
├── server.js                  # Express 入口
├── config/
│   └── site.js                # 全站配置：域名、品牌、导航、页脚、社交、埋点开关
├── data/                      # 数据化的重复内容（模板循环用）
│   ├── faq.js                 # 10 条 FAQ
│   ├── partners.js            # 首页合作伙伴 logo 列表
│   ├── timeline.js            # 发展历程 8 条
│   ├── services.js            # 首页 Bento 卡片
│   ├── partner-managers.js    # 城市加盟 4 名合伙人
│   ├── serves-managers.js     # 商务合作 6 名负责人
│   └── recruit.js             # 司机招募优势/流程/须知
├── views/                     # Nunjucks 模板
│   ├── layouts/
│   │   └── base.njk           # 基础布局：<head> + nav + {% block content %} + footer + scripts
│   ├── partials/
│   │   ├── head.njk           # meta / OG / Twitter / canonical / JSON-LD（吃 page 变量）
│   │   ├── nav.njk            # 导航（active 高亮由变量驱动）
│   │   ├── footer.njk         # 页脚（链接集中自 config/site.js）
│   │   ├── analytics.njk      # 埋点 snippet（env 开关）
│   │   └── card-manager.njk   # 名片宏（partner/serves 复用）
│   └── pages/
│       ├── index.njk
│       ├── questions.njk
│       ├── partner.njk
│       ├── entry.njk
│       └── serves.njk
├── public/                    # 静态资源（express.static 根）
│   ├── css/style.css
│   ├── js/app.js
│   └── images/...
├── docs/
└── .env.example               # 环境变量样例
```

---

## 4. 数据与配置模型

### 4.1 `config/site.js`（全站单一真源）
集中所有"出现在多个页面"的常量，杜绝复制粘贴：

```js
module.exports = {
  baseUrl: process.env.SITE_BASE_URL || 'https://www.edaijia.cn',
  brand: { name: 'e代驾', hotline: '95139', logo: '/images/logo.png' },
  // 导航：key 用于 active 高亮；外链 external:true
  nav: [
    { key: 'services',  text: '服务',        href: '/#services' },
    { key: 'trust',     text: '为什么选我们', href: '/#trust' },
    { key: 'timeline',  text: '发展历程',     href: '/#timeline' },
    { key: 'questions', text: '常见问答',     href: '/questions' },
    { key: 'partner',   text: '城市加盟',     href: '/partner' },
    { key: 'entry',     text: '司机招募',     href: '/entry' },
    { key: 'serves',    text: '商务合作',     href: '/serves' },
  ],
  cta: { text: '下载 App', href: '/#download' },
  footer: {
    columns: [
      { title: '服务', links: [/* 集中维护，所有页面共用 */] },
      { title: '合作', links: [/* ... */] },
      { title: '关于', links: [/* ... */] },
    ],
    legal: { /* ICP、公网安备、公司主体、电话 */ },
    social: [ { text: '微博 @e代驾', href: '...' }, /* ... */ ],
  },
  analytics: {
    provider: process.env.ANALYTICS_PROVIDER || 'none', // 'ga4' | 'baidu' | 'sensors' | 'none'
    id: process.env.ANALYTICS_ID || '',
  },
};
```

> **关键收益**：导航/页脚链接只存在一处。当前的页脚不一致 bug 在结构上变得不可能再发生。

### 4.2 锚点链接策略（迁移时必须改）
迁移到服务端 clean URL 后：
- 旧的跨页锚点 `index.html#services` → 统一改为 **`/#services`**（从任何页面都正确）。
- 旧的页面链接 `questions.html` → **`/questions`**（见 §6 路由）。
- nav 的 active 高亮不再靠各页手写 `.active`，而是由 `base.njk` 渲染时传入的 `activeNav` 变量决定（见 §5）。

### 4.3 每页元数据（驱动 `head.njk`）
每个路由向模板传一个 `page` 对象：

```js
{
  title: '常见问答 - FAQ | e代驾 — 您的车，放心交给我们',
  description: '...',
  canonical: '/questions',          // head.njk 拼成 baseUrl + canonical
  ogImage: '/images/bento-service-driver.png',
  activeNav: 'questions',           // 控制导航高亮
  bodyClass: 'questions-page',      // 控制各页专属 padding/样式
  jsonLd: {...} | null              // 首页放 Organization，其余可省
}
```

---

## 5. 模板分解方案（核心去重工作）

### 5.1 `layouts/base.njk`
```njk
<!DOCTYPE html><html lang="zh-CN"><head>
  {% include "partials/head.njk" %}
  {% include "partials/analytics.njk" %}
</head><body class="{{ page.bodyClass }}">
  {% include "partials/nav.njk" %}
  {% block content %}{% endblock %}
  {% include "partials/footer.njk" %}
  <script src="/js/app.js?v={{ assetVersion }}"></script>
</body></html>
```

### 5.2 `partials/nav.njk`（active 由变量驱动）
```njk
{% for item in site.nav %}
  <a href="{{ item.href }}"
     class="nav__link {{ 'active' if item.key == page.activeNav }}">{{ item.text }}</a>
{% endfor %}
<a href="{{ site.cta.href }}" class="nav__cta">{{ site.cta.text }}</a>
```

### 5.3 页面模板示例 `pages/questions.njk`
```njk
{% extends "layouts/base.njk" %}
{% block content %}
<main class="questions-page">
  <section class="faq"><div class="faq__list">
    {% for item in faq %}
      <div class="faq__item">
        <button class="faq__question">{{ loop.index }}. {{ item.q }}
          <span class="faq__arrow">⌄</span></button>
        <div class="faq__answer"><p>{{ item.a | safe }}</p></div>
      </div>
    {% endfor %}
  </div></section>
</main>
{% endblock %}
```

### 5.4 名片宏（partner / serves 共用）
`partials/card-manager.njk` 定义 `{% macro managerCard(m) %}`，输出磨砂玻璃名片 + 拨号 + `data-copy` 复制按钮；partner（4 张）与 serves（6 张）各自循环数据调用，**消除两套几乎相同的名片 HTML**。

### 5.5 逐页拆解清单（程序员逐项搬运）
对每个现有 HTML 文件，按以下步骤把它变成 `pages/*.njk`：
1. 删除 `<head>`、`<nav>`、`<footer>`、结尾 `<script>` —— 这些进 `base.njk`。
2. 正文（`<section>` 们）整体放进 `{% block content %}`。
3. 把重复结构（FAQ/名片/时间轴/合作伙伴/Bento 卡）抽成 `data/*.js` + `{% for %}`。
4. 该页的 title/description/canonical/ogImage/activeNav/bodyClass 填进路由的 `page` 对象。
5. 页内所有 `*.html` 链接与 `index.html#x` 锚点按 §4.2 改写。

---

## 6. 路由设计（`server.js`）

| 方法 | 路径 | 渲染 | 备注 |
|------|------|------|------|
| GET | `/` | `pages/index.njk` | activeNav: 无（首页） |
| GET | `/questions` | `pages/questions.njk` | |
| GET | `/partner` | `pages/partner.njk` | |
| GET | `/entry` | `pages/entry.njk` | |
| GET | `/serves` | `pages/serves.njk` | |
| GET | `*.html` 旧地址 | **301 重定向**到对应 clean URL | 保 SEO/旧外链，如 `/questions.html → /questions` |
| — | 静态 `/css /js /images` | `express.static('public')` | |
| GET | `*`（未命中） | 404 页（复用 base 布局） | |

实现要点：
- 用一个数组集中定义路由 + 每页 `page` 对象，循环注册，避免重复样板。
- `res.locals` 注入全局变量：`site`（config）、`assetVersion`、当前年份等，模板无需每次传。
- 安全/性能中间件：`helmet`（按需放宽 CSP 以兼容内联 SVG/埋点）、`compression`、`morgan`（访问日志）。

---

## 7. 静态资源与缓存

- `style.css` / `app.js` 移到 `public/css` `public/js`，模板用 `?v={{ assetVersion }}` 做指纹。`assetVersion` 取构建时间戳或 git short sha（环境变量注入），**替代现在手改 `?v=1.2` 的做法**。
- `express.static` 设置：
  - `images/*`、带指纹的 css/js → `Cache-Control: public, max-age=31536000, immutable`
  - HTML（模板渲染结果）→ `no-cache` 或短缓存，保证内容更新即时生效。
- 可选：上线前用 `clean-css` / `terser` 压缩出 `.min` 版本（一条 npm script，不引入打包器）。

---

## 8. 埋点与分析（本次唯一的"动态"诉求）

### 8.1 注入方式
`partials/analytics.njk` 根据 `site.analytics.provider` 条件渲染对应统计 snippet（GA4 / 百度统计 / 神策三选一），id 来自环境变量。`provider=none` 时不输出任何脚本（开发环境默认）。

### 8.2 自定义事件（关键转化）
在 `app.js` 增加一个**事件委托 + `data-track` 属性**的轻量埋点层，统一上报到所选统计平台（封装 `track(event, props)` 适配函数）。需要打点的转化点：

| 事件 | 触发位置 | 建议属性 |
|------|----------|----------|
| `download_click` | CTA/Hero 的 App Store、Android APK、二维码 | `platform: ios/android/qr`, `location` |
| `faq_expand` | FAQ 展开 | `question_index` |
| `copy_contact` | 复制微信/邮箱按钮 | `type: wechat/email`, `page` |
| `nav_cta_click` | 顶部"下载 App" | — |
| `outbound_click` | 跳 edaijia.cn / 应用商店等外链 | `href` |
| `page_view` | 各页（统计平台自带，补充 `page_group`） | — |

实现：给相应元素加 `data-track="download_click"` `data-track-platform="ios"` 等属性；`app.js` 用一个委托监听器读取并调用 `track()`。**埋点与业务代码解耦**，新增打点只改 HTML 属性。

### 8.3 隐私
纯展示站，不采集 PII。`morgan` 访问日志按需脱敏 IP；如面向合规要求，预留 Cookie 同意横幅位（本期可不做，文档标注）。

---

## 9. SEO 与一致性

- title/description/OG/Twitter/canonical/JSON-LD 全部由 `head.njk` 吃 `page` + `site` 变量生成，域名只在 `config/site.js`/`.env` 配置一次。
- 保留现有 Organization JSON-LD（首页），可按页扩展（FAQ 页加 `FAQPage` schema，是顺手的 SEO 增益，建议做）。
- 生成 `/sitemap.xml` 与 `/robots.txt`（Express 路由动态输出或静态文件）。
- 旧 `.html` → clean URL 的 301 必须做，避免旧链接与重复内容。

---

## 10. 分步实施清单（建议提交顺序，每步可独立验收）

> 每步结束后跑 §11 验收，确保**视觉与现状像素级一致**再进入下一步。

1. **脚手架**：`npm init`，装 `express nunjucks compression helmet morgan dotenv`；建目录；`server.js` 跑通"Hello"。✅验收：本地 `node server.js` 起服务。
2. **静态资源迁移**：`style.css`→`public/css`，`app.js`→`public/js`，`images`→`public/images`；配 `express.static` + 缓存头。
3. **基础布局**：写 `base.njk` + `head.njk` + `nav.njk` + `footer.njk`；`config/site.js` 落地导航/页脚/品牌。
4. **首页模板化**：`index.html` → `pages/index.njk`，正文进 block，**先不数据化**，纯搬运。✅验收：`/` 与原 `index.html` 视觉一致。
5. **数据化重复块**：抽 `data/faq.js`、`timeline.js`、`services.js`、`partners.js`，首页与 FAQ 页改用 `{% for %}`。
6. **其余 4 页模板化**：questions/partner/entry/serves 逐页搬运（§5.5），名片用宏（§5.4）。
7. **路由与重定向**：clean URL + `.html` 301；404 页；`res.locals` 全局变量；`activeNav` 高亮生效。
8. **资源指纹**：`assetVersion` 注入，去掉手写 `?v=`。
9. **埋点层**：`analytics.njk` + `app.js` 的 `data-track` 委托上报；接入选定平台测试事件到达。
10. **SEO 收尾**：sitemap、robots、FAQPage schema、`.env` 域名核对。
11. **部署**：PM2/Docker + 反向代理（§11）。

---

## 11. 部署与运行

`package.json` scripts：
```json
{
  "start": "node server.js",
  "dev": "node --watch server.js",
  "build:assets": "（可选）terser + clean-css 产出 .min"
}
```

环境变量（`.env`）：
```
PORT=3000
SITE_BASE_URL=https://www.edaijia.cn
ASSET_VERSION=               # 留空则用启动时间戳
ANALYTICS_PROVIDER=none      # ga4 | baidu | sensors
ANALYTICS_ID=
```

运行：
- **PM2**：`pm2 start server.js --name edaijia -i max`（cluster 多核）。
- **或 Docker**：`node:20-alpine` 基础镜像，`EXPOSE 3000`，`CMD ["node","server.js"]`。
- **Nginx 反代**：80/443 → `localhost:3000`，开启 gzip/brotli、HTTP/2、静态资源直出（可选让 Nginx 直接服务 `public/` 减压 Node）。

---

## 12. 验收标准（Definition of Done）

- [ ] 5 个页面在 `/`、`/questions`、`/partner`、`/entry`、`/serves` 正常渲染，**与现状视觉一致**（桌面 1366 / 平板 768 / 移动 375 三档逐页比对）。
- [ ] 导航/页脚由单一配置驱动；改一处，5 页同步生效（用此验证去重成功）。
- [ ] 所有内部链接、锚点、`.html` 301、外链均可达，无 404（用 `linkinator` 或 `wget --spider` 全站爬一遍）。
- [ ] 全部客户端交互无回归：抽屉菜单、滚动动画、计数器、FAQ 折叠、复制+Toast、动态年份。
- [ ] 埋点事件在统计后台可见（download/faq/copy/outbound）。
- [ ] Lighthouse：Performance ≥ 90、SEO = 100、Best Practices ≥ 95（移动端）。
- [ ] 无控制台报错；`helmet` CSP 不误杀内联 SVG/埋点。

---

## 13. 风险与注意事项

1. **视觉回归**：模板化最大风险是搬运时漏标签/改空白导致样式错位。务必每页三档截图对比，逐页合入。
2. **内联 SVG 与 CSP**：合作伙伴的品牌 SVG、下载按钮 SVG 是内联的；`helmet` 的 CSP 若过严会出问题，需为内联样式/SVG 与埋点域名放行。
3. **Hero 代言人 banner 定位**：现状用了 `background-position` 精调（见仓库 AGENTS.md 决策 #20/#21），CSS 原样迁移即可，**不要改动这部分计算**。
4. **`app.js` 单文件**：现交互逻辑集中在一个 IIFE，迁移时整体复制，仅追加埋点委托层，避免重构引入回归。
5. **换域名**：所有绝对 URL 已收敛到 `SITE_BASE_URL`，换域名只改环境变量；确认 OG 图片、canonical、JSON-LD 全部走该变量。
6. **范围纪律**：本期明确不做表单/CMS/SSR。若后续要加司机招募/商务表单，再在 Express 上挂 `/api` 路由即可，当前架构已为其留好位置（无需重写）。

---

## 14. 工作量估算（参考，单人）

| 阶段 | 人天 |
|------|------|
| 脚手架 + 静态迁移 + 基础布局（步骤 1-3） | 1 |
| 5 页模板化 + 数据化（步骤 4-6） | 2-3 |
| 路由/重定向/指纹/SEO（步骤 7-8、10） | 1 |
| 埋点层（步骤 9） | 0.5-1 |
| 部署 + 验收回归（步骤 11-12） | 1 |
| **合计** | **约 5.5-7 人天** |

---

## 附：当前需要程序员注意的既有小问题（迁移时一并收口）
- 页脚栏目命名已统一为「服务/合作/关于」；迁移后由 `config/site.js` 统一，无需再人工核对。
- `serves` 的「商务合作」链接历史上出现过相对 `serves.html` 导致本地 404；clean URL 后用 `/serves`，注意核对。
- 现状用手改 `style.css?v=1.x` 刷缓存，迁移后由 `assetVersion` 自动指纹替代。
