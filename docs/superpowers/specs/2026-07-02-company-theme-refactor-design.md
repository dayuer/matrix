# company 主题重构设计（journal → company，模板与内容彻底分离）

日期：2026-07-02
状态：已批准

## 目标

1. `themes/journal`（e代驾站点激活的主题）改造为通用企业官网主题，改名为 **`themes/company`**（`@matrix/theme-company`，manifest `id: 'company'`）。
2. 主题内**不得残留任何业务数据与内容**：全部文案、图片引用、联系人、收费表、时间线、外链下沉到 `sites/edaijia/`（site.yaml + content/*.yaml + images/）。
3. 主题只定义**结构占位（block 模板）**，采用与 `themes/dossier` 一致的 block 渲染模式（`page.blocks` 数组 → `views/blocks/{type}.njk`）。
4. 发布链路保持现状：`matrix export edaijia` 生成静态页 → `sites/edaijia/deploy/deploy.sh` rsync 同步线上（busae.ai）。

## 背景与现状

- 基础设施已就绪：`packages/cli`（loadSite / export）、`packages/blocks`（block 视图搜索路径 + custom-html 兜底）、`packages/site-kit`（渲染/导出/部署模板）。
- `themes/dossier` + `sites/synon.ai` 已验证目标模式：内容 yaml 带 `blocks:` 数组，主题 `views/blocks/*.njk` 只做结构渲染。
- `themes/journal` 的页面模板（index/entry/serves 等约 1000 行）硬编码了全部 e代驾 业务内容；nav/footer/head partials 已是配置驱动；`questions.njk`/`partner.njk` 已部分走 locals。
- 原 Express 下单后端已随 `apps/edaijia` 删除，主题里的 order / order-status / index-mobile（UA 切换遗留）均为死代码；`site.yaml` 导航中 `/order` 为死链。

## 决策记录

| 决策 | 结论 |
|---|---|
| 主题新名 | `company`（themes/company，@matrix/theme-company） |
| order / order-status / index-mobile | 彻底删除（模板、客户端脚本、构建配置、CSS 段、manifest 项） |
| 重构方式 | 方案 A：完全 block 化（dossier 模式） |
| 导航「叫代驾」死链 | 改为 `/#download` 下载区锚点 |
| 线上部署 | 重构完成后由用户确认再执行 deploy.sh |

## 设计

### 1. 主题改名

- 目录 `themes/journal/` → `themes/company/`；`package.json` name → `@matrix/theme-company`；`theme.ts` 导出 `id: 'company'`、`name: 'Company'`。
- 更新引用：`sites/edaijia/site.yaml`（`theme: company`）、`sites/edaijia/deploy/deploy.sh`（`npm run build -w @matrix/theme-company`）、根 `package.json`（如有引用）、README / AGENTS.md 架构描述。

### 2. 死代码清除

删除文件：`views/pages/order.njk`、`views/pages/order-status.njk`、`views/layouts/order-base.njk`、`views/pages/index-mobile.njk`、`client/order.ts`、`client/order-status.ts`、`public/order.js`、`public/order-status.js`、`tsconfig.order.json`、`tsconfig.order-status.json`。

同步清理：`theme.ts` manifest 的 `order` / `orderStatus` / `homeMobile` 模板项；主题 `package.json` 中 order 相关构建脚本；`theme.css` 中确认仅服务于 order 页与 index-mobile 变体的样式段（其余样式一律不动）。

### 3. 主题 block 化

页面模板收敛为：

- `views/templates/page.njk` —— 通用模板：遍历 `page.blocks` 渲染 `blocks/{type}.njk`（home/entry/serves/partner/questions/404 全部使用）。
- `views/templates/blog-list.njk`、`views/templates/blog-detail.njk` —— collection 专用，硬编码文案全部改由 locals / site 配置注入。
- `views/layouts/base.njk` + 现有 partials（nav/footer/head/analytics/card-manager）保留，已是配置驱动。

`views/blocks/` block 清单（全部零业务文案，仅结构 + CSS 类）：

| block | 数据形状（要点） | 承接原区块 |
|---|---|---|
| `hero` | eyebrow, titleHtml, subtitle, links[], qrBadge{img,title,subtitle} | 首页 HERO |
| `page-header` | label, title, descHtml | 各子页头部、404 |
| `bento-grid` | header{label,title,desc}, cards[]{variant: featured/standard/flat, title, desc, links[], img, tag} | 首页服务 Bento |
| `stats` | header, items[]{number/counter/founding, label} | 首页信任数据 |
| `timeline` | header, items[]{year, text, accent} | 发展历程 |
| `logo-wall` | label, items[]{name, svg} | 生态合作伙伴 |
| `download-cta` | title, desc, qr{img,label}, buttons[]{href,icon,sub,main,platform}, links[] | 首页下载 CTA |
| `feature-grid` | title, desc, items[]{icon, title, desc} | 招募优势 / 商务优势 |
| `card-grid` | title, desc, items[]{icon, title, desc} | 商务产品 / 加盟支持 |
| `steps` | title, desc, items[]{title, desc} | 报名流程 |
| `notice-list` | boxes[]{icon, title, itemsHtml[]} | 报名须知 / 长途收费标准 |
| `contact-blocks` | title, desc, blocks[]{title, scope, details[]{label, value, href?, note?, copy?}}, footnoteHtml | 商务联系我们 |
| `faq-list` | items[]{q, aHtml} | 常见问答 |
| `people-grid` | title, desc, managers[]（复用 card-manager 宏） | 加盟区域负责人 |
| `cta-panel` | title, desc, qr?{img, hint, steps}, button?{text, href, icon}, phonesHtml | 招募 CTA / 商务 CTA |

图标处理沿用 partner.yaml 现有先例：SVG inner 内容以字符串存 yaml，模板 `| safe` 注入。无规律的一次性内容用 `@matrix/blocks` 的 `custom-html` 兜底。

### 4. 内容下沉 `sites/edaijia/`

- `content/home.yaml`、`entry.yaml`、`serves.yaml`、`partner.yaml`、`questions.yaml`、`404.yaml` 补齐 `blocks:` 数组，承接原模板全部业务内容（文案、SVG 图标、图片路径、电话/邮箱、收费数字、外链）。`questions` 的 `locals.faq`、`partner` 的 `locals.partner` 迁移为对应 block 的 `data`。
- `site.yaml`：`theme: company`；导航 `order` 项改为 `{ key: order, text: 叫代驾, href: /#download }`；collection 配置增加 `list.locals` / `detail.locals`，注入 blog 页头文案（「代驾学堂 / 行业洞察」等）、cluster→中文分类名映射、侧边栏推广卡（含替换原 `/order` 链接的下载引导）、面包屑文案。

### 5. 平台级小改动（packages/cli）

`packages/cli/src/blog.ts` 的 `CollectionConfig`：`list` / `detail` 增加可选 `locals?: Record<string, unknown>`，与生成的 `{articles}` / `{article, related}` 合并后传入模板（配置 locals 优先级低于生成数据）。约 10 行，通用能力，不做站点特判。

### 6. 验证与发布

1. `npm run build:platform` + `npm run build -w @matrix/theme-company` → `npm run matrix -- export edaijia`。
2. 导出 `out/` 与重构前 `out/` 做逐页 HTML 对照，确认内容零丢失。预期差异仅：order 死链消失、死代码不再出现、blog 侧边栏卡片链接调整。
3. `matrix dev edaijia` 本地预览，逐页确认视觉不回归（theme.css 除死代码段外不动，视觉风险接近零）。
4. 更新 `deploy/deploy.sh` 主题引用；实际线上同步（rsync）待用户确认后执行。

## 错误处理

- content yaml 缺失必填 meta 字段时 loadSite 既有校验会直接报错（保持现状）。
- 未知 block type：`page.njk` 使用 `ignore missing`，与 dossier 行为一致——未知类型静默跳过，靠导出对照发现遗漏。

## 范围外

- 不改 dossier / arrfunds / didi 主题；不动 `packages/site-kit` 渲染内核；不重设计视觉；不迁移 `docs/edaijia-drafts` 草稿内容。
