# e代驾转型网站项目架构

本文件记录本项目的目录结构、各文件核心职责以及模块间依赖关系。

> **架构现状（重要）**：本项目已从「纯静态多页 HTML」迁移为 **Express + Nunjucks 的 TypeScript 服务端渲染站**。
> 通用的 `<head>`/导航/页脚已组件化为模板 partial，重复内容（FAQ、名片、加盟卡）已数据化。
> 迁移前的历史静态 `*.html` 已删除；访问旧地址（如 `/questions.html`）会 301 跳转到对应 clean URL。

## 目录结构树
```text
.
├── package.json                       # TS 项目；scripts: dev/build/start
├── tsconfig.json                      # 服务端编译配置（CommonJS → dist/）
├── tsconfig.client.json               # 客户端编译配置（DOM lib → public/app.js）
├── .env.example                       # 环境变量样例（域名/端口/埋点）
├── src/                               # TypeScript 源码（唯一真源）
│   ├── adapters/                      # 服务适配器
│   │   ├── types.ts                   # 适配器接口定义（Geo/SMS/Llm/Carrier/Backend）
│   │   ├── fake.ts                    # 本地调试用 Mock 模拟适配器
│   │   └── edaijiaGeo.ts              # 真实的 e代驾线上定位服务适配器（双盐签名+降级兜底）
│   ├── server.ts                      # Express + Nunjucks 入口：路由、301、sitemap、静态资源
│   ├── types.ts                       # 全站共享类型（SiteConfig/PageDef/FaqItem/Manager…）
│   ├── config/site.ts                 # 导航/页脚/品牌/域名/埋点 单一真源
│   ├── data/faq.ts                    # FAQ 数据（FaqItem[]）
│   ├── data/partner.ts                # 加盟支持卡 + 合伙人名片数据
│   └── client/app.ts                  # 浏览器交互（编译为 public/app.js）
├── views/                            # Nunjucks 模板
│   ├── layouts/base.njk               # 基础布局：head + nav + block content + footer + script
│   ├── partials/                      # head / nav / footer / analytics / card-manager(宏)
│   └── pages/                         # index / questions / partner / entry / serves / 404
├── style.css                          # Apple 风格设计系统（静态资源，服务端直出 /style.css）
├── images/                            # 图片资源（/images，含 logo/hero-banner/bento-*/qr-*）
├── public/app.js                      # client/app.ts 的编译产物（构建生成，不入库）
├── dist/                              # server.ts 的编译产物（构建生成，不入库）
├── docs/nodejs-migration-plan.md      # Node/TS 迁移方案与实施细则
├── README.md                          # 项目说明、快速开始、部署
└── .agent/rules/Gemini.md             # 代理行为与推理规范
```

## 文件核心职责

### 服务端（TypeScript，编译到 dist/）
- `src/adapters/`: 服务适配器模块。`types.ts` 定义接口规范；`fake.ts` 实现本地离线环境调试；`edaijiaGeo.ts` 签名对接 `/gps/location` 线上只读定位并提供 WAF 优雅降级能力。
- `src/server.ts`: Express 入口。配置 Nunjucks；注入全局模板变量（`site`/`assetVersion`/`currentYear`）；以单一 `PageDef[]` 数组循环注册 5 个页面路由；旧 `.html` → clean URL 的 301；`/sitemap.xml`、`/robots.txt`、404；精确暴露 `/style.css`、`/images`、`/app.js`。
- `src/config/site.ts`: 全站单一真源。导航、页脚三栏与链接、品牌、法务/社交、域名（`SITE_BASE_URL`）、埋点平台配置。改一处即 5 页同步，结构上杜绝跨页不一致。
- `src/data/faq.ts` / `src/data/partner.ts`: 重复性内容数据化。FAQ 10 条、加盟支持卡 8 张、合伙人名片 4 张，由模板循环渲染。
- `src/types.ts`: 全站接口类型定义，服务端与数据共用。

### 模板（Nunjucks，views/）
- `layouts/base.njk`: 基础布局，串联 head/nav/footer + 页面 content block + 客户端脚本。
- `partials/`: `head.njk`（meta/OG/Twitter/canonical/JSON-LD，吃 page 变量）、`nav.njk`（active 高亮由 `page.activeNav` 驱动）、`footer.njk`（栏目/链接来自 config）、`analytics.njk`（GA4/百度/神策按 env 切换）、`card-manager.njk`（负责人名片宏，partner/serves 复用）。
- `pages/*.njk`: 各页正文，`extends base.njk` 并填充 content block；FAQ/加盟卡用 `{% for %}` 渲染数据。

### 客户端与样式
- `src/client/app.ts`: 浏览器交互引擎（DOM 类型 + 严格空值守卫）。导航滚动/抽屉菜单、IntersectionObserver 滚动动画、easeOutCubic 计数器、平滑锚点滚动、FAQ 手风琴、一键复制+Toast、`data-track` 埋点委托上报。编译产物 `public/app.js` 通过 `/app.js?v={assetVersion}` 引入。
- `style.css`: Apple 风格设计系统。系统字体栈、Apple Blue (#0071e3) 主色、白底交替分区、Bento 圆角卡片、毛玻璃导航、胶囊按钮、`data-reveal` 动画、三档响应式断点（768/480）、各子页布局与 Toast 样式。

### 基础设施
- `AGENTS.md`: 项目架构总览与文件职责说明。
- `.agent/rules/Gemini.md`: AI 代理行为规范。
- `docs/nodejs-migration-plan.md`: Node/TS 迁移方案与实施细则。

## 模块间依赖关系
```
index.html
  ├── 引用 → style.css（Apple 风格设计系统）
  ├── 引用 → app.js（交互逻辑）
  ├── 链接 → questions.html（常见问答独立页面）
  ├── 链接 → partner.html（城市加盟合作独立页面）
  ├── 链接 → entry.html（司机招募独立页面）
  ├── 链接 → serves.html（商务合作独立页面）
  └── 外链 → edaijia.cn 原站页面（VIP 等）

questions.html
  ├── 引用 → style.css（包含特定页面 padding 和激活指示）
  ├── 引用 → app.js（FAQ 折叠和移动端抽屉菜单）
  ├── 链接 → partner.html（直接互相跳转）
  ├── 链接 → entry.html（直接互相跳转）
  └── 链接 → index.html（回跳至各区块锚点，如 #services, #trust 等）

partner.html
  ├── 引用 → style.css（包含特定网格与名片卡片和 Toast 样式）
  ├── 引用 → app.js（一键复制与 Toast 弹窗反馈）
  ├── 链接 → questions.html（直接互相跳转）
  ├── 链接 → entry.html（直接互相跳转）
  └── 链接 → index.html（回跳至各区块锚点）

entry.html
  ├── 引用 → style.css（包含招募优势卡片、流程时间轴、须知及 CTA 样式）
  ├── 引用 → app.js（导航栏交互、滚动动画、移动端抽屉菜单）
  ├── 链接 → questions.html / partner.html / serves.html（直接互相跳转）
  ├── 链接 → index.html（回跳至各区块锚点）
  └── 外链 → edaijia.cn 原站协议页面（用户规则、代驾协议、信息服务协议）

serves.html
  ├── 引用 → style.css（包含商务合作 Header、产品网格、名片网格及 CTA 样式）
  ├── 引用 → app.js（一键复制邮箱、Toast 弹窗反馈、导航栏交互）
  ├── 链接 → questions.html / partner.html / entry.html（直接互相跳转）
  ├── 链接 → index.html（回跳至各区块锚点）
  └── 外链 → edaijia.cn 原站页面（VIP）、淘宝旗舰店
```
- `style.css`: Apple 风格设计系统。系统字体栈（-apple-system/SF Pro/PingFang SC）、Apple Blue (#0071e3) 主色、白底 (#fff/#fbfbfd) 交替分区、Bento 圆角卡片（30px radius）、毛玻璃导航、胶囊按钮（980px radius）、data-reveal 滚动动画、三档响应式断点（768px/480px）、常见问答页面的布局留白及激活高亮样式。
- `app.js`: 页面交互引擎。导航栏滚动透明度切换、移动端抽屉式导航、IntersectionObserver 驱动 data-reveal 滚动动画（含首屏跳过闪烁优化 + 2.5s 安全兜底）、easeOutCubic 数字计数器、平滑锚点滚动、常见问答（FAQ）的手风琴折叠展开效果。

### 基础设施
- `AGENTS.md`: 项目架构总览与文件职责说明。
- `.agent/rules/Gemini.md`: AI 代理行为规范。
- `docs/architecture.md`: 战略文档固化（待创建，内部参考用）。

## 模块间依赖关系
```
index.html
  ├── 引用 → style.css（Apple 风格设计系统）
  ├── 引用 → app.js（交互逻辑）
  ├── 链接 → questions.html（常见问答独立页面）
  └── 外链 → edaijia.cn 原站页面（VIP、司机招募、加盟等）

questions.html
  ├── 引用 → style.css（包含特定页面 padding 和激活指示）
  ├── 引用 → app.js（FAQ 折叠和移动端抽屉菜单）
  └── 链接 → index.html（回跳至各区块锚点，如 #services, #trust 等）
```

## 设计决策记录
1. **Apple 风格白底极简**：从 v1 暗色方案切换为忠实还原 Design Canvas 的白底设计。使用系统字体栈而非 Google Fonts，更贴合 Apple 审美。
2. **Bento 卡片布局**：服务区采用一大两小的 Bento Grid，与 Apple 产品页一致。
3. **色彩极简**：仅用 Apple Blue (#0071e3) 作为唯一强调色，其余全部黑白灰阶梯。
4. **战略内核不外泄**：ACN分账、信用图谱、车商折扣表等全部不出现在公开站点。
5. **原站功能无损迁移**：95139热线、ICP备案、司机招募、城市加盟等关键入口全部保留。
6. **纯静态站**：无构建工具、无框架依赖，三个文件即全部。
7. **图片资源规范化命名**：淘汰了 `10001.jpg`、`10002.png` 等无语义名称，统一使用符合职责的 `hero-banner.jpg`、`logo.png` 以及以 `bento-` 为前缀的图片资源，并删除了废弃的 `hero.png`。
8. **Logo 图片应用与适配**：将导航栏及页脚处的文字拼接 Logo 统一替换为官方的 `logo.png` 图片，并将导航栏高度由 `64px`（原为 52px）和 Logo 的 `32px` 高度完美适配，实现呼吸感留白与高清晰度。
9. **Hero 区域左对齐**：首屏 Hero 区域通过新增 `.hero__inner` 容器（最大宽度 1024px，左右 padding 22px），消除了原有的 margin 百分比偏移，使首屏文字的左侧边界与下方的 Bento 卡片等主流内容的左侧边界实现了绝对垂直对齐。
10. **建立真实下载闭环**：在底部 CTA 区（#download）设计了高品质磨砂玻璃下载面板，引入真实的 App Store 跳转和 Android APK 安装包直接下载链接，并在首屏文字下嵌入了快捷扫码小浮窗，彻底解决了叫代驾“转化路径为空”的漏洞。
11. **Bento 2.0 业务降权排布**：为了防止 B2B 的“车辆履约”黑话稀释大众叫代驾的刚需定位，将业务网格重排。上方并列呈现 B2C 大刚需「酒后代驾」与「车管家」，下方单列并以通栏扁平卡片方式对「车辆履约」进行降权，同时采用 `object-position: center 20%` 规避了司机与车身顶端被重叠裁切变形的问题。
12. **可访问性与移动端体验**：引入全局 `:focus-visible` 无障碍高亮蓝色轮廓线，以支持键盘 Tab 导航焦点环；移除了 cta 描述文字在窄屏下的强制不换行，防止移动端文本截断。
13. **Hero 确定走「代言人 banner」路线**：放弃此前"极简文字与明星 banner 各占半幅互相压制"的折中，明确让小沈阳代言 banner 唱主角。`background-position: right center` 锚定右侧，确保代言人与「喝酒不开车才是好兄弟」口号在任意宽度下都不被裁掉；`.hero::after` 渐变改为仅压暗左侧文字区、约半幅后完全透光。左列 CSS 文字（价值主张）与右侧 banner（安全代言）形成有意的左右分栏，不再视觉打架。
14. **社交分享与 SEO 元数据**：`<head>` 补齐 Open Graph、Twitter Card、canonical 与 JSON-LD（Organization）。分享图选用 1024×1024 的 `bento-service-driver.png`（方图在微信卡片中不被裁成窄条）；所有绝对 URL 以品牌主域 `https://www.edaijia.cn/` 为基准，换部署域名时需同步替换。
15. **自适应背景避让与动态年份**：设定首屏 Hero 的 background-position 在桌面和移动端偏向右侧裁切，使背景小沈阳人像和 baked-in Slogan 完整出镜，并利用 JS 自动更新版权年份为 `2011 - [当前年份]`，避免硬编码未来时间。
16. **合作伙伴高质感卡片化重构**：为了解决原来纯文本排列“太素”的视觉短板，对生态合作伙伴区域进行了卡片化和微交互重构。引入彩色高精度 SVG 官方品牌图标和半透明磨砂玻璃材质卡片，并为每家品牌定制专属的物理悬浮 hover 以及彩色发光投影，保证在多端响应式下的优雅对齐与比例缩放。
17. **FAQ 常见问答单页合并**：为了优化整站单页闭环，抓取并提炼了官方 `questions.html` 下的 10 个常见问答，在 Partners 与 CTA 板块间插入了精美的折叠胶囊手风琴组件（Accordion），通过轻量 JS 提供极其顺滑的问题折叠及箭头旋转过渡，并分别在导航栏和页脚把原本跳出到原站的外链重定向为本地平滑滚动的内部锚点 `#faq`。
18. **FAQ 常见问答单页拆分与独立多页面重构**：为了满足用户对单独常见问答页面的需求，将 FAQ 从主页 `index.html` 中移除，创建了独立的 `questions.html` 页面。该页面在保留原有 Apple 极简风格和 10 个高质感手风琴 FAQ 胶囊卡片的基础上，复用了主导航与页脚，并通过 `questions.html` 专用样式 `padding-top` 防止置顶毛玻璃导航栏遮挡，且使用 `.nav__link.active` 状态指示高亮。导航栏链接设置为跨页面锚点跳转，确保在双页面之间能够顺畅无缝浏览。
19. **城市加盟合伙人单页面合并与重构**：根据用户需求，将原站的 `partner.html` 完整内容搬迁并重构成完全共享本地导航、页脚的 Apple 风格白底极简页面。八大支持板块重塑为白底带 `1px solid rgba(0,0,0,0.04)` 发光边框的 Bento 网格，合伙人负责人板块设计为 4 列高质感磨砂玻璃名片盒。通过在 `app.js` 中新增 API 与 Fallback 降级的一键复制微交互逻辑及动态 Toast 指示弹窗，彻底提升了合伙人招商的转化体验与专业质感。
20. **Hero 代言人背景图右边界对齐与自适应避让**：应用户关于“小沈阳右侧极限不能超过下面板块”的要求，将首屏背景大图从 `.hero` 容器中剥离，移入独立的 `.hero__bg` 及 `.hero__bg-inner` 结构中。将背景图最大宽度限制为 `1024px` 且左右 padding 为 `22px`，使其在宽屏模式下其右侧边缘与下方的 Bento 服务卡片右边缘实现绝对精确像素对齐。为了精调代言人出镜及防遮挡效果，我们将背景定位参数微调为 `background-position: 60% center;`，既将人像大面积往右移动以剪除多余右侧空背景，人脸饱满而完整地偏右展现，又在宽屏下保留了左侧渐变融入背景的完美过渡，在移动端维持极高的自适应裁切质量。
21. **Hero 代言人背景图通栏自适应释放与精确对齐优化**：针对用户"不要把图截断，要根据屏幕宽度释放"的升级诉求，我们将 `.hero__bg` 容器的 `max-width: 1024px` 限制完全废除，重构为 `inset: 0` 铺满，使得背景大图彻底向视口左右两侧无限延伸释放，解决了宽屏下大图左/右边缘突兀切断的视觉硬伤。在 `@media (min-width: 1025px)` 的超宽视口下，引入基于视口中线偏移的精密 CSS 定位算法：`background-position: calc(50% - 144px) center;`，该算法配置了背景缩放后中轴线与人像右边缘的恒定偏置（656px），使无论屏幕多宽，代言人右边缘都完美像素级对齐于居中 1024px Bento 板块的右侧红线，实现了通栏无缝延展与核心视觉对齐的完美平衡。
22. **司机招募独立页面融入与在线报名功能下线适配**：将原站 `entry.html`（司机招募）的核心信息重构为本地 Apple 风格独立页面。由于原站在线报名表单已下线（其依赖 `api.edaijia.cn` 的 7+ 个后端 API），采取「信息展示 + 电话/微信咨询」策略替代在线提交。页面包含 4 列招募优势 Bento 卡片（时间自由/收入丰厚/保障齐全/智能派单）、3 步报名流程时间轴（电话咨询→预约路考→签约上岗）、报名须知与协议链接、以及电话热线 CTA 区域。全站四个页面（index/questions/partner/entry）的导航栏和页脚中"司机招募"链接统一从外链改为本地 `entry.html`，消除了跳出率。
23. **通用部分组件化：Express + Nunjucks 服务端渲染**：为根治 5 个 HTML 页面复制粘贴 `<head>`/导航/页脚导致的反复不一致（曾出现页脚栏目「合作/商务」混用、`serves.html` 相对链接 404 等 bug），引入 Express + Nunjucks。公共 chrome 抽成 `base.njk` + `head/nav/footer/analytics` partial，导航/页脚链接收敛到 `config/site.js` 单一真源；FAQ(10)、加盟支持卡(8)、合伙人名片(4) 数据化为 `data/*` 由模板循环；名片以 `card-manager` 宏被 partner/serves 复用。配套：clean URL 路由（`/questions` 等）、旧 `.html` → 301、`sitemap.xml`/`robots.txt`、404 页、资源指纹 `?v={assetVersion}`（替代手改 `?v=1.x`）、`data-track` 埋点委托层。顺手修复 `serves` 复制按钮依赖不存在的全局 `copyToClipboard` 的真 bug，改为统一的 `.copy-btn` 委托。
24. **全量 TypeScript 化**：服务端与客户端全部改写为 TS，配双 `tsconfig`——服务端 `tsconfig.json`（CommonJS → `dist/`，`types:["node"]`），客户端 `tsconfig.client.json`（`lib:["DOM"]`、`outFile` → `public/app.js`、IIFE 无模块泄漏）。`src/types.ts` 定义全站接口；`src/client/app.ts` 在 `strict` 下补齐 DOM 空值守卫并以 `interface Window` 增强声明第三方统计 SDK（gtag/_hmt/sensors）。脚本：`npm run dev`（编译 client + tsx watch 服务端）、`npm run build`、`npm start`（prestart 自动 build）。旧 `server.js`/`app.js`/`config/*.js`/`data/*.js` 已删除；`dist/`、`public/app.js`、`.env` 已 gitignore。
