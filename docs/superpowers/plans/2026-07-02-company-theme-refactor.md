# company 主题重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `themes/journal` 改造为零业务内容的通用企业官网主题 `themes/company`（block 占位模式），业务内容全部下沉 `sites/edaijia/`，导出验证后同步线上。

**Architecture:** 复制 `themes/dossier` 已验证的 block 渲染模式：内容 yaml 声明 `blocks:` 数组 → 通用 `page.njk` 遍历 → `views/blocks/{type}.njk` 结构占位渲染。blog 列表/详情为 collection 专用模板，文案经新增的 collection `locals` 透传注入。

**Tech Stack:** Nunjucks、TypeScript、js-yaml、@matrix/site-kit / cli / blocks（npm workspaces）。

**Spec:** `docs/superpowers/specs/2026-07-02-company-theme-refactor-design.md`

**验证基线:** 重构前先备份当前导出 `cp -r sites/edaijia/out /tmp/edaijia-out-baseline`，最终导出与其逐页对照。仓库无主题测试套件，HTML 对照 + 本地预览即验收标准。

---

### Task 1: 备份基线 + CLI collection locals 透传

**Files:**
- Modify: `packages/cli/src/blog.ts`

- [ ] **Step 1: 备份当前导出为对照基线**

```bash
cp -r sites/edaijia/out /tmp/edaijia-out-baseline
```

- [ ] **Step 2: CollectionConfig 增加 locals 字段**

`packages/cli/src/blog.ts` 中 `list` / `detail` 配置各加一行（58 行、64 行附近）：

```ts
  list: {
    path: string;
    template: string;
    localsKey?: string; // 注入模板的变量名，默认 articles
    locals?: Record<string, unknown>; // 站点自定义模板变量（文案等），生成数据优先
    meta: PageMetaTemplate;
  };
  detail: {
    pathPrefix: string;
    template: string;
    localsKey?: string; // 默认 article
    relatedKey?: string;
    locals?: Record<string, unknown>; // 同上
    titleSuffix?: string;
    meta: PageMetaTemplate;
  };
```

（detail 的既有字段以文件实际内容为准，只新增 `locals`。）

- [ ] **Step 3: 合并 locals（生成数据优先）**

190 行附近，列表页与详情页的 `locals` 组装改为：

```ts
    locals: { ...(cfg.list.locals || {}), [listKey]: articles },
```

```ts
      locals: { ...(cfg.detail.locals || {}), [detailKey]: article, [relatedKey]: related },
```

- [ ] **Step 4: 构建验证 + 提交**

```bash
npm run build:platform
git add packages/cli/src/blog.ts && git commit -m "feat(cli): collection list/detail 支持站点自定义 locals 透传"
```

Expected: tsc 零报错。

---

### Task 2: 主题改名 journal → company

**Files:**
- Rename: `themes/journal/` → `themes/company/`
- Modify: `themes/company/package.json`、`themes/company/theme.ts`、`sites/edaijia/site.yaml:2`、`sites/edaijia/deploy/deploy.sh:17`

- [ ] **Step 1: git mv 目录**

```bash
git mv themes/journal themes/company 2>/dev/null || mv themes/journal themes/company
```

（themes/journal 未全部入库时 git mv 会部分失败，用 mv 兜底，git add 在提交步统一处理。）

- [ ] **Step 2: 包名与描述**

`themes/company/package.json`：`"name": "@matrix/theme-company"`，description 改为「内容矩阵主题：通用企业官网（Company）—— Bento 卡片、多页 block 占位与博客板块。纯表现层，零业务内容；由 sites/<站点> 数据驱动，经 @matrix/cli 渲染。」

- [ ] **Step 3: manifest**

`themes/company/theme.ts`：变量/导出 `journal` → `company`，`id: 'company'`，`name: 'Company'`，头注释改为通用主题描述（不提 e代驾）。

- [ ] **Step 4: 引用更新**

- `sites/edaijia/site.yaml`：`theme: company`；首行注释同步。
- `sites/edaijia/deploy/deploy.sh:17`：`npm run build -w @matrix/theme-company`。

- [ ] **Step 5: 重装 workspace 链接 + 构建验证 + 提交**

```bash
npm install
npm run build -w @matrix/theme-company
git add -A themes/company themes/journal sites/edaijia package-lock.json && git commit -m "refactor(theme): journal 主题改名 company"
```

Expected: 构建成功；`node -e "console.log(require('@matrix/theme-company').default.id)"` 输出 `company`。

---

### Task 3: 删除 order / index-mobile 死代码

**Files:**
- Delete: `themes/company/views/pages/{order,order-status,index-mobile}.njk`、`views/layouts/order-base.njk`、`client/{order,order-status}.ts`、`public/{order,order-status}.js`、`tsconfig.order.json`、`tsconfig.order-status.json`
- Modify: `themes/company/theme.ts`（删 `order`/`orderStatus`/`homeMobile` 三项）、`themes/company/package.json`（`build:client` 只留 `tsc -p tsconfig.client.json`）、`themes/company/theme.css`（删 order 页与 index-mobile 专属段）

- [ ] **Step 1: 删文件**

```bash
cd themes/company && rm views/pages/order.njk views/pages/order-status.njk views/pages/index-mobile.njk views/layouts/order-base.njk client/order.ts client/order-status.ts public/order.js public/order-status.js tsconfig.order.json tsconfig.order-status.json
```

- [ ] **Step 2: manifest 与构建脚本清理**（如上 Files 所述）

- [ ] **Step 3: theme.css 死段清理**

只删注释明确标注 order 页 / index-mobile 变体（2864 行附近「移动端首页变体」段）且选择器仅出现于被删模板的规则块；grep 确认选择器不被其余模板/客户端 JS 引用后才删。拿不准的保留。

- [ ] **Step 4: 构建 + 提交**

```bash
npm run build -w @matrix/theme-company
git add -A themes/company && git commit -m "refactor(theme): 删除 order/index-mobile 死代码"
```

---

### Task 4: 通用 page.njk 模板 + manifest 收敛

**Files:**
- Create: `themes/company/views/pages/page.njk`
- Delete（Task 5-8 内容迁移完成后才删，此处先建新模板）: 无
- Modify: `themes/company/theme.ts`

- [ ] **Step 1: page.njk**

```njk
{% extends "layouts/base.njk" %}
{% block content %}
  <main class="{{ page.bodyClass or 'block-page' }}-main">
    {% for block in page.blocks %}
      {% include "blocks/" + block.type + ".njk" ignore missing %}
    {% endfor %}
  </main>
{% endblock %}
```

注意：首页原模板 content 顶层没有 `<main>` 包裹（hero 等 section 直接平铺）而子页有 `<main class="entry-page">` 等。为保持 CSS 命中，page.njk 不加 main 包裹，改为：

```njk
{% extends "layouts/base.njk" %}
{% block content %}
{% if page.mainClass %}<main class="{{ page.mainClass }}">{% endif %}
{% for block in page.blocks %}{% include "blocks/" + block.type + ".njk" ignore missing %}{% endfor %}
{% if page.mainClass %}</main>{% endif %}
{% endblock %}
```

`mainClass` 经 meta 透传：loadSite 的 PageMeta 不含此字段，改用 content yaml 的 `meta.bodyClass` 已有机制不行——直接方案：block 化后子页第一个 block 前后由 yaml 控制，即在 content yaml 里用 `custom-html` 打开/关闭 main 标签太丑。**采用：page.njk 读 `page.blocks` 外层统一不加 main，把原 `<main class="xxx-page">` 的类挂到 `body`（`meta.bodyClass` 已支持，base.njk 已把 bodyClass 渲染到 body 上），theme.css 中 `.entry-page`、`.serves-page`、`.partner-page`、`.questions-page`、`.blog-page` 等以 main 为根的选择器改为 body 类作用域**（`.entry-page .foo` → `body.entry-page .foo`；纯 `main.xxx` 自身样式移到 `body.xxx main`）。先 grep theme.css 确认这些类的使用方式再改；若某页类无样式引用则直接不迁。同时每页保留一个语义 `<main id="main">` 包裹（无类名），由 page.njk 输出：

```njk
{% extends "layouts/base.njk" %}
{% block content %}
<main id="main">
{% for block in page.blocks %}{% include "blocks/" + block.type + ".njk" ignore missing %}{% endfor %}
</main>
{% endblock %}
```

- [ ] **Step 2: manifest templates 收敛**

```ts
  templates: {
    home: 'pages/page.njk',
    page: 'pages/page.njk',
    notFound: 'pages/page.njk',
    blogList: 'pages/blog-list.njk',
    blogDetail: 'pages/blog-detail.njk',
  },
```

（旧键 questions/partner/entry/serves 删除；content yaml 里对应 `template:` 行改为 `page` 或删除走默认，Task 6-8 处理。）

- [ ] **Step 3: 构建 + 提交**

```bash
npm run build -w @matrix/theme-company
git add -A themes/company && git commit -m "feat(theme): 通用 page.njk block 渲染模板"
```

---

### Task 5: 15 个 block 占位模板

**Files:**
- Create: `themes/company/views/blocks/{hero,page-header,bento-grid,stats,timeline,logo-wall,download-cta,feature-grid,card-grid,steps,notice-list,contact-blocks,faq-list,people-grid,cta-panel}.njk`

制作规则（每个 block 相同）：从原页面模板拷贝对应 section 的完整 HTML 结构（保留全部 class、id、data-reveal、data-track、data-screen-label、loading="lazy" 等属性），把文本节点/图片路径/链接换成 `{{ block.data.* }}`，SVG 图标处换成 `<svg ...>{{ item.icon | safe }}</svg>`（沿用 partner.njk:27 先例）。列表结构用 `{% for %}`。富文本字段（含 `<br>`/`<strong>`/`<a>`）用 `| safe`，命名以 `Html` 后缀标识。

数据源对照（原文件以 git 中 `themes/journal` 重命名前内容为准，行号即原文件行号）：

| block | 结构来源 | data 字段 |
|---|---|---|
| `hero` | index.njk:7-31 | eyebrow, titleHtml, subtitle, links[]{text,href,track?,trackPlatform?}, qr{img,title,subtitle} |
| `page-header` | entry.njk:7-11（recruit-header 结构，headerClass 可配） | headerClass(默认 recruit-header), label, title, descHtml, inner?(partner 用 partner-header__inner 包裹) |
| `bento-grid` | index.njk:34-80 | id, header{label,titleHtml,desc}, cards[]{variant: featured/standard/flat, tag?, title, desc, img{src,alt}, links[]{text,href,external?,track?,trackPlatform?}} |
| `stats` | index.njk:83-108 | id, header{label,titleHtml,desc}, items[]{number?, counter?, founding?, suffix?, label} |
| `timeline` | index.njk:111-185 | id, header{label,titleHtml,desc}, items[]{year, text, accent?} |
| `logo-wall` | index.njk:188-239 | label, items[]{name, mod?, svg} |
| `download-cta` | index.njk:242-282 | id(download), title, desc, qr{img,label}, buttons[]{href,platform,svg,sub,main}, links[]{text,href,external?,track?} |
| `feature-grid` | entry.njk:14-62（recruit-benefits/benefit-grid） | sectionClass(默认 recruit-benefits), title, desc, items[]{icon,title,desc} |
| `card-grid` | serves.njk:14-55（serves-products/serves-product-grid/support-card） | sectionClass, gridClass(serves-product-grid 或 support-grid), title, desc, items[]{icon,title,desc} |
| `steps` | entry.njk:65-88 | title, desc, items[]{title,desc} |
| `notice-list` | entry.njk:91-130（recruit-notice/notice-box） | sectionClass(默认 recruit-notice), title?, boxes[]{icon, title, itemsHtml[]} |
| `contact-blocks` | serves.njk:150-258 | title, desc, blocks[]{title, scope, details[]{label, value, href?, note?, copyType?, external?}}, footnoteHtml |
| `faq-list` | questions.njk faq section | items[]{q, aHtml} |
| `people-grid` | partner.njk managers section（复用 `{% from "partials/card-manager.njk" import managerCard %}`） | title, desc, managers[] |
| `cta-panel` | entry.njk:133-149 + serves.njk:261-271 | sectionClass(recruit-cta/serves-cta), title, desc, qr?{img,alt,hint,steps}, button?{text,href,svg}, phonesHtml |

示例（hero.njk 完整代码，其余 block 按同规则逐一完成）：

```njk
<section class="hero" data-screen-label="Hero">
  <div class="hero__bg"><div class="hero__bg-inner"></div></div>
  <div class="hero__inner">
    <div class="hero__text" data-reveal>
      <p class="hero__eyebrow">{{ block.data.eyebrow }}</p>
      <h1 class="hero__title">{{ block.data.titleHtml | safe }}</h1>
      <p class="hero__subtitle">{{ block.data.subtitle }}</p>
      <div class="hero__links">
        {% for link in block.data.links %}
        <a href="{{ link.href }}" class="link-arrow link-arrow--light"{% if link.track %} data-track="{{ link.track }}"{% endif %}{% if link.trackPlatform %} data-track-platform="{{ link.trackPlatform }}"{% endif %}>{{ link.text }}&nbsp;›</a>
        {% endfor %}
      </div>
      {% if block.data.qr %}
      <div class="hero__qr-badge">
        <img src="{{ basePath }}{{ block.data.qr.img }}" alt="{{ block.data.qr.alt or block.data.qr.title }}" class="hero__qr-img">
        <div class="hero__qr-info">
          <span class="hero__qr-title">{{ block.data.qr.title }}</span>
          <span class="hero__qr-subtitle">{{ block.data.qr.subtitle }}</span>
        </div>
      </div>
      {% endif %}
    </div>
  </div>
</section>
```

首页 trust 区的 `<span id="trustYears">`、timeline 区 `<span id="timelineYears">`、counter 的 `data-target`/`data-founding` 动画属性必须原样保留（client/app.ts 依赖）。

- [ ] **Step 1: 逐个创建 15 个 block 模板**（规则如上）
- [ ] **Step 2: 构建 + 提交**

```bash
npm run build -w @matrix/theme-company
git add -A themes/company && git commit -m "feat(theme): 15 个通用 block 占位模板"
```

---

### Task 6: home.yaml 内容迁移

**Files:**
- Modify: `sites/edaijia/content/home.yaml`

- [ ] **Step 1: 迁移** — 保留现有 meta 与 jsonLd，删除头部「硬编码营销页」注释，`template: home` 保留，追加 `blocks:` 数组：hero、bento-grid（含 header「核心服务」）、stats（trust，header「值得信赖」）、timeline（header「发展历程」+ 8 条目）、logo-wall（5 个伙伴 SVG 字符串）、download-cta。全部文案/属性从原 index.njk 逐字段搬运（含 data-track 值、外链 vip.html、App Store/APK 走 `{{ site.brand.appStoreUrl }}` 的改为 yaml 直接写 URL 或保留 site.brand 引用——block 模板统一从 data 取值，故 yaml 中直接写入 site.yaml brand 里已有的 URL 值）。

- [ ] **Step 2: 导出冒烟**

```bash
npm run build:platform >/dev/null && npm run matrix -- export edaijia
diff <(sed 's/[[:space:]]//g' /tmp/edaijia-out-baseline/index.html) <(sed 's/[[:space:]]//g' sites/edaijia/out/index.html) | head -50
```

Expected: 差异仅限空白、main 包裹结构与死链调整；文本内容零丢失。

- [ ] **Step 3: 提交**

```bash
git add sites/edaijia/content/home.yaml && git commit -m "feat(edaijia): 首页内容下沉 blocks 数据"
```

---

### Task 7: entry.yaml + serves.yaml 内容迁移

**Files:**
- Modify: `sites/edaijia/content/entry.yaml`、`sites/edaijia/content/serves.yaml`

- [ ] **Step 1: entry.yaml** — `template: page`；blocks：page-header（司机招募）、feature-grid（4 优势卡含 SVG）、steps（3 步）、notice-list（报名条件 + 相关协议两盒；协议链接原来引用 `site.brand.*Url`，yaml 中直接写完整 URL）、cta-panel（QR + 双热线）。`meta.bodyClass: subpage entry-page`（追加页面类到 body，配合 Task 4 的 CSS 作用域调整；若 Task 4 结论是 `.entry-page` 无需迁移则保持 `subpage`）。
- [ ] **Step 2: serves.yaml** — `template: page`；blocks：page-header（商务合作）、card-grid（3 产品卡）、feature-grid（4 优势卡）、notice-list（收费明细 + 备注说明，节标题「长途代驾收费标准」经 notice-list 的 title 字段渲染）、contact-blocks（6 个联系块 + 脚注）、cta-panel（电话按钮 + 客服热线）。
- [ ] **Step 3: 导出对照 + 提交**

```bash
npm run matrix -- export edaijia
diff <(sed 's/[[:space:]]//g' /tmp/edaijia-out-baseline/entry/index.html) <(sed 's/[[:space:]]//g' sites/edaijia/out/entry/index.html) | head -30
diff <(sed 's/[[:space:]]//g' /tmp/edaijia-out-baseline/serves/index.html) <(sed 's/[[:space:]]//g' sites/edaijia/out/serves/index.html) | head -30
git add sites/edaijia/content && git commit -m "feat(edaijia): 司机招募/商务合作内容下沉 blocks"
```

---

### Task 8: partner / questions / 404 迁移

**Files:**
- Modify: `sites/edaijia/content/partner.yaml`、`questions.yaml`、`404.yaml`

- [ ] **Step 1: partner.yaml** — `template: page`；blocks：page-header（inner 包裹变体）、card-grid（现 `locals.partner.support` 数据平移为 items）、people-grid（现 `locals.partner.managers` 平移）。迁移后删除 `locals:` 段。
- [ ] **Step 2: questions.yaml** — `template: page`；blocks：page-header（常见问答）、faq-list（现 `locals.faq` 平移为 items，字段 q/aHtml）。删除 `locals:` 段。
- [ ] **Step 3: 404.yaml** — `template:` 走 notFound 默认；blocks：page-header（「404 / 页面未找到 / 返回首页链接」descHtml）。
- [ ] **Step 4: 导出对照 + 提交**（同 Task 7 模式，对照 partner/questions/404 三页）

```bash
git add sites/edaijia/content && git commit -m "feat(edaijia): partner/questions/404 内容下沉 blocks"
```

---

### Task 9: blog 模板去业务化 + site.yaml 收尾

**Files:**
- Modify: `themes/company/views/pages/blog-list.njk`、`blog-detail.njk`、`sites/edaijia/site.yaml`
- Delete: `themes/company/views/pages/{index,index-mobile 已删,entry,serves,partner,questions,404}.njk`（旧页面模板，此时才可删）

- [ ] **Step 1: blog-list.njk** — 页头 label/title/desc 改 `{{ blog.header.* }}`；分类名 `{% if %}` 链改 `{{ blog.clusterLabels[article.cluster] or blog.clusterLabels._default }}`；侧边栏两卡改 `{% for card in blog.sidebarCards %}`（字段 title/desc/btnText/btnHref/primary?）；空态文案 `{{ blog.emptyText }}`。
- [ ] **Step 2: blog-detail.njk** — 面包屑「首页/行业洞察」改 `{{ blog.breadcrumbHome }}` / `{{ blog.header.title }}`；分类名同上；侧边栏推广卡改 `{{ blog.sidebarCard.* }}`（相关推荐标题 `{{ blog.relatedTitle }}`、日期前缀 `{{ blog.dateLabel }}`）。
- [ ] **Step 3: site.yaml** — 导航 order 项 `href: /#download`；collection `list.locals.blog` / `detail.locals.blog` 写入上述全部文案（侧边栏卡片：原「立即叫车 → /order」改为「下载 App → /#download」引导；「申请加盟 → /entry」保留）。首行注释更新（不再提「原 app 无损生成」）。
- [ ] **Step 4: 删除旧页面模板 + 全量导出对照**

```bash
rm themes/company/views/pages/{index,entry,serves,partner,questions,404}.njk
npm run build -w @matrix/theme-company && npm run matrix -- export edaijia
for p in index entry/index serves/index partner/index questions/index blog/index 404; do echo "== $p"; diff <(sed 's/[[:space:]]//g' /tmp/edaijia-out-baseline/$p.html) <(sed 's/[[:space:]]//g' sites/edaijia/out/$p.html) | wc -l; done
```

Expected: 每页差异行数少且全部可解释（死链改锚点、main 结构、侧边栏卡）。抽查 blog 详情页一篇。

- [ ] **Step 5: grep 终检主题零业务内容**

```bash
grep -rn "代驾\|edaijia\|95139\|busae" themes/company --include="*.njk" --include="*.ts" --include="*.css" | grep -v node_modules
```

Expected: 零命中（dist/ 重建后同样零命中）。

- [ ] **Step 6: 提交**

```bash
git add -A themes/company sites/edaijia && git commit -m "refactor(theme): blog 模板去业务化，company 主题零业务内容"
```

---

### Task 10: 预览验证 + 文档更新

**Files:**
- Modify: `README.md:63,66`、`AGENTS.md:37`、`themes/company/README.md`

- [ ] **Step 1: 本地预览** — `matrix dev edaijia` 起服务，逐页（/、/entry、/serves、/partner、/questions、/blog、/blog/任一篇、/404）截图或快照确认视觉与交互（FAQ 手风琴、counter 动画、复制按钮）无回归。
- [ ] **Step 2: 文档** — README 主题表更新（journal → company，「完整应用」描述改为纯数据站点）；AGENTS.md:37 apps/edaijia 行改为 sites/edaijia + themes/company 描述；主题 README 重写为通用主题说明 + block 清单。
- [ ] **Step 3: 提交**

```bash
git add README.md AGENTS.md themes/company/README.md && git commit -m "docs: company 主题重构文档同步"
```

---

### Task 11: 部署上线

- [ ] **Step 1: 执行部署**

```bash
cd sites/edaijia && ./deploy/deploy.sh
```

Expected: 构建 → export → rsync 到 `root@43.156.128.95:/var/www/busae.ai` 成功。

- [ ] **Step 2: 线上验证**

```bash
curl -sI https://busae.ai/ | head -5 && curl -s https://busae.ai/ | grep -c "e代驾"
```

Expected: 200；首页品牌内容正常渲染。
