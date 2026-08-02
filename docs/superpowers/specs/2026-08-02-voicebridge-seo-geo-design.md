# voicebridge.top SEO / GEO 内容矩阵化设计

日期：2026-08-02
状态：待批准

## 目标

把 `sites/voicebridge.top` 从「一个手写首页 + 6 个法务/支持页」改造成中文内容矩阵——**新增 27 个页面（23 个内容页 + 3 个列表页 + 1 个事实页）**，让长尾搜索词有实体页可落、让 AI 生成引擎有可引用的事实段落，同时：

1. 迁到 `matrix` 平台的数据驱动链路（`site.yaml` + `content/**` → `matrix export`），摆脱手写 HTML 的维护地狱。
2. 现有首页的苹果发布会风视觉**逐像素保留**，提取为 `themes/voicebridge`，新页面天然继承同一设计语言。
3. 现网已收录的 6 个 URL **一个都不变**，零 301。

## 背景与现状

### 站点现状

`sites/voicebridge.top/` 是纯静态手写目录，`deploy.sh` 里 `EXPORT_CMD` 只是把根目录 HTML 拷进 `out/`：

| 文件 | 说明 |
|---|---|
| `index.html` / `index_en.html` | 36KB 手写首页，CSS 内联在 `<style>`，含滚动动效与 bento 卡片 |
| `support.html` / `support_en.html` | 技术支持 |
| `privacy.html` / `privacy_en.html` | 隐私政策 |
| `terms.html` / `terms_en.html` | 使用条款 |
| `sitemap.xml` / `robots.txt` | 手写，`lastmod` 全站固定 `2026-07-05` |

首页 SEO 基建其实齐全：`canonical`、三条 `hreflang`、完整 OG/Twitter Card、JSON-LD `@graph`（`SoftwareApplication` + `Organization` + `FAQPage`）。**问题不在首页质量，在页面数量。**

### 三个具体缺陷

1. **长尾词无落点。** 首页 title/H1 已被「录音转文字 + 会议纪要」两个大词占满。「iPhone 语音备忘录怎么转文字」「m4a 转文字」「什么是声纹分离」这类长尾词，站上没有任何对应实体页可排。
2. **GEO 没有可引用单元。** AI 引擎抽取的是能独立成立的事实段落，而首页是营销文案（「别家要订阅的能力，这里 0 元全开」）——人看了会心动，模型无法引用。
3. **无更新频率信号。** `lastmod` 全站停在 2026-07-05，1.4 已发版（校对纠错、纠错词典）但站上没有任何痕迹。

### 平台能力盘点（已验证）

可直接用：

- `packages/cli` 的 `loadSite()` 递归扫描 `content/**`，`*.yaml` 与 `*.md` 都是页面；`.md` 的 frontmatter 支持 `path` / `template` / 完整 `meta`（含 **逐页 `jsonLd`**），正文经 `marked` 编译为 `custom-html` block 追加在 `blocks` 之后。
- `routeFromFile()`：`content/guides/xxx.md` → 路由 `/guides/xxx`；`home` / `index` → `/`。
- `PageMeta` 已含 `canonical` / `keywords` / `jsonLd` / `lang` / `priority` / `changefreq` / `blocks`。
- `themes/company` 已验证的 block 模式（15 个 block 模板）可作为新主题的结构参考。
- `matrix dev <site>` / `matrix export <site>`；`deploy.template.sh` 认 `EXPORT_CMD`。

**因此不使用 collection 引擎。** collection 的 `expandCollection()` 对同一集合的所有详情页共用一份 `meta.jsonLd`，无法逐篇给 `HowTo`；而普通 `.md` 页天然支持逐页 `jsonLd`。教程/知识页一律走普通 `.md`，列表页手写为 YAML block 页。

## 决策记录

| 决策 | 结论 | 理由 |
|---|---|---|
| 市场重心 | 中文为主；英文只保首页 + 法务，不铺长尾 | App 已在中国区上架，转化路径最短；英文侧竞争极其激烈，投入产出不成比例 |
| 内容形态 | 一次性铺 23 个静态页，之后随发版低频维护 | 单人独立开发，博客流断更反而是负信号 |
| 技术形态 | 迁到 site-kit 数据驱动 | 23 页 × 手写 HTML + 手改 sitemap/内链 = 维护失控 |
| 视觉 | 新建 `themes/voicebridge`，从 `index.html` 提取 | 保住现有转化率高的视觉，且新页面自动继承 |
| 对比页 | 只做品类对比（在线 vs 离线），不点名竞品 | 规避商标与不正当竞争风险 |
| 方案范围 | 只做官网，不含站外 | 用户选定 |
| 教程/知识页载体 | 普通 `.md` 页，非 collection | collection 无法逐篇 `jsonLd`（见上） |
| AI 爬虫 | robots.txt 显式放行，含 `Google-Extended` | GEO 的前提；`Google-Extended` 等于允许 Gemini 训练用，如需收紧单独删这一行 |
| 旧 URL | 6 个 `.html` 路径原样保留，零 301 | 已收录页面，不冒险 |

## 设计

### 1. 目录结构

```
sites/voicebridge.top/
  site.yaml                    # 单源：theme / brand / nav / footer / defaults / extraAssets
  content/
    home.yaml                  # → /
    404.yaml
    support.yaml               # path: /support.html（显式覆盖，保旧 URL）
    privacy.yaml               # path: /privacy.html
    terms.yaml                 # path: /terms.html
    faq.yaml                   # → /faq
    about.yaml                 # → /about
    changelog.md               # → /changelog
    facts.md                   # → /facts
    features/*.yaml            # 4 个支柱页
    scenes/*.yaml              # 5 个场景页 + scenes/index.yaml 列表
    guides/*.md                # 6 个教程页 + guides/index.yaml 列表
    learn/*.md                 # 4 个知识页 + learn/index.yaml 列表
    compare/online-vs-offline.md
    en/
      home.yaml                # path: /index_en.html
      support.yaml             # path: /support_en.html
      privacy.yaml             # path: /privacy_en.html
      terms.yaml               # path: /terms_en.html
  images/
  deploy/{deploy.sh, nginx.conf}

themes/voicebridge/
  theme.ts                     # manifest：templates 表 + tokens
  theme.css                    # 现 index.html <style> 全量迁入并 token 化
  client/app.ts                # 现有滚动动效原样移植
  views/
    layouts/base.njk
    partials/{head,nav,footer}.njk
    pages/{page,article}.njk
    blocks/*.njk
```

### 2. 主题：`themes/voicebridge`

从 `index.html` 提取的 block（对应现有 section）：

| block | 来源 |
|---|---|
| `hero` | 现 `.hero` 大标题 + 双 CTA |
| `band` | 现 `.band` 全宽标语带 |
| `feature-bento` | 现 bento 卡片网格（10 张） |
| `support-panel` | 现 `.support` 区 |
| `download-cta` | 现底部下载区 |

新增 block（内容矩阵需要）：

| block | 用途 |
|---|---|
| **`answer-card`** | **GEO 核心载体**。每页首屏一段 40–80 字直答：`<h2>` 问句 + 可核验事实句，脱离上下文也成立。同时是页面 `FAQPage`/`Answer` schema 的文案来源 |
| `prose` | Markdown 正文容器（`custom-html` 的样式壳） |
| `step-list` | 教程步骤，配 `HowTo` schema |
| `card-grid` | 列表页（`/guides` `/learn` `/scenes`）的条目网格 |
| `fact-table` | 品类对比页的事实对照表 |
| `breadcrumb` | 面包屑，配 `BreadcrumbList` schema |
| `related-links` | 页尾相关阅读，撑内链密度 |

`head.njk` 自己写（不复用 `themes/company` 那份，那份硬编码了 `Content-Language: zh-CN` 与 `og:locale: zh_CN`），需支持：`canonical`、`hreflang` alternates、`og:locale` 按 `page.lang` 切换、`page.jsonLd`。

### 3. 内容地图（新增 27 页 = 23 内容页 + 3 列表页 + 1 事实页）

**支柱层 4 页**（大词，各 1500–2500 字，`SoftwareApplication` + `FAQPage`）

| 路径 | 主词 |
|---|---|
| `/features/offline-transcription` | 离线录音转文字、语音转文字免费 |
| `/features/meeting-minutes` | AI 会议纪要、会议记录整理 |
| `/features/speaker-diarization` | 发言人分离、区分说话人（讲**产品能力与效果**） |
| `/features/privacy-local` | 录音不上传、本地转写、隐私 |

**场景层 5 页**（意图词，各 800–1200 字）

`/scenes/interview`（采访逐字稿）、`/scenes/lecture`（课堂讲座）、`/scenes/podcast`（播客与视频文稿）、`/scenes/meeting`（商务会议）、`/scenes/voice-memo`（语音备忘录批量转写），外加 `/scenes` 列表页。

**教程层 6 页**（长尾，`HowTo` schema）

`/guides/iphone-voice-memo-to-text`、`/guides/m4a-mp3-to-text`、`/guides/import-audio`、`/guides/proofread-dictionary`（1.4 新功能：校对纠错 + 纠错词典）、`/guides/export-share`、`/guides/languages`，外加 `/guides` 列表页。

**知识层 4 页**（GEO 主力，定义型，`Article` + `DefinedTerm`）

`/learn/what-is-asr`、`/learn/how-diarization-works`（讲**技术原理**：声纹嵌入与切分）、`/learn/on-device-vs-cloud`、`/learn/transcript-vs-minutes`，外加 `/learn` 列表页。

**支撑层 3 页**：`/faq`（问题总集，`FAQPage`）、`/changelog`（1.4 起，每次发版加一条 = 持续更新信号）、`/about`。

**对比 1 页**：`/compare/online-vs-offline`，品类对比，不点名。

**防自相残杀规则（写进实施清单，逐页核）**：`/features/speaker-diarization` 只讲产品能力与用户可见效果；`/learn/how-diarization-works` 只讲技术原理，不出现产品操作步骤。两页互链，title/H1 意图明确切开。同理 `/features/offline-transcription` 与 `/learn/on-device-vs-cloud`。

英文侧维持 4 页（首页 + 支持 + 隐私 + 条款），不铺长尾。

### 4. GEO 专项

1. **Answer-first 写法。** 每页首个 `answer-card` block 的文案必须脱离上下文成立，能被整段摘走。禁止使用「上文提到」「如前所述」。
2. **事实源三件套。**
   - `/facts` 页：产品定义、当前版本、平台要求、语种数、价格模型、隐私边界，全部以「主语 + 谓语 + 数值」的短句列出。
   - `/llms.txt`：产品一句话定义 + 每页一行摘要与 URL。
   - `/llms-full.txt`：全站正文纯文本合并。
   两个 txt 由构建脚本从 `content/**` 生成，不手写（见平台改动 F4）。
3. **结构化数据分层。** 支柱 = `SoftwareApplication` + `FAQPage`；教程 = `HowTo`；知识 = `Article` + `DefinedTerm`；全站 = `BreadcrumbList`；首页维持现有 `@graph`。
4. **robots.txt 显式放行 AI 爬虫**：`GPTBot`、`OAI-SearchBot`、`PerplexityBot`、`ClaudeBot`、`Claude-SearchBot`、`Bytespider`（豆包）、`Baiduspider`、`YisouSpider`（夸克/UC）、`Google-Extended`。
5. **形容词换数字。** 不写「支持多语种」写「12 语种」；不写「完全免费」写「无内购、无广告、无使用时长上限」。模型引用时明显偏好带具体数值的句子。所有数字必须与 App 实际能力一致，发版后同步核对。
6. **真实 `lastmod`。** 现 `generateSitemap()` 用 `new Date()` 给全站同一个日期，改为按内容文件 mtime 或 frontmatter `updated` 字段（见 F2）。

### 5. URL 保留策略

现网已收录 6 个 `.html` 扁平路径。`export.ts` 现有逻辑对非 `/` 的 `path` 一律 `mkdir OUT/<path>` 再写 `index.html`，直接迁会把这 6 个 URL 全改成目录式。

方案：

- 旧 6 页在 content 里显式声明 `path: '/privacy.html'` 等，`export.ts` 增加规则「`path` 以 `.html` 结尾则直出文件」（F1）。
- 新增 17 页一律目录式（`/guides/xxx` → `out/guides/xxx/index.html`）。
- **canonical 统一带尾斜杠**（`/guides/xxx/`），内链也一律带尾斜杠。因为 nginx 的 `try_files $uri $uri/` 会让 `/guides/xxx` 与 `/guides/xxx/` 都返回 200，canonical 是唯一的去重手段。
- 零 301。半年后视收录情况再决定要不要统一路径风格。

### 6. 平台改动（4 处，在 matrix 公共层，其它站点同样受益）

| # | 文件 | 改动 |
|---|---|---|
| F1 | `packages/site-kit/src/export.ts` | `path` 以 `.html` 结尾时直接写文件，不建目录 |
| F2 | `packages/site-kit/src/sitemap.ts` | `generateSitemap()` 支持 hreflang alternates + 逐页真实 `lastmod` |
| F3 | `packages/site-kit/src/sitemap.ts` | `generateRobots()` 支持站点自定义 UA 段（现在写死 `User-agent: *`） |
| F4 | `packages/cli/src/cli.ts` + 新增 `llms.ts` | 导出时生成 `llms.txt` / `llms-full.txt`（站点在 `site.yaml` 开关） |

F2 需要 `PageMeta` 增加 `alternates?: Array<{hreflang: string; href: string}>` 与 `updated?: string`，`types.ts` 与 `load.ts` 的 `buildMeta()` 同步透传。

`themes/company/views/partials/head.njk` 的 `zh-CN` 硬编码**不动**——新主题自己写 head，不牵连 e代驾。

### 7. 发布链路

`sites/voicebridge.top/deploy/deploy.sh` 的 `EXPORT_CMD` 从「拷 HTML」改为对齐 `sites/edaijia/deploy/deploy.sh`：

```bash
(cd "$REPO_ROOT" && npm run build:platform && npm run build -w @matrix/theme-voicebridge)
export EXPORT_CMD="npm --prefix '$REPO_ROOT' run matrix -- export '$SITE_NAME'"
```

`nginx.conf` 不动（`try_files $uri $uri/` 已同时支持 `.html` 与目录式）。

## 分期

- **阶段 0**：平台 F1–F4 + 建 `themes/voicebridge`（提 CSS、拆 block、移植动效）。
- **阶段 1**：首页 + 6 个法务/支持页迁移。验收硬指标：`matrix export` 产物与当前 `out/` 逐页视觉比对无差异，6 个旧 URL 路径不变。
- **阶段 2**：内容铺设，顺序 **知识 4 + 支柱 4 → 场景 5 + 教程 6 → 支撑 3 + 对比 1**。知识层排最前，因为它 GEO 见效最快且不依赖排名。
- **阶段 3**：sitemap/robots/llms.txt 产出核对；百度站长（已有 ICP 备案，是优势）+ GSC + Bing 站长提交；百度主动推送脚本。

## 验收口径

**不承诺排名。** 只认三个可验证的数：

1. **收录数**：站内可索引 URL 从 8 个（现 sitemap 数量）增至 35 个，看百度站长 + GSC 索引报告的实际收录比例。
2. **展现词数**：GSC / 百度站长的查询词覆盖数变化。
3. **AI 引用实测**：在豆包、元宝、ChatGPT 各问 5 个目标问题（如「iPhone 上有什么不上传录音的转文字 App」「怎么把 m4a 转成文字」），看是否被引用。**上线前先跑一次基线并记录**，否则无法归因。

阶段 1 另有一项硬性回归验收：现网 6 个 URL 全部 200，内容与迁移前一致。

## 已知边界

- 官网只是 GEO 的一半。中文 AI 引擎的语料权重高度依赖知乎、公众号、B 站，纯官网对豆包/元宝的引用贡献有上限。本方案按用户选定的「只做官网」范围执行，站外不在范围内。
- 27 页中文内容需要实际撰写，本设计只定义信息架构、schema 与写作规则，不代替内容本身的质量。
- 页面中出现的一切产品数字（12 语种、iOS 17.0+、版本号）以 App 实际能力为准，发版后需同步核对 `/facts` 与 `/changelog`。
