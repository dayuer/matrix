# voicebridge.top 阶段 2：27 页内容矩阵实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在阶段 1 已上线的数据驱动链路上，新增 27 个中文页面（4 支柱 / 5 场景 / 6 教程 / 4 知识 / 3 列表 / 3 支撑 / 1 对比 / 1 事实页），让长尾搜索词有实体页可落、AI 生成引擎有可引用的事实段落。

**Architecture:** 复用阶段 1 的 `themes/voicebridge` 与 `sites/voicebridge.top/content/**`。新增 7 个 block 模板与配套样式，长文页走 `template: article`，新页面一律目录式 URL（`/learn/what-is-asr/`），与既有 6 个扁平 `.html` 历史 URL 共存。

**Tech Stack:** Nunjucks、YAML/Markdown 内容、`@matrix/cli` 导出、`scripts/html-text-diff.mjs` 验收。

**Spec:** `docs/superpowers/specs/2026-08-02-voicebridge-seo-geo-design.md`

**阶段 1 已完成并上线**（`main` 分支，commit `a9efaa0`）：平台四处能力补齐、`themes/voicebridge` 主题、中英各 4 页迁移、9 个 URL 零变化。

---

## 阶段 1 留下的、本计划必须遵守的教训

这些是阶段 1 用实测代价换来的，违反任何一条都会重现同类事故：

1. **样式不会自己出现。** 新增 block 必须同时写 `theme.css` 规则。阶段 1 的法务页就是因为只迁了首页 `<style>`、三页各自的 `<style>` 从未被看过，上线后排版全塌。
2. **通用选择器必须作用域隔离。** 裸 `h1/h2/p/li` 与 `.eyebrow`/`.faq`/`.container` 已被首页和 `body.legal` 占用。新页面用 `body.doc` 作用域，且**新规则里没显式声明的属性会继承旧规则**（阶段 1 的 `.eyebrow` letter-spacing 就漏了）。
3. **body 级 class 不得与组件 class 重名。** 阶段 1 用 `body.support` 触发了首页 `section.support` 的 `.support p { max-width: 44ch }`，整页段落被压窄。本计划的 body class 一律 `doc-` 前缀。
4. **验收工具有三个盲区**：`html-text-diff.mjs` 看不到 JSON-LD、og 标签、SVG 图形内容。这三类要单独断言。
5. **Nunjucks 不是 Jinja2**（`startsWith` 必须驼峰），**js-yaml 会把裸日期解析成 Date**、**含 ASCII `": "` 的裸标量解析失败**。
6. **改共用模板必须验证不回归。** `nav.njk`/`footer.njk`/`page.njk` 中英共用，改动要用 git worktree 取改动前的产物做逐字节对照。

**验证基线：** 仓库无测试框架。每批内容落地后必须跑：导出成功 → 新页面 URL 存在 → JSON-LD `deepStrictEqual` 自校验 → 既有 8 页文本零回归 → 计算样式比对（新 block 首次出现时）。

**⚠️ 工作区纪律：** 仓库长期有 arrfunds 在飞的未提交改动（`sites/arrfunds/*`、`themes/arrfunds/*`、未跟踪的 `supabase/`）。**每次提交只 `git add` 本任务明确列出的路径，禁止 `git add -A`。**

---

## 批次与评审门

用户已确认：**文案由我全写，逐批停下来给用户审**。批次划分：

| 批次 | 内容 | 页数 | 评审门 |
|---|---|---|---|
| **批 1** | Task 1–3：7 个 block + 样式 + 知识层 4 页 + `/learn/` 列表 | 5 | ✅ 停下来给用户审文案与视觉 |
| 批 2 | Task 4：支柱层 4 页 | 4 | 停 |
| 批 3 | Task 5：场景层 5 页 + `/scenes/` 列表 | 6 | 停 |
| 批 4 | Task 6：教程层 6 页 + `/guides/` 列表 | 7 | 停 |
| 批 5 | Task 7：支撑 3 页 + 对比 1 页 + `/facts` | 5 | 停 |
| 批 6 | Task 8–9：导航/内链/sitemap/llms 收口 + 全站验收 + 上线 | — | 上线前必须用户确认 |

合计新增 27 页。**本计划先详写批 1（Task 1–3）；批 2–6 的页面清单与写作规则已定义在下方「后续批次页面清单」，但逐页的详细内容规格待批 1 评审通过后再补**——阶段 1 的教训是，模板的实际形态会改变内容的写法，提前写细会写成空话。

---

## 产品事实基准（写作时必须遵守）

以下从 App 源码 `~/sproot/translate/Sources/Services/` 与现有官网核实，**知识层与支柱层的技术描述必须与此一致，不得演绎**：

| 事实 | 值 | 出处 |
|---|---|---|
| 最低系统 | iOS 17.0+ | `AGENTS.md`、首页 JSON-LD |
| ASR 引擎 | sherpa-onnx 统一引擎；离线 SenseVoice 做高精度全量转录 | `SherpaASRService.swift` 头注释 |
| 其它 ASR 模型 | zipformer、paraformer 在栈内 | 源码引用统计 |
| VAD | silero | 源码引用统计 |
| 说话人切分 | pyannote segmentation-3.0 | `SpeakerDiarizationEngine.swift` 头注释 |
| 声纹模型 | CAM++（亦支持 ECAPA-TDNN），输入 16kHz mono PCM，输出归一化向量 | `SpeakerEmbeddingService.swift` |
| 分离方式 | pyannote 切分 + CAM++ 声纹 + 快速聚类 | 同上 |
| 旧方案的问题 | 「VAD 段落 + 段级 AHC 聚类」会把一个含多人接话的 VAD 段整段归给一人，导致观点张冠李戴；固定阈值 AHC 在不同音频上表现不稳 | `SpeakerDiarizationEngine.swift` 头注释 |
| 标点恢复 | CT-Transformer 离线模型（中英文）；失败时降级为 ASR 自带标点 + 规则修补 | `PunctuationService.swift` |
| 语义搜索 | Apple NaturalLanguage `NLEmbedding`，512 维向量，零包体积、零网络 | `RAGEmbeddingService.swift` |
| 语种数 | 12 语种离线识别 | 首页 JSON-LD featureList |
| 音频格式 | M4A、WAV、MP3 等主流格式 | 首页 FAQ |
| 价格模型 | 无内购、无广告、无需注册、无时长/条数限制 | 首页 |
| 数据边界 | 识别/声纹/语义向量全部本地完成；音频与文字不上传。使用「AI 智能纪要」时，转录文本经系统剪贴板在用户明确授权下传给用户选择的第三方 AI App | 首页 + 隐私政策 |

**写作红线**：
- 不得写「最准确」「第一」「唯一」这类无法证实的最高级表述。
- 不得点名竞品（用户已拍板：只做品类对比）。
- 不得承诺识别准确率数字——源码里没有可引用的基准。
- 涉及「免费」的表述可以写（这条禁令只约束 App Store 元数据，不约束官网）。

---

### Task 1: 7 个 block 模板

**Files:**
- Create: `themes/voicebridge/views/blocks/answer-card.njk`
- Create: `themes/voicebridge/views/blocks/prose.njk`
- Create: `themes/voicebridge/views/blocks/step-list.njk`
- Create: `themes/voicebridge/views/blocks/card-grid.njk`
- Create: `themes/voicebridge/views/blocks/fact-table.njk`
- Create: `themes/voicebridge/views/blocks/breadcrumb.njk`
- Create: `themes/voicebridge/views/blocks/related-links.njk`

所有 block 的可见文案字段**默认转义**；只有明确承载 HTML 的字段（`html`、`bodyHtml`）加 `| safe`。这一条在阶段 1 被逐字段验证过，照此办理。

- [ ] **Step 1: answer-card.njk（GEO 核心载体）**

```njk
{# 直答卡：每页首屏一段可脱离上下文成立的回答，同时是 FAQPage/Answer schema 的文案来源。
   question 用 h2 而非 h1——h1 留给页面标题，避免与 breadcrumb 后的标题竞争。 #}
<section class="answer-card">
  <div class="doc-wrap">
    <div class="ac-box">
      {% if block.data.question %}<h2 class="ac-q">{{ block.data.question }}</h2>{% endif %}
      <p class="ac-a">{{ block.data.answer }}</p>
      {% if block.data.facts %}
      <ul class="ac-facts">
        {% for f in block.data.facts %}<li>{{ f }}</li>{% endfor %}
      </ul>
      {% endif %}
    </div>
  </div>
</section>
```

- [ ] **Step 2: prose.njk（正文容器）**

```njk
{# 长文正文。html 字段承载 Markdown 编译后的 HTML，必须 safe；
   排版规则全部由 body.doc 作用域下的 theme.css 提供。 #}
<section class="prose">
  <div class="doc-wrap">
    {% if block.data.title %}<h2>{{ block.data.title }}</h2>{% endif %}
    {{ block.data.html | safe }}
  </div>
</section>
```

- [ ] **Step 3: step-list.njk（教程步骤，配 HowTo schema）**

```njk
{# 有序步骤。每步 name + text，可选 tip。HowTo 的结构化数据由页面 meta.jsonLd 提供，
   这里只负责可见结构，两者的文案必须一致。 #}
<section class="step-list">
  <div class="doc-wrap">
    {% if block.data.title %}<h2>{{ block.data.title }}</h2>{% endif %}
    <ol class="steps">
      {% for s in block.data.steps %}
      <li class="step">
        <div class="step-n">{{ loop.index }}</div>
        <div class="step-body">
          <h3>{{ s.name }}</h3>
          <p>{{ s.text }}</p>
          {% if s.tip %}<p class="step-tip">{{ s.tip }}</p>{% endif %}
        </div>
      </li>
      {% endfor %}
    </ol>
  </div>
</section>
```

- [ ] **Step 4: card-grid.njk（列表页条目）**

```njk
{# 列表页的条目网格（/learn/、/guides/、/scenes/ 共用）。 #}
<section class="card-grid">
  <div class="doc-wrap">
    {% if block.data.title %}<h2>{{ block.data.title }}</h2>{% endif %}
    {% if block.data.lead %}<p class="cg-lead">{{ block.data.lead }}</p>{% endif %}
    <div class="cg-items">
      {% for it in block.data.items %}
      <a class="cg-item" href="{{ it.href }}">
        {% if it.kicker %}<span class="cg-kicker">{{ it.kicker }}</span>{% endif %}
        <h3>{{ it.title }}</h3>
        <p>{{ it.desc }}</p>
      </a>
      {% endfor %}
    </div>
  </div>
</section>
```

- [ ] **Step 5: fact-table.njk（品类对比表）**

```njk
{# 事实对照表。用于 /compare/online-vs-offline/ 与 /facts。
   rows[].cells 是字符串数组，长度必须与 head 一致——不一致时表格会错位，
   Task 3 的断言会检查这一点。 #}
<section class="fact-table">
  <div class="doc-wrap">
    {% if block.data.title %}<h2>{{ block.data.title }}</h2>{% endif %}
    <div class="ft-scroll">
      <table>
        <thead><tr>{% for h in block.data.head %}<th>{{ h }}</th>{% endfor %}</tr></thead>
        <tbody>
          {% for r in block.data.rows %}
          <tr>{% for c in r.cells %}<td>{{ c }}</td>{% endfor %}</tr>
          {% endfor %}
        </tbody>
      </table>
    </div>
  </div>
</section>
```

- [ ] **Step 6: breadcrumb.njk**

```njk
{# 面包屑。BreadcrumbList 结构化数据由页面 meta.jsonLd 提供，此处只渲染可见结构。
   最后一项是当前页，不带链接。 #}
<nav class="breadcrumb" aria-label="面包屑">
  <div class="doc-wrap">
    <ol>
      {% for c in block.data.items %}
      <li>{% if c.href %}<a href="{{ c.href }}">{{ c.text }}</a>{% else %}<span aria-current="page">{{ c.text }}</span>{% endif %}</li>
      {% endfor %}
    </ol>
  </div>
</nav>
```

- [ ] **Step 7: related-links.njk（内链密度）**

```njk
{# 页尾相关阅读。内链是本次改造的重要一环——27 页若互不链接，等于 27 个孤岛。 #}
{% if block.data.items %}
<section class="related">
  <div class="doc-wrap">
    <h2>{{ block.data.title or '相关阅读' }}</h2>
    <ul class="rel-list">
      {% for it in block.data.items %}
      <li><a href="{{ it.href }}">{{ it.text }}</a>{% if it.desc %}<span class="rel-desc">{{ it.desc }}</span>{% endif %}</li>
      {% endfor %}
    </ul>
  </div>
</section>
{% endif %}
```

- [ ] **Step 8: 渲染冒烟测试（不能只写不跑）**

用 `createEnv()` + 真实 manifest 渲染一个含全部 7 个 block 的页面，确认：无异常、7 个 block 都出现在产物里、`prose.html` 的 HTML 是真标签而**其余字段被转义**（往 `answer-card.answer`、`step.name`、`cg-item.title` 各注入 `<b>x</b>` 与 `&`，确认输出为 `&lt;b&gt;`）。贴完整产物。

- [ ] **Step 9: 提交**

```bash
cd ~/sproot/matrix
git add themes/voicebridge/views/blocks
git commit -m "feat(theme): 新增 7 个内容页 block（answer-card/prose/step-list/card-grid/fact-table/breadcrumb/related-links）"
```

---

### Task 2: block 样式与 `body.doc` 作用域

**Files:**
- Modify: `themes/voicebridge/theme.css`

**这是阶段 1 翻车过的地方**：block 有了模板没有样式，页面就是裸文本。本任务与 Task 1 是一体的，不得跳过。

- [ ] **Step 1: 追加样式段**

在 `theme.css` 末尾追加。所有规则作用域在 `body.doc` 下，**通用标签选择器必须显式声明会被首页规则影响的属性**（`letter-spacing`、`line-height`、`max-width`、`margin`），避免继承。

```css
  /* ---------- 内容页（body.doc） ----------
     阶段 2 的 27 个长文页共用。作用域必须隔离：裸 h1/h2/h3/p/ul/li 已被首页
     与 body.legal 占用；.container/.eyebrow/.faq 同理。body class 一律 doc- 前缀，
     不得与任何组件 class 重名（阶段 1 的 body.support 撞了 section.support）。 */
  body.doc { line-height: 1.7; }
  body.doc a:hover { text-decoration: underline; }
  .doc-wrap { max-width: 720px; margin: 0 auto; padding: 0 22px; }

  /* 面包屑 */
  .breadcrumb { padding-top: calc(var(--nav-h) + 28px); }
  .breadcrumb ol { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0; margin: 0; }
  .breadcrumb li { font-size: 13.5px; color: var(--ink-3); margin: 0; }
  .breadcrumb li + li::before { content: "/"; margin-right: 8px; color: var(--border); }
  .breadcrumb a { color: var(--ink-2); }
  .breadcrumb a:hover { color: var(--ink); text-decoration: none; }

  /* 页面标题（内容页专用，避开首页的 h1.title） */
  body.doc .doc-title { font-size: clamp(32px, 5vw, 46px); font-weight: 700; letter-spacing: -0.025em; line-height: 1.1; color: var(--ink); margin: 18px 0 0; text-wrap: balance; }
  body.doc .doc-sub { font-size: 17px; color: var(--ink-2); margin-top: 14px; line-height: 1.6; text-wrap: pretty; }

  /* 直答卡：GEO 的主要载体，视觉上要显著但不喧宾夺主 */
  .answer-card { margin-top: 30px; }
  .ac-box { background: var(--surface-2); border-radius: var(--r-lg); padding: 26px 28px 28px; }
  .ac-q { font-size: 18px; font-weight: 600; color: var(--ink); letter-spacing: -0.01em; margin: 0 0 12px; line-height: 1.45; }
  .ac-a { font-size: 16.5px; color: var(--ink); line-height: 1.72; margin: 0; text-wrap: pretty; }
  .ac-facts { margin: 16px 0 0; padding-left: 20px; }
  .ac-facts li { font-size: 15px; color: var(--ink-2); margin-bottom: 6px; }

  /* 正文 */
  .prose { margin-top: 34px; }
  body.doc .prose h2 { font-size: 26px; font-weight: 600; letter-spacing: -0.018em; color: var(--ink); margin: 44px 0 14px; line-height: 1.25; }
  body.doc .prose h2:first-child { margin-top: 0; }
  body.doc .prose h3 { font-size: 19px; font-weight: 600; letter-spacing: -0.012em; color: var(--ink); margin: 30px 0 10px; line-height: 1.35; }
  body.doc .prose p { font-size: 16.5px; color: var(--ink-2); margin: 0 0 14px; line-height: 1.72; text-wrap: pretty; }
  body.doc .prose ul, body.doc .prose ol { padding-left: 22px; margin: 0 0 14px; }
  body.doc .prose li { font-size: 16.5px; color: var(--ink-2); margin-bottom: 8px; line-height: 1.7; }
  body.doc .prose strong { color: var(--ink); font-weight: 600; }
  body.doc .prose blockquote { border-left: 3px solid var(--accent); padding-left: 16px; margin: 20px 0; color: var(--ink-2); }
  body.doc .prose code { background: var(--surface-2); border-radius: 6px; padding: 2px 6px; font-size: 14.5px; }

  /* 教程步骤 */
  .step-list { margin-top: 34px; }
  .steps { list-style: none; padding: 0; margin: 0; counter-reset: none; }
  .step { display: flex; gap: 16px; padding: 20px 0; border-top: 1px solid var(--border-2); }
  .step:last-child { border-bottom: 1px solid var(--border-2); }
  .step-n { flex: none; width: 30px; height: 30px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
  .step-body { flex: 1; }
  body.doc .step-body h3 { font-size: 17.5px; font-weight: 600; color: var(--ink); margin: 3px 0 6px; letter-spacing: -0.01em; }
  body.doc .step-body p { font-size: 16px; color: var(--ink-2); margin: 0 0 6px; line-height: 1.68; }
  body.doc .step-tip { font-size: 14.5px; color: var(--ink-3); }

  /* 列表页条目 */
  .card-grid { margin-top: 34px; }
  .cg-lead { font-size: 16.5px; color: var(--ink-2); margin: 0 0 22px; line-height: 1.7; }
  .cg-items { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .cg-item { display: block; background: var(--surface-2); border-radius: var(--r-md); padding: 22px 22px 24px; transition: transform .15s ease, background .2s ease; }
  .cg-item:hover { background: #eeeef1; text-decoration: none; transform: translateY(-2px); }
  .cg-kicker { display: block; font-size: 12.5px; font-weight: 600; color: var(--accent); letter-spacing: 0.02em; margin-bottom: 8px; }
  body.doc .cg-item h3 { font-size: 17.5px; font-weight: 600; color: var(--ink); margin: 0 0 8px; letter-spacing: -0.012em; line-height: 1.35; }
  body.doc .cg-item p { font-size: 14.5px; color: var(--ink-2); margin: 0; line-height: 1.6; }
  @media (max-width: 640px) { .cg-items { grid-template-columns: 1fr; } }

  /* 事实对照表 */
  .fact-table { margin-top: 34px; }
  .ft-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .fact-table table { width: 100%; border-collapse: collapse; font-size: 15.5px; }
  .fact-table th, .fact-table td { text-align: left; padding: 13px 14px; border-bottom: 1px solid var(--border-2); vertical-align: top; }
  .fact-table th { font-weight: 600; color: var(--ink); background: var(--surface-2); white-space: nowrap; }
  .fact-table td { color: var(--ink-2); line-height: 1.6; }
  .fact-table tr:last-child td { border-bottom: none; }

  /* 相关阅读 */
  .related { margin-top: 46px; padding-bottom: 10px; }
  body.doc .related h2 { font-size: 20px; font-weight: 600; color: var(--ink); margin: 0 0 14px; letter-spacing: -0.015em; }
  .rel-list { list-style: none; padding: 0; margin: 0; }
  .rel-list li { padding: 12px 0; border-top: 1px solid var(--border-2); margin: 0; }
  .rel-list li:last-child { border-bottom: 1px solid var(--border-2); }
  .rel-list a { font-size: 16px; color: var(--accent-ink); font-weight: 500; }
  .rel-desc { display: block; font-size: 14px; color: var(--ink-3); margin-top: 4px; }
```

- [ ] **Step 2: 计算样式冒烟**

导出一个使用全部 7 个 block 的测试页，起本地预览，用 `getComputedStyle` 断言：`.doc-wrap` 宽 720px、`.ac-box` 背景为 `rgb(245,245,247)`、`.cg-items` 是两列 grid、`.step-n` 是 30×30 圆形、`.fact-table th` 有背景色。**任何一项拿到浏览器默认值，说明规则没生效。**

- [ ] **Step 3: 首页与法务页零回归**

```bash
cd ~/sproot/matrix && npm run build -w @matrix/theme-voicebridge && npm run matrix -- export voicebridge.top
for f in index.html index_en.html; do node scripts/html-text-diff.mjs <(git show HEAD:sites/voicebridge.top/out/$f 2>/dev/null || echo skip) sites/voicebridge.top/out/$f; done
```

更可靠的做法：用 `git worktree` 取本任务开始前的提交，独立导出一份，对 8 个既有页面做**逐字节** diff（`?v=` 缓存戳除外）。新增的 CSS 全部在 `body.doc` 作用域下，既有页面**不该有任何变化**。

- [ ] **Step 4: 提交**

```bash
cd ~/sproot/matrix
git add themes/voicebridge/theme.css
git commit -m "feat(theme): 7 个内容页 block 的样式，作用域隔离在 body.doc 下"
```

---

### Task 3: 知识层 4 页 + `/learn/` 列表页（批 1 交付物）

**Files:**
- Create: `sites/voicebridge.top/content/learn/index.yaml`（→ `/learn/`）
- Create: `sites/voicebridge.top/content/learn/what-is-asr.yaml`
- Create: `sites/voicebridge.top/content/learn/how-diarization-works.yaml`
- Create: `sites/voicebridge.top/content/learn/on-device-vs-cloud.yaml`
- Create: `sites/voicebridge.top/content/learn/transcript-vs-minutes.yaml`

**为什么知识层排第一**：定义型内容 GEO 见效最快且不依赖排名；同时它能把 7 个新 block 全部跑一遍，早暴露模板问题。

**每页统一结构**（block 顺序固定）：
1. `breadcrumb` — 首页 / 知识 / 当前页
2. 页面标题与副标题（用 `prose` 的第一块，`html` 里放 `<h1 class="doc-title">` 与 `<p class="doc-sub">`）
3. `answer-card` — 40–80 字直答 + 3–5 条可核验事实
4. `prose` × N — 正文分节
5. `related-links` — 3 条相关阅读

**每页 meta 必备**：`title`（含品牌后缀）、`description`（≤ 155 字，含主关键词）、`keywords`、`canonical`（**带尾斜杠**）、`template: article`、`bodyClass: doc`、`priority: 0.6`、`changefreq: monthly`、`jsonLd`（`Article` + `BreadcrumbList`，定义型页面另加 `DefinedTerm`）。

- [ ] **Step 1: `/learn/what-is-asr/`**

主词：语音识别是什么、ASR 是什么、离线语音识别原理。

内容纲要（写作时按此展开，字数 900–1300）：
- 直答：ASR 是把语音波形转成文字的技术；现代 ASR 是「声学特征 → 神经网络 → 文本」的端到端过程，不再依赖人工音素规则。
- 正文分节：① 一段录音是怎么变成文字的（采样 → 特征 → 声学模型 → 解码）；② 为什么标点和分段要单独做（ASR 原始输出是无标点连续串，畅译用 CT-Transformer 离线模型恢复标点，失败时降级为 ASR 自带标点 + 规则修补）；③ 端侧 ASR 与云端 ASR 的工程差异（模型体积、内存、算力）；④ 影响识别质量的现实因素（口音、语速、重叠说话、录音环境）。
- 相关阅读：`/learn/on-device-vs-cloud/`、`/learn/how-diarization-works/`、`/features/offline-transcription/`（后者尚未建，链接先写，批 2 落地后即通）。

- [ ] **Step 2: `/learn/how-diarization-works/`**

主词：说话人分离原理、声纹识别怎么做、diarization。

**这页是知识层的重头**——App 源码里有真实的设计取舍可写，是竞品营销页写不出的深度。内容纲要（1100–1500 字）：
- 直答：说话人分离回答的是「谁在什么时候说话」，与「说了什么」是两个独立问题。
- 正文分节：① 四个阶段（VAD 找出有人声的区间 → 切分 → 每段提声纹向量 → 聚类归人）；② 为什么「VAD 段落 + 段级聚类」会张冠李戴——**一个 VAD 段落里若有多人接话，整段会被归给一人**，这正是会议记录里观点被安错人的根因；③ 畅译的做法：pyannote segmentation-3.0 做切分（能在一个语音活动区间内部切开不同说话人）+ CAM++ 提声纹 + 快速聚类；④ 为什么固定阈值的层次聚类不稳——不同录音的声纹相似度分布不同；⑤ 现实限制：重叠说话、音色相近的人、极短发言。
- 相关阅读：`/features/speaker-diarization/`、`/learn/what-is-asr/`、`/scenes/meeting/`。

- [ ] **Step 3: `/learn/on-device-vs-cloud/`**

主词：端侧 AI、本地语音识别 vs 云端、录音不上传。

内容纲要（900–1200 字）。**必须包含一个 `fact-table`**（品类对比，不点名竞品）：维度为「数据去向 / 可用性 / 成本模型 / 延迟 / 模型规模 / 隐私边界」，两列为「云端转写」「端侧转写」。
- 直答：端侧转写把模型跑在手机上，音频不离开设备；云端把音频上传到服务器换取更大的模型。
- 正文分节：① 两条路线的真实差异（逐条展开表格）；② 端侧的代价（模型体积、首次加载、设备发热与耗电、大模型跑不动）；③ 端侧的不可替代性（飞行模式可用、无账号、数据合规边界清晰）；④ 畅译的边界说明：识别/声纹/语义向量全本地；「AI 智能纪要」是用户主动授权下经系统剪贴板把**文本**交给用户自己选的第三方 AI App，畅译本身不发网络请求。
- 相关阅读：`/features/privacy-local/`、`/learn/what-is-asr/`、`/compare/online-vs-offline/`。

- [ ] **Step 4: `/learn/transcript-vs-minutes/`**

主词：逐字稿是什么、会议纪要怎么写、逐字稿和纪要的区别。

内容纲要（800–1100 字）：
- 直答：逐字稿是「说过的每一句」，纪要是「需要被记住的结论与待办」；前者是原始记录，后者是加工产物。
- 正文分节：① 两者的用途分野（举证/复盘 vs 对齐/执行）；② 从逐字稿到纪要的加工步骤（去口语冗余 → 归并同一议题 → 提取决议与待办 → 标注责任人）；③ 为什么好的纪要必须保留可回溯的原文锚点；④ 什么场景只需要逐字稿、什么场景必须有纪要。
- 相关阅读：`/features/meeting-minutes/`、`/scenes/interview/`、`/guides/export-share/`。

- [ ] **Step 5: `/learn/` 列表页**

`template: page`、`bodyClass: doc`。结构：`breadcrumb` → 标题与导语 → `card-grid`（4 个条目）。`jsonLd` 用 `CollectionPage` + `BreadcrumbList`。

- [ ] **Step 6: 导出与断言**

```bash
cd ~/sproot/matrix && npm run matrix -- export voicebridge.top
# 新页面 URL 存在且是目录式
for p in learn learn/what-is-asr learn/how-diarization-works learn/on-device-vs-cloud learn/transcript-vs-minutes; do
  [ -f "sites/voicebridge.top/out/$p/index.html" ] && echo "OK  /$p/" || echo "缺失 /$p/"
done
# 既有 8 页零回归
for f in index.html index_en.html support.html support_en.html privacy.html privacy_en.html terms.html terms_en.html; do
  node scripts/html-text-diff.mjs "/tmp/vb-p2-base/$f" "sites/voicebridge.top/out/$f" >/dev/null || echo "回归 DIFF: $f"
done
# sitemap 从 8 条增至 13 条
grep -c '<loc>' sites/voicebridge.top/out/sitemap.xml
```

**另需断言**（工具盲区，必须单独查）：
- 每个新页面的 `<script type="application/ld+json">` 能被 `JSON.parse`，且 `@type` 与规格一致。
- 每页 `<h1 class="doc-title">` 恰好 1 个（多个 h1 是 SEO 错误）。
- `related-links` 里的 `href` 全部指向**本计划最终会存在**的路径（批 2–5 尚未落地的允许暂时 404，但要列出清单确认都在计划内）。
- `canonical` 全部带尾斜杠。

- [ ] **Step 7: 视觉验收**

起本地预览，桌面与移动两档各截一页，确认 7 个 block 的样式都生效（尤其 `.cg-items` 两列、`.step-n` 圆形、`.fact-table` 横向可滚动）。

- [ ] **Step 8: 提交**

```bash
cd ~/sproot/matrix
git add sites/voicebridge.top/content/learn
git commit -m "content(voicebridge): 知识层 4 页 + /learn/ 列表页"
```

- [ ] **Step 9: ⛔ 停下来给用户审**

批 1 到此结束。向用户呈交：4 页的完整文案、桌面/移动截图、断言结果。**用户确认文案语气与技术表述无误后，才进入批 2。**

---

## 后续批次页面清单（详细规格待批 1 评审后补写）

**批 2 · 支柱层 4 页**（各 1500–2500 字，`SoftwareApplication` + `FAQPage`）
`/features/offline-transcription/` · `/features/meeting-minutes/` · `/features/speaker-diarization/` · `/features/privacy-local/`

⚠️ **防自相残杀**：`/features/speaker-diarization/` 只讲产品能力与用户可见效果，`/learn/how-diarization-works/` 只讲技术原理，两页互链但 title/H1 意图必须明确切开。`/features/offline-transcription/` 与 `/learn/on-device-vs-cloud/` 同理。

**批 3 · 场景层 5 页 + 列表**（各 800–1200 字）
`/scenes/`（列表）· `/scenes/interview/` 采访逐字稿 · `/scenes/lecture/` 课堂讲座 · `/scenes/podcast/` 播客与视频文稿 · `/scenes/meeting/` 商务会议 · `/scenes/voice-memo/` 语音备忘录批量转写

**批 4 · 教程层 6 页 + 列表**（`HowTo` schema，必须用 `step-list`）
`/guides/`（列表）· `/guides/iphone-voice-memo-to-text/` · `/guides/m4a-mp3-to-text/` · `/guides/import-audio/` · `/guides/proofread-dictionary/`（1.4 新功能：校对纠错 + 纠错词典）· `/guides/export-share/` · `/guides/languages/`

**批 5 · 支撑 3 页 + 对比 1 页 + 事实页**
`/faq/`（`FAQPage`）· `/changelog/`（1.4 起，每次发版加一条 = 持续更新信号）· `/about/` · `/compare/online-vs-offline/`（品类对比，`fact-table`，**不点名竞品**）· `/facts/`（GEO 事实源，全部用「主语 + 谓语 + 数值」短句）

**批 6 · 收口与上线**
- `site.yaml` 的 `nav` 增加内容入口；`footer` 增加分层链接
- 全站内链复核：27 页无孤岛，每页至少被 2 个页面链接
- `sitemap.xml` 应为 35 条 `<loc>`（8 既有 + 27 新增）
- `llms.txt` 应索引 35 页；`llms-full.txt` 含全部正文
- 全站验收（URL 集合 / 文本零回归 / JSON-LD / 视觉两档）
- ⛔ 上线前必须用户确认

---

## 阶段 2 完成定义

1. 35 个页面 URL 全部可访问，既有 8 个 URL 内容零回归。
2. 每个新页面有唯一 h1、带尾斜杠的 canonical、可解析的 JSON-LD。
3. 27 页无孤岛：每页至少被另外 2 个页面链接。
4. `sitemap.xml` 35 条 `<loc>`；`llms.txt` 索引 35 页。
5. 桌面与移动两档视觉验收通过，控制台零错误。
6. 全部技术表述与「产品事实基准」一致，无最高级表述、无竞品点名。
