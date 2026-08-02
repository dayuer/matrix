# voicebridge.top 平台补齐 + 主题化迁移实施计划（阶段 0–1）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `sites/voicebridge.top` 从手写静态 HTML 迁到 matrix 数据驱动链路，新建 `themes/voicebridge` 承载现有苹果风视觉，同时补齐 4 处平台缺口（扁平 `.html` 路径、hreflang sitemap、自定义 robots、llms.txt），做到**现网 8 个 URL 一个不变、视觉零差异**。

**Architecture:** 沿用 `sites/edaijia` 已验证的模式——`site.yaml` + `content/**`（yaml/md）经 `@matrix/cli` 的 `loadSite()` 加载为 `SiteDefinition`，`@matrix/site-kit` 的 `exportSite()` 渲染为静态站。现有 `index.html` 的 `<style>` 整体迁为 `themes/voicebridge/theme.css`（CSS 已用 `:root` 自定义属性，天然是 token），`<body>` 各 section 拆为 `views/blocks/*.njk`，内联 `<script>` 移植为 `client/app.ts`。

**Tech Stack:** TypeScript、Nunjucks、js-yaml、marked、npm workspaces（`@matrix/blocks` → `@matrix/site-kit` → `@matrix/cli`）。

**Spec:** `docs/superpowers/specs/2026-08-02-voicebridge-seo-geo-design.md`

**范围说明：** 本计划只覆盖 spec 的阶段 0–1。阶段 2（27 页内容铺设）与阶段 3（搜索引擎提交）在本计划验收通过后另写计划——内容页的 block 组合依赖本计划实际产出的 block 清单，提前写会写成空话。

**验证基线：** 仓库无测试框架。验收手段有三层：
1. **纯函数**：`node -e` 直接断言 `generateSitemap` / `generateRobots` 的输出。
2. **回归**：改平台代码前后各导出一次 `synon.ai`，用 `scripts/html-text-diff.mjs` 比对，证明不伤其它站点。
3. **视觉**：`matrix dev` 起本地服务，与迁移前基线逐页截图比对。

**⚠️ 工作区注意：** 仓库当前有 arrfunds 相关未提交改动（`sites/arrfunds/*`、`themes/arrfunds/*`、`supabase/`）。**每次提交只 `git add` 本计划明确列出的文件路径，禁止 `git add -A` / `git add .`**。

---

### Task 1: 冻结基线（迁移前的对照物）

**Files:**
- Create: `scripts/html-text-diff.mjs`

- [ ] **Step 1: 备份当前线上产物作为基线**

```bash
cd ~/sproot/matrix
rm -rf /tmp/vb-baseline && mkdir -p /tmp/vb-baseline
cp sites/voicebridge.top/*.html sites/voicebridge.top/*.xml sites/voicebridge.top/*.txt /tmp/vb-baseline/
ls /tmp/vb-baseline
```

预期输出包含 11 个文件：`index.html`、`index_en.html`、`support.html`、`support_en.html`、`privacy.html`、`privacy_en.html`、`terms.html`、`terms_en.html`、`googlebe863ce68fa6a6d4.html`、`sitemap.xml`、`robots.txt`。

- [ ] **Step 2: 写可见文本比对脚本**

创建 `scripts/html-text-diff.mjs`：

```js
#!/usr/bin/env node
/**
 * HTML 可见文本比对 —— 迁移验收工具。
 * 剥掉标签、script/style 与属性，只留可见文本、<title>、<meta description>，
 * 以及 <svg> 内 <text> 节点的文案（首页手机样机 SVG 里有真实产品文案，不能当装饰丢掉）。
 * 构建产物的 ?v= 时间戳与空白差异一律忽略。
 *
 * 判定按「有序序列」比对：段落顺序变化、重复次数变化都算差异——
 * 模板重写最容易踩的坑就是循环少渲染了几次、或栏目顺序被颠倒。
 *
 *   node scripts/html-text-diff.mjs <基线文件> <新文件>
 *   退出码 0 = 文本一致，1 = 有差异（差异打到 stdout），2 = 用法错误或文件读不出来
 */
import fs from 'fs';

const ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#34;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
};

function decodeEntities(s) {
  return s.replace(/&(?:nbsp|amp|lt|gt|quot|apos|mdash|ndash|hellip|#34|#39);/g, (m) => ENTITIES[m] ?? m);
}

/** 取 <meta name="description"> 的 content，与属性顺序、引号风格无关。 */
function metaDescription(raw) {
  for (const tag of raw.match(/<meta\b[^>]*>/gi) || []) {
    if (!/\bname\s*=\s*(['"])description\1/i.test(tag)) continue;
    const m = tag.match(/\bcontent\s*=\s*(['"])([\s\S]*?)\1/i);
    if (m) return m[2].trim();
  }
  return '';
}

/** SVG 只保留 <text> 节点的文案，其余结构丢弃。 */
function svgText(svg) {
  const texts = svg.match(/<text\b[^>]*>([\s\S]*?)<\/text>/gi) || [];
  return '\n' + texts.map((t) => t.replace(/<[^>]+>/g, '')).join('\n') + '\n';
}

function extract(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf-8');
  } catch (err) {
    console.error(`读取失败：${file} —— ${err.message}`);
    process.exit(2);
  }
  const title = (raw.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1].trim();
  const desc = metaDescription(raw);
  const body = (raw.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, raw])[1];
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    // 先剥自闭合 <svg .../>：它没有子节点，剥离无损。若留给下面的非贪婪匹配，
    // 它会与后面某个真实 </svg> 配对，把两者之间的正文整段静默吞掉。
    .replace(/<svg\b[^>]*\/>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, svgText)
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map((s) => decodeEntities(s).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return [`TITLE: ${decodeEntities(title)}`, `DESC: ${decodeEntities(desc)}`, ...text];
}

const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error('用法：node scripts/html-text-diff.mjs <基线文件> <新文件>');
  process.exit(2);
}
const la = extract(a);
const lb = extract(b);

if (la.length === lb.length && la.every((l, i) => l === lb[i])) {
  console.log(`✅ 文本一致：${a} ≡ ${b}（${la.length} 段，顺序与重复次数均一致）`);
  process.exit(0);
}

console.log(`❌ 文本有差异：${a}（${la.length} 段） vs ${b}（${lb.length} 段）`);

const setA = new Set(la);
const setB = new Set(lb);
const onlyA = la.filter((l) => !setB.has(l));
const onlyB = lb.filter((l) => !setA.has(l));
for (const l of onlyA) console.log(`  - 仅基线有: ${l}`);
for (const l of onlyB) console.log(`  + 仅新版有: ${l}`);
if (onlyA.length === 0 && onlyB.length === 0) {
  console.log('  ⚠️ 用词完全相同，差异在顺序或重复次数——模板循环渲染次数或栏目顺序变了。');
}

let firstDiff = -1;
const max = Math.max(la.length, lb.length);
for (let i = 0; i < max; i++) {
  if (la[i] !== lb[i]) {
    firstDiff = i;
    break;
  }
}
if (firstDiff >= 0) {
  console.log(`  首处不一致在第 ${firstDiff + 1} 段：`);
  console.log(`    基线: ${la[firstDiff] ?? '(无)'}`);
  console.log(`    新版: ${lb[firstDiff] ?? '(无)'}`);
}
process.exit(1);
```

**为什么是有序比对而不是集合比对：** 用 `Set` 求差集会放行两类最该拦下的回归——模板循环少渲染了几次（同一段重复 3 次坍缩成 1 次）、栏目顺序被颠倒。两者用词集合完全相同，集合比对判"一致"。同理 `<svg>` 不能整段丢：首页手机样机 SVG 里的 `项目周会`、`发言人 A`、`03:42 · 2 位发言人 · 已完成转写`、`✦ AI 智能纪要` 都是真实产品文案，而 Task 12 恰好要搬运这段 SVG。

- [ ] **Step 3: 自测脚本（同一文件比自己必须通过）**

```bash
cd ~/sproot/matrix
node scripts/html-text-diff.mjs /tmp/vb-baseline/index.html /tmp/vb-baseline/index.html; echo "退出码=$?"
```

预期：`✅ 文本一致：…（N 段，顺序与重复次数均一致）`，`退出码=0`。

- [ ] **Step 4: 四组回归自测（每组都必须按预期退出）**

```bash
cd ~/sproot/matrix
# 4a 不同文件必须报差异
node scripts/html-text-diff.mjs /tmp/vb-baseline/index.html /tmp/vb-baseline/index_en.html >/dev/null; echo "4a 退出码=$?（应为 1）"

# 4b 顺序与重复次数变化必须被抓到：造两个小用例
printf '<html><body><p>A</p><p>提示</p><p>B</p><p>提示</p><p>C</p><p>提示</p></body></html>' > /tmp/vb-t-a.html
printf '<html><body><p>提示</p><p>C</p><p>B</p><p>A</p></body></html>' > /tmp/vb-t-b.html
node scripts/html-text-diff.mjs /tmp/vb-t-a.html /tmp/vb-t-b.html >/dev/null; echo "4b 退出码=$?（应为 1）"

# 4c SVG 内文案改动必须被抓到
sed 's/项目周会/产品评审/' /tmp/vb-baseline/index.html > /tmp/vb-t-svg.html
node scripts/html-text-diff.mjs /tmp/vb-baseline/index.html /tmp/vb-t-svg.html >/dev/null; echo "4c 退出码=$?（应为 1）"

# 4d 文件读不出来必须是 2，不能与「有差异」撞码
node scripts/html-text-diff.mjs /nonexistent/a.html /nonexistent/b.html >/dev/null 2>&1; echo "4d 退出码=$?（应为 2）"
```

预期：`4a 退出码=1`、`4b 退出码=1`、`4c 退出码=1`、`4d 退出码=2`。4b 的完整输出里还应出现 `⚠️ 用词完全相同，差异在顺序或重复次数` 这行。

- [ ] **Step 5: 建立 synon.ai 回归基线**

```bash
cd ~/sproot/matrix
npm run build:platform
npm run build -w @matrix/theme-dossier
npm run matrix -- export synon.ai
rm -rf /tmp/synon-baseline && cp -r sites/synon.ai/out /tmp/synon-baseline
ls /tmp/synon-baseline
```

预期：出现 `index.html`、`sitemap.xml`、`robots.txt` 等产物。若 `npm run build -w @matrix/theme-dossier` 报「Missing script」，改跑 `npm run build --workspaces --if-present`。

- [ ] **Step 6: 提交脚本**

```bash
cd ~/sproot/matrix
git add scripts/html-text-diff.mjs
git commit -m "chore(scripts): 新增 HTML 可见文本比对工具，用于迁移验收"
```

---

### Task 2: F1 — export 支持扁平 `.html` 路径

现有 `exportSite()` 对任何非 `/` 的 `path` 一律建目录写 `index.html`，会把 `/privacy.html` 变成 `/privacy.html/index.html`。

**Files:**
- Modify: `packages/site-kit/src/export.ts:52-60`

- [ ] **Step 1: 改写页面输出分支**

`packages/site-kit/src/export.ts` 中 `// 1. 页面` 循环体（约 51–60 行），把原来的 `if (p.path === '/') { ... } else { ... }` 整体替换为：

```ts
    if (p.path === '/') {
      fs.writeFileSync(path.join(OUT, 'index.html'), html);
      console.log('  ✅ / → out/index.html');
    } else if (/\.html?$/i.test(p.path)) {
      // 扁平 .html 路径：保留历史已收录 URL，不转目录式
      const file = path.join(OUT, p.path.replace(/^\//, ''));
      ensureDir(path.dirname(file));
      fs.writeFileSync(file, html);
      console.log(`  ✅ ${p.path} → out${p.path}`);
    } else {
      const dir = path.join(OUT, p.path.replace(/^\//, ''));
      ensureDir(dir);
      fs.writeFileSync(path.join(dir, 'index.html'), html);
      console.log(`  ✅ ${p.path} → out${p.path}/index.html`);
    }
```

- [ ] **Step 2: 构建**

```bash
cd ~/sproot/matrix && npm run build -w @matrix/site-kit
```

预期：无 TS 报错。

- [ ] **Step 3: 回归验证 synon.ai 未受影响**

```bash
cd ~/sproot/matrix
npm run build:platform && npm run matrix -- export synon.ai
for f in $(cd /tmp/synon-baseline && find . -name '*.html'); do
  node scripts/html-text-diff.mjs "/tmp/synon-baseline/$f" "sites/synon.ai/out/$f" >/dev/null || echo "DIFF: $f"
done; echo "回归比对结束"
```

预期：只打印「回归比对结束」，没有任何 `DIFF:` 行。

- [ ] **Step 4: 提交**

```bash
cd ~/sproot/matrix
git add packages/site-kit/src/export.ts
git commit -m "feat(site-kit): 页面 path 以 .html 结尾时直出文件，支持保留历史扁平 URL"
```

---

### Task 3: F2 — PageMeta 增加 alternates / updated，sitemap 产出 hreflang 与逐页 lastmod

**Files:**
- Modify: `packages/site-kit/src/types.ts`（`FooterLegal` / `Brand` / `BaseSiteConfig` / `PageMeta`）
- Modify: `packages/site-kit/src/sitemap.ts:1-25`
- Modify: `packages/cli/src/load.ts:78-105`（`buildMeta`）
- Modify: `packages/cli/src/blog.ts:160-183`（`meta`）

- [ ] **Step 1: 扩展类型**

`packages/site-kit/src/types.ts`，在 `FooterLegal` 接口中追加一行：

```ts
export interface FooterLegal {
  contact: string;
  icp?: { text: string; href: string };
  company: { text: string; href: string };
  foundingYear: number;
  /** 页脚长段免责/说明文案（可选）。 */
  note?: string;
}
```

`Brand` 接口追加中文副名（VoiceBridge 主题的品牌字用 `VoiceBridge<span>畅译</span>` 双段结构）：

```ts
export interface Brand {
  name: string;
  /** 品牌中文副名，渲染为品牌字后缀（可选）。 */
  nameCn?: string;
  logo?: string;
  desc: string;
  favicon: string;
}
```

`BaseSiteConfig` 追加站点语言与语言切换入口（`lang` 此前已被 silkline.id 在 site.yaml 里事实使用，此处补上类型）：

```ts
export interface BaseSiteConfig {
  baseUrl: string;
  /** 站点默认语言，注入 <html lang>。页面可用 meta.lang 覆盖。 */
  lang?: string;
  /** 导航右侧的语言切换入口（可选）。 */
  langSwitch?: { text: string; href: string };
  brand: Brand;
  nav: NavItem[];
  cta: { text: string; href: string };
  footer: {
    columns: FooterColumn[];
    legal: FooterLegal;
    social: SocialLink[];
  };
}
```

在 `PageMeta` 接口中，`blocks?: BlockInstance[];` 之前追加：

```ts
  /** 本页的多语言对照版本，用于 sitemap 与 <link rel="alternate"> 的 hreflang。 */
  alternates?: Array<{ hreflang: string; href: string }>;
  /** 本页最后实质更新日期（YYYY-MM-DD）。缺省时 sitemap 用导出当天。 */
  updated?: string;
```

- [ ] **Step 2: 重写 sitemap 生成**

把 `packages/site-kit/src/sitemap.ts` 的 `generateSitemap` 整个函数替换为：

```ts
/** 从页面清单生成 sitemap.xml。逐页 lastmod 与 hreflang alternates 均可选。 */
export function generateSitemap(baseUrl: string, pages: PageDef[]): string {
  const base = baseUrl.replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10);
  const hasAlternates = pages.some((p) => (p.page.alternates || []).length > 0);

  const urls = pages
    .map((p) => {
      const loc = `${base}${p.page.canonical}`;
      const priority = (p.page.priority ?? (p.path === '/' ? 1.0 : 0.7)).toFixed(1);
      const changefreq = p.page.changefreq ?? 'monthly';
      const lastmod = p.page.updated ?? today;
      const lines = [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
      ];
      for (const alt of p.page.alternates || []) {
        lines.push(`    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${base}${alt.href}"/>`);
      }
      lines.push('  </url>');
      return lines.join('\n');
    })
    .join('\n');

  const ns = hasAlternates
    ? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
    : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

  return `<?xml version="1.0" encoding="UTF-8"?>\n${ns}\n${urls}\n</urlset>\n`;
}
```

- [ ] **Step 3: loader 透传新字段**

`packages/cli/src/load.ts` 的 `buildMeta()` 返回对象中，在 `blocks: m.blocks,` 之前插入两行：

```ts
    alternates: m.alternates,
    updated: m.updated,
```

同文件 `packages/cli/src/blog.ts` 的 `meta()` 返回对象中，同样在 `blocks: ...` 之前插入：

```ts
    alternates: m.alternates,
    updated: m.updated,
```

- [ ] **Step 4: 构建**

```bash
cd ~/sproot/matrix && npm run build:platform
```

预期：无 TS 报错。

- [ ] **Step 5: 断言纯函数行为**

```bash
cd ~/sproot/matrix && node -e '
const { generateSitemap } = require("./packages/site-kit/dist/sitemap.js");
const mk = (path, canonical, extra = {}) => ({ path, template: "page", page: { title: "t", description: "d", canonical, ogImage: "/o.png", activeNav: null, bodyClass: null, ...extra } });
const out = generateSitemap("https://voicebridge.top", [
  mk("/", "/", { updated: "2026-08-02", alternates: [{ hreflang: "zh-Hans", href: "/" }, { hreflang: "en", href: "/index_en.html" }] }),
  mk("/faq/", "/faq/"),
]);
const assert = require("assert");
assert.ok(out.includes("xmlns:xhtml"), "缺 xhtml 命名空间");
assert.ok(out.includes("<lastmod>2026-08-02</lastmod>"), "未使用逐页 updated");
assert.ok(out.includes(`hreflang="en" href="https://voicebridge.top/index_en.html"`), "缺 hreflang alternate");
assert.ok(out.includes("<priority>1.0</priority>"), "首页优先级错");
console.log("✅ generateSitemap 断言全部通过");
'
```

预期输出：`✅ generateSitemap 断言全部通过`。

- [ ] **Step 6: 回归验证**

```bash
cd ~/sproot/matrix
npm run matrix -- export synon.ai
for f in $(cd /tmp/synon-baseline && find . -name '*.html'); do
  node scripts/html-text-diff.mjs "/tmp/synon-baseline/$f" "sites/synon.ai/out/$f" >/dev/null || echo "DIFF: $f"
done
diff /tmp/synon-baseline/sitemap.xml sites/synon.ai/out/sitemap.xml && echo "sitemap 无变化"
```

预期：无 `DIFF:` 行，且打印「sitemap 无变化」（synon.ai 未声明 alternates/updated，输出应与旧版逐字节一致）。

- [ ] **Step 7: 提交**

```bash
cd ~/sproot/matrix
git add packages/site-kit/src/types.ts packages/site-kit/src/sitemap.ts packages/cli/src/load.ts packages/cli/src/blog.ts
git commit -m "feat(site-kit): sitemap 支持 hreflang alternates 与逐页 lastmod"
```

---

### Task 4: F3 — robots.txt 支持站点自定义规则

**Files:**
- Modify: `packages/site-kit/src/sitemap.ts`（`generateRobots`）
- Modify: `packages/site-kit/src/types.ts`（`SiteDefinition`）
- Modify: `packages/site-kit/src/export.ts`（调用处）
- Modify: `packages/cli/src/load.ts`（`SiteYaml` + 透传）

- [ ] **Step 1: 改 generateRobots 签名**

`packages/site-kit/src/sitemap.ts` 末尾的 `generateRobots` 替换为：

```ts
/**
 * 生成 robots.txt。默认放行全部 UA 并声明 sitemap；
 * 站点可用 site.yaml 的 robots 字段追加自定义规则行（如逐个 AI 爬虫的放行段）。
 */
export function generateRobots(baseUrl: string, extraRules: string[] = []): string {
  const base = baseUrl.replace(/\/$/, '');
  const lines = ['User-agent: *', 'Allow: /'];
  if (extraRules.length > 0) lines.push('', ...extraRules);
  lines.push('', `Sitemap: ${base}/sitemap.xml`, '');
  return lines.join('\n');
}
```

- [ ] **Step 2: SiteDefinition 增加字段**

`packages/site-kit/src/types.ts` 的 `SiteDefinition` 接口末尾（`cssAliases?: string[];` 之后）追加：

```ts
  /** 追加到 robots.txt 的自定义规则行（站点 site.yaml 的 robots 字段）。 */
  robots?: string[];
```

- [ ] **Step 3: 导出时传入**

`packages/site-kit/src/export.ts` 顶部解构补 `robots = []`：

```ts
  const { root, site, pages, notFound, extraAssets = [], cssAliases = [], theme, themeOptions, robots = [] } = def;
```

并把 `// 3. sitemap + robots` 段的 robots 写入改为：

```ts
  fs.writeFileSync(path.join(OUT, 'robots.txt'), generateRobots(site.baseUrl, robots));
```

- [ ] **Step 3b: 输出路径冲突守卫**（来自 Task 2 质量评审）

同在 `packages/site-kit/src/export.ts`，在 `// 1. 页面` 循环**之前**插入：

```ts
  // 输出路径守卫：扁平 .html 与目录式两种形态共存后，两类冲突会静默产出错误的站点结构。
  // 其一，两个页面写到同一个文件（后者覆盖前者，页面凭空消失）。
  // 其二，/foo 与 /foo.html 并存：nginx 的 try_files $uri $uri/ 会让两个 URL 都返回
  // 不同内容，是搜索引擎眼里的重复内容——而这次迁移的全部目的就是 SEO。
  const outputPaths = new Map<string, string>();
  const urlStems = new Map<string, string>();
  for (const p of pages) {
    const rel =
      p.path === '/'
        ? 'index.html'
        : /\.html?$/i.test(p.path)
          ? p.path.replace(/^\//, '')
          : `${p.path.replace(/^\//, '')}/index.html`;
    const clash = outputPaths.get(rel);
    if (clash) throw new Error(`[site-kit] 输出文件冲突：页面 ${clash} 与 ${p.path} 都会写入 out/${rel}`);
    outputPaths.set(rel, p.path);

    const stem = p.path.replace(/\.html?$/i, '').replace(/\/$/, '') || '/';
    const stemClash = urlStems.get(stem);
    if (stemClash) {
      console.warn(`  ⚠️  重复内容风险：页面 ${stemClash} 与 ${p.path} 会在同一 URL 前缀下都可访问，请只保留一个。`);
    }
    urlStems.set(stem, p.path);
  }
```

文件冲突直接 `throw`（这一定是错的），URL 前缀冲突只 `console.warn`（个别站点可能有意为之）。

- [ ] **Step 3c: 断言守卫生效**

```bash
cd ~/sproot/matrix && npm run build -w @matrix/site-kit && node -e '
const { exportSite } = require("./packages/site-kit/dist/export.js");
const assert = require("assert");
const mk = (p) => ({ path: p, template: "page", page: { title: "t", description: "d", canonical: p, ogImage: "/o.png", activeNav: null, bodyClass: null } });
const base = { root: "/tmp/vb-guard-test", site: { baseUrl: "https://x.test", brand: { name: "x", desc: "d", favicon: "/f.svg" }, nav: [], cta: { text: "", href: "" }, footer: {} }, notFound: mk("/404") };
require("fs").mkdirSync("/tmp/vb-guard-test", { recursive: true });
assert.throws(
  () => exportSite({ ...base, pages: [mk("/a.html"), mk("/a.html")] }),
  /输出文件冲突/,
  "同名扁平页面未被拦下"
);
console.log("✅ 输出文件冲突守卫生效");
' ; rm -rf /tmp/vb-guard-test
```

预期：`✅ 输出文件冲突守卫生效`。

- [ ] **Step 4: loader 透传**

`packages/cli/src/load.ts` 的 `SiteYaml` 接口追加：

```ts
  /** 追加到 robots.txt 的自定义规则行。 */
  robots?: string[];
```

`loadSite()` 的解构补 `robots`：

```ts
  const {
    theme: themeId,
    themeOptions,
    extraAssets,
    cssAliases,
    defaults = {},
    collections = [],
    robots,
    ...site
  } = raw;
```

返回对象追加一行（在 `cssAliases,` 之后）：

```ts
    robots,
```

- [ ] **Step 5: 构建并断言**

```bash
cd ~/sproot/matrix && npm run build:platform && node -e '
const { generateRobots } = require("./packages/site-kit/dist/sitemap.js");
const assert = require("assert");
const plain = generateRobots("https://voicebridge.top/");
assert.strictEqual(plain, "User-agent: *\nAllow: /\n\nSitemap: https://voicebridge.top/sitemap.xml\n", "无参输出与旧版不一致");
const custom = generateRobots("https://voicebridge.top", ["User-agent: GPTBot", "Allow: /"]);
assert.ok(custom.includes("User-agent: GPTBot"), "自定义规则未写入");
assert.ok(custom.trim().endsWith("Sitemap: https://voicebridge.top/sitemap.xml"), "Sitemap 行位置错");
console.log("✅ generateRobots 断言全部通过");
'
```

预期输出：`✅ generateRobots 断言全部通过`。第一条断言同时证明未声明 `robots` 的老站点输出逐字节不变。

- [ ] **Step 6: 提交**

```bash
cd ~/sproot/matrix
git add packages/site-kit/src/sitemap.ts packages/site-kit/src/types.ts packages/site-kit/src/export.ts packages/cli/src/load.ts
git commit -m "feat(site-kit): robots.txt 支持站点自定义规则行"
```

---

### Task 5: F4 — 导出时生成 llms.txt / llms-full.txt

**Files:**
- Create: `packages/cli/src/llms.ts`
- Modify: `packages/cli/src/cli.ts`（`export` 分支）
- Modify: `packages/cli/src/index.ts`

- [ ] **Step 1: 写生成器**

创建 `packages/cli/src/llms.ts`：

```ts
/**
 * llms.txt 生成器 —— GEO（生成引擎优化）基建。
 * llms.txt      站点索引：一句话定义 + 每页标题/描述/URL，供 AI 引擎快速建立全站认知。
 * llms-full.txt 全站正文纯文本，供需要完整语料的抓取方一次取全。
 * 站点在 site.yaml 里声明 llms: { enabled: true, summary: '…' } 才生成。
 */
import fs from 'fs';
import path from 'path';
import type { SiteDefinition } from '@matrix/site-kit';

export interface LlmsConfig {
  enabled?: boolean;
  /** 产品/站点的一句话定义，放在文件最前面。 */
  summary?: string;
}

/** 把 block 里的 HTML 粗剥为纯文本（只用于 llms-full.txt，不参与页面渲染）。 */
function blocksToText(page: SiteDefinition['pages'][number]): string {
  const parts: string[] = [];
  for (const block of page.page.blocks || []) {
    const data = block.data as Record<string, unknown>;
    for (const value of Object.values(data)) {
      if (typeof value !== 'string') continue;
      const text = value
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) parts.push(text);
    }
  }
  return parts.join('\n');
}

export function generateLlmsTxt(def: SiteDefinition, cfg: LlmsConfig): string {
  const base = def.site.baseUrl.replace(/\/$/, '');
  const lines = [`# ${def.site.brand.name}`, ''];
  if (cfg.summary) lines.push(`> ${cfg.summary}`, '');
  lines.push('## 页面', '');
  for (const p of [...def.pages].sort((a, b) => a.page.canonical.localeCompare(b.page.canonical))) {
    lines.push(`- [${p.page.title}](${base}${p.page.canonical}): ${p.page.description}`);
  }
  lines.push('');
  return lines.join('\n');
}

export function generateLlmsFullTxt(def: SiteDefinition, cfg: LlmsConfig): string {
  const base = def.site.baseUrl.replace(/\/$/, '');
  const chunks = [`# ${def.site.brand.name}`, ''];
  if (cfg.summary) chunks.push(cfg.summary, '');
  for (const p of [...def.pages].sort((a, b) => a.page.canonical.localeCompare(b.page.canonical))) {
    chunks.push(`## ${p.page.title}`, `URL: ${base}${p.page.canonical}`, p.page.description, blocksToText(p), '');
  }
  return chunks.join('\n');
}

/** 若站点开启，把两个文件写进 out/。 */
export function writeLlmsFiles(def: SiteDefinition, cfg: LlmsConfig | undefined): void {
  if (!cfg?.enabled) return;
  const out = path.join(def.root, 'out');
  fs.writeFileSync(path.join(out, 'llms.txt'), generateLlmsTxt(def, cfg));
  fs.writeFileSync(path.join(out, 'llms-full.txt'), generateLlmsFullTxt(def, cfg));
  console.log('  ✅ llms.txt + llms-full.txt');
}
```

- [ ] **Step 2: loader 透传 llms 配置**

`packages/cli/src/load.ts` 的 `SiteYaml` 接口追加（需 `import type { LlmsConfig } from './llms';`）：

```ts
  /** GEO：llms.txt / llms-full.txt 生成配置。 */
  llms?: LlmsConfig;
```

`loadSite()` 解构补 `llms`，返回对象追加 `llms,`。因 `SiteDefinition` 无此字段，改为在 `packages/site-kit/src/types.ts` 的 `SiteDefinition` 追加：

```ts
  /** GEO：llms.txt 生成配置（由 @matrix/cli 消费，site-kit 不使用）。 */
  llms?: { enabled?: boolean; summary?: string };
```

- [ ] **Step 3: cli export 分支调用**

`packages/cli/src/cli.ts` 顶部 import 追加：

```ts
import { writeLlmsFiles } from './llms';
```

`case 'export'` 的循环体替换为：

```ts
    for (const name of targets) {
      const def = loadSite(siteDir(name));
      exportSite(def);
      writeLlmsFiles(def, def.llms);
    }
```

- [ ] **Step 4: 对外导出**

`packages/cli/src/index.ts` 追加：

```ts
export { generateLlmsTxt, generateLlmsFullTxt, writeLlmsFiles } from './llms';
export type { LlmsConfig } from './llms';
```

- [ ] **Step 5: 构建并回归**

```bash
cd ~/sproot/matrix && npm run build:platform && npm run matrix -- export synon.ai && ls sites/synon.ai/out | grep llms; echo "退出码=$?"
```

预期：`grep` 无输出、`退出码=1`——synon.ai 未开启 llms，不应生成文件。

- [ ] **Step 6: 提交**

```bash
cd ~/sproot/matrix
git add packages/cli/src/llms.ts packages/cli/src/cli.ts packages/cli/src/index.ts packages/cli/src/load.ts packages/site-kit/src/types.ts
git commit -m "feat(cli): 导出时按站点配置生成 llms.txt / llms-full.txt"
```

---

### Task 6: 新建 `themes/voicebridge` 包骨架

**Files:**
- Create: `themes/voicebridge/package.json`
- Create: `themes/voicebridge/tsconfig.json`
- Create: `themes/voicebridge/tsconfig.client.json`
- Create: `themes/voicebridge/theme.ts`

- [ ] **Step 1: package.json**

```json
{
  "name": "@matrix/theme-voicebridge",
  "version": "1.0.0",
  "private": true,
  "description": "内容矩阵主题：VoiceBridge 畅译官网（苹果发布会风）—— 大标题 hero、bento 卡片网格、GEO answer-card。纯表现层，零业务内容。",
  "main": "dist/theme.js",
  "types": "dist/theme.d.ts",
  "exports": { ".": { "types": "./dist/theme.d.ts", "default": "./dist/theme.js" } },
  "scripts": {
    "build:manifest": "tsc -p tsconfig.json",
    "build:client": "tsc -p tsconfig.client.json",
    "build": "npm run build:manifest && npm run build:client"
  },
  "engines": { "node": ">=20" },
  "dependencies": { "@matrix/site-kit": "1.0.0" },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "rootDir": ".",
    "outDir": "dist",
    "declaration": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["theme.ts"]
}
```

- [ ] **Step 3: tsconfig.client.json**

```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "None",
    "lib": ["DOM", "DOM.Iterable", "ES2018"],
    "outFile": "public/app.js",
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": []
  },
  "include": ["client/app.ts"]
}
```

- [ ] **Step 4: theme.ts**

```ts
import path from 'path';
import type { ThemeManifest } from '@matrix/site-kit';

/**
 * VoiceBridge 畅译官网主题。纯表现层：页面结构由 views/blocks/ 的 block 模板组成，
 * 全部文案与数据来自 sites/voicebridge.top（site.yaml + content/**），经 @matrix/cli 加载。
 * token 默认值取自原手写 index.html 的 :root 自定义属性，站点可经 themeOptions.tokens 覆盖。
 */
const voicebridge: ThemeManifest = {
  id: 'voicebridge',
  name: 'VoiceBridge',
  dir: path.resolve(__dirname, '..'),
  layout: 'layouts/base.njk',
  templates: {
    home: 'pages/page.njk',
    page: 'pages/page.njk',
    article: 'pages/article.njk',
    notFound: 'pages/page.njk',
  },
  css: 'theme.css',
  clientJs: 'public/app.js',
  tokens: {
    '--bg': '#fbfbfd',
    '--surface': '#ffffff',
    '--surface-2': '#f5f5f7',
    '--ink': '#1d1d1f',
    '--ink-2': '#6e6e73',
    '--ink-3': '#86868b',
    '--accent': '#6c5ce7',
    '--accent-ink': '#5847c8',
    '--border': 'rgba(0,0,0,0.08)',
    '--border-2': 'rgba(0,0,0,0.06)',
    '--nav-h': '52px',
    '--r-sm': '10px',
    '--r-md': '18px',
    '--r-lg': '28px',
    '--shadow-card': '0 4px 20px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04)',
    '--shadow-float': '0 24px 60px rgba(28,28,30,0.14), 0 4px 12px rgba(28,28,30,0.06)',
  },
};

export { voicebridge };
export default voicebridge;
```

- [ ] **Step 5: 注册 workspace 并构建**

```bash
cd ~/sproot/matrix && npm install && npm run build -w @matrix/theme-voicebridge
```

预期：`npm install` 在 `node_modules/@matrix/theme-voicebridge` 建立软链；`build:manifest` 通过；`build:client` 报找不到 `client/app.ts`（Task 9 补），此时可先只跑 `npm run build:manifest -w @matrix/theme-voicebridge` 验证 manifest 编译。

- [ ] **Step 6: 提交**

```bash
cd ~/sproot/matrix
git add themes/voicebridge/package.json themes/voicebridge/tsconfig.json themes/voicebridge/tsconfig.client.json themes/voicebridge/theme.ts package-lock.json
git commit -m "feat(theme): 新建 voicebridge 主题包骨架与 token 清单"
```

---

### Task 7: 迁移 theme.css

**Files:**
- Create: `themes/voicebridge/theme.css`

- [ ] **Step 1: 抽出原样式**

```bash
cd ~/sproot/matrix
sed -n '96,341p' sites/voicebridge.top/index.html > themes/voicebridge/theme.css
head -3 themes/voicebridge/theme.css && wc -l themes/voicebridge/theme.css
```

预期：246 行，首行是 `  :root {`。

- [ ] **Step 2: 删掉 :root 块（token 已移入 theme.ts，由平台注入）**

抽出的文件前 18 行正是 `:root { … }` 块（`--bg` 到 `--shadow-float` 共 16 个 token + 起止两行），删掉：

```bash
cd ~/sproot/matrix
sed -i '' '1,18d' themes/voicebridge/theme.css
head -1 themes/voicebridge/theme.css && wc -l themes/voicebridge/theme.css
```

预期：首行为 `* { margin: 0; padding: 0; box-sizing: border-box; }`，剩 228 行。若首行不是它，说明 `:root` 块行数与预期不符——手工删到该行为止，别硬套行号。

理由：`buildTokensCss()` 会把主题 tokens 与站点覆盖合并后注入 `<style id="theme-tokens">`，CSS 文件里再留一份 `:root` 会让 `themeOptions.tokens` 覆盖失效（同优先级下后出现的 `theme.css` 会赢）。

- [ ] **Step 3: 验证 token 引用完整**

```bash
cd ~/sproot/matrix
grep -o 'var(--[a-z0-9-]*)' themes/voicebridge/theme.css | sed 's/var(//;s/)//' | sort -u > /tmp/vb-used-tokens.txt
grep -o "'--[a-z0-9-]*'" themes/voicebridge/theme.ts | tr -d "'" | sort -u > /tmp/vb-declared-tokens.txt
comm -23 /tmp/vb-used-tokens.txt /tmp/vb-declared-tokens.txt
```

预期：`comm` 无输出——CSS 里用到的每个 token 都在 `theme.ts` 里有默认值。若有输出，把缺的 token 补进 `theme.ts` 的 `tokens`。

- [ ] **Step 4: 提交**

```bash
cd ~/sproot/matrix
git add themes/voicebridge/theme.css
git commit -m "feat(theme): voicebridge 样式表从手写 index.html 迁入，:root 提为主题 token"
```

---

### Task 8: 布局与 partials（head / nav / footer）

**Files:**
- Create: `themes/voicebridge/views/layouts/base.njk`
- Create: `themes/voicebridge/views/partials/head.njk`
- Create: `themes/voicebridge/views/partials/nav.njk`
- Create: `themes/voicebridge/views/partials/footer.njk`
- Create: `themes/voicebridge/views/pages/page.njk`
- Create: `themes/voicebridge/views/pages/article.njk`

- [ ] **Step 1: base.njk**

```njk
<!DOCTYPE html>
<html lang="{{ page.lang or site.lang or 'zh-Hans' }}">
<head>
  {% include "partials/head.njk" %}
</head>
<body{% if page.bodyClass %} class="{{ page.bodyClass }}"{% endif %}>
  {% include "partials/nav.njk" %}
  {% block content %}{% endblock %}
  {% include "partials/footer.njk" %}
  <script src="{{ basePath }}/app.js?v={{ assetVersion }}"></script>
</body>
</html>
```

- [ ] **Step 2: head.njk（含 hreflang，og:locale 随页面语言切换）**

```njk
{# <head> 元数据：全部由 page + site 驱动。语言相关标签随 page.lang 切换，
   hreflang 由 page.alternates 生成（与 sitemap 同一份数据源）。 #}
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>{{ page.title }}</title>
<meta name="description" content="{{ page.description }}">
{% if page.keywords %}<meta name="keywords" content="{{ page.keywords }}">{% endif %}
<meta name="author" content="{{ site.brand.name }}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#fbfbfd">
<link rel="canonical" href="{{ site.baseUrl }}{{ page.canonical }}">
{% for alt in page.alternates %}<link rel="alternate" hreflang="{{ alt.hreflang }}" href="{{ site.baseUrl }}{{ alt.href }}">
{% endfor %}
<link rel="icon" href="{{ site.brand.favicon }}" type="image/svg+xml">
<link rel="apple-touch-icon" href="{{ basePath }}/apple-touch-icon.png">

{# Open Graph #}
<meta property="og:type" content="website">
<meta property="og:site_name" content="{{ site.brand.name }}">
<meta property="og:title" content="{{ page.ogTitle or page.title }}">
<meta property="og:description" content="{{ page.ogDescription or page.description }}">
<meta property="og:url" content="{{ site.baseUrl }}{{ page.canonical }}">
<meta property="og:image" content="{{ site.baseUrl }}{{ page.ogImage }}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="{% if (page.lang or site.lang or 'zh-Hans').startswith('en') %}en_US{% else %}zh_CN{% endif %}">

{# Twitter #}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ page.ogTitle or page.title }}">
<meta name="twitter:description" content="{{ page.ogDescription or page.description }}">
<meta name="twitter:image" content="{{ site.baseUrl }}{{ page.ogImage }}">

{% if themeTokensCss %}<style id="theme-tokens">{{ themeTokensCss | safe }}</style>{% endif %}
<link rel="stylesheet" href="{{ basePath }}/theme.css?v={{ assetVersion }}">
{% if page.jsonLd %}
<script type="application/ld+json">{{ page.jsonLd | dump | safe }}</script>
{% endif %}
```

- [ ] **Step 3: nav.njk**

```njk
<nav class="nav" id="nav">
  <a class="brand" href="{{ basePath }}/">{{ site.brand.name }}{% if site.brand.nameCn %}<span class="cn">{{ site.brand.nameCn }}</span>{% endif %}</a>
  <div class="links">
    {% for item in site.nav %}<a href="{{ item.href }}">{{ item.text }}</a>{% endfor %}
  </div>
  {% if site.langSwitch %}<a class="lang" href="{{ site.langSwitch.href }}">{{ site.langSwitch.text }}</a>{% endif %}
  <a class="cta" href="{{ site.cta.href }}">{{ site.cta.text }}</a>
</nav>
```

- [ ] **Step 4: footer.njk**

```njk
<footer>
  <div class="foot-wrap">
    <div class="foot-top">
      <div class="foot-brand">{{ site.brand.name }}{% if site.brand.nameCn %}<span class="cn">{{ site.brand.nameCn }}</span>{% endif %}</div>
      <div class="foot-links">
        {% for col in site.footer.columns %}{% for link in col.links %}<a href="{{ link.href }}">{{ link.text }}</a>{% endfor %}{% endfor %}
      </div>
    </div>
    <div class="foot-legal">
      {% if site.footer.legal.note %}{{ site.footer.legal.note }}<br>{% endif %}
      © {{ site.footer.legal.foundingYear }} {{ site.footer.legal.company.text }}. All rights reserved.
    </div>
  </div>
</footer>
```

- [ ] **Step 5: pages/page.njk**

```njk
{# 通用 block 页面：page.blocks 按序渲染，结构由 views/blocks/{type}.njk 决定。 #}
{% extends "layouts/base.njk" %}
{% block content %}
<main id="main">
  {% for block in page.blocks %}{% include "blocks/" + block.type + ".njk" ignore missing %}{% endfor %}
</main>
{% endblock %}
```

- [ ] **Step 6: pages/article.njk**

```njk
{# 长文页（教程/知识）：正文走窄栏排版，其余与 page.njk 一致。 #}
{% extends "layouts/base.njk" %}
{% block content %}
<main id="main" class="article">
  {% for block in page.blocks %}{% include "blocks/" + block.type + ".njk" ignore missing %}{% endfor %}
</main>
{% endblock %}
```

- [ ] **Step 7: 提交**

```bash
cd ~/sproot/matrix
git add themes/voicebridge/views/layouts themes/voicebridge/views/partials themes/voicebridge/views/pages
git commit -m "feat(theme): voicebridge 布局、head（含 hreflang）与 nav/footer partials"
```

---

### Task 9: 客户端脚本

**Files:**
- Create: `themes/voicebridge/client/app.ts`

- [ ] **Step 1: 移植内联脚本**

创建 `themes/voicebridge/client/app.ts`（源自 `sites/voicebridge.top/index.html:612-627`，加 TS 类型与空值保护）：

```ts
/** VoiceBridge 主题客户端：导航滚动变色 + 卡片入场动画。零依赖，编译为 public/app.js。 */
(function () {
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      (nav as HTMLElement).classList.toggle('scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var cards = document.querySelectorAll<HTMLElement>('.card');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e, i) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.transitionDelay = (i % 2) * 0.08 + 's';
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    cards.forEach(function (c) {
      io.observe(c);
    });
  } else {
    cards.forEach(function (c) {
      c.classList.add('in');
    });
  }
})();
```

- [ ] **Step 2: 构建整个主题包**

```bash
cd ~/sproot/matrix && npm run build -w @matrix/theme-voicebridge && ls themes/voicebridge/public/app.js
```

预期：无 TS 报错，`themes/voicebridge/public/app.js` 存在。

- [ ] **Step 3: 提交**

```bash
cd ~/sproot/matrix
git add themes/voicebridge/client/app.ts
git commit -m "feat(theme): voicebridge 客户端脚本（导航滚动 + 卡片入场）"
```

注：`public/*.js` 已被根 `.gitignore` 忽略，是构建产物，无需提交。

---

### Task 10: 首页 block 模板

**Files:**
- Create: `themes/voicebridge/views/blocks/hero.njk`
- Create: `themes/voicebridge/views/blocks/band.njk`
- Create: `themes/voicebridge/views/blocks/feature-bento.njk`
- Create: `themes/voicebridge/views/blocks/support-panel.njk`

对照 `sites/voicebridge.top/index.html:358-590` 逐段结构化。凡是一次性的插画 SVG（手机样机、离线徽章等）一律以 `artHtml` 字段原样透传，不强行拆成数据。

- [ ] **Step 1: hero.njk**

```njk
{# 首屏：eyebrow + 大标题 + 副文 + 双 CTA + 信任条 + 一次性插画（artHtml 原样透传）。 #}
<section class="hero"{% if block.data.id %} id="{{ block.data.id }}"{% endif %}>
  <div class="wrap">
    {% if block.data.eyebrow %}<span class="eyebrow rise d1">{{ block.data.eyebrow }}</span>{% endif %}
    <h1 class="title rise d2">{{ block.data.title | safe }}</h1>
    <p class="sub rise d3">{{ block.data.sub }}</p>
    <div class="actions rise d4">
      {% if block.data.appstore %}
      <a class="appstore" href="{{ block.data.appstore.href }}" aria-label="{{ block.data.appstore.label }}">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 12.54c-.02-2.02 1.65-2.99 1.72-3.04-0.94-1.37-2.4-1.56-2.92-1.58-1.24-.13-2.42.73-3.05.73-.63 0-1.6-.71-2.63-.69-1.35.02-2.6.79-3.3 2-1.41 2.44-.36 6.05 1.01 8.03.67.97 1.47 2.06 2.51 2.02 1.01-.04 1.39-.65 2.61-.65 1.22 0 1.56.65 2.63.63 1.09-.02 1.78-.99 2.44-1.96.77-1.12 1.09-2.21 1.11-2.27-.02-.01-2.13-.82-2.15-3.25zM15.03 6.6c.56-.68.94-1.62.83-2.56-.81.03-1.79.54-2.37 1.21-.52.6-.97 1.56-.85 2.48.9.07 1.83-.46 2.39-1.13z"/></svg>
        <span class="txt"><small>{{ block.data.appstore.small }}</small><b>{{ block.data.appstore.big }}</b></span>
      </a>
      {% endif %}
      {% if block.data.secondary %}<a class="link-arrow" href="{{ block.data.secondary.href }}">{{ block.data.secondary.text }}</a>{% endif %}
    </div>
    {% if block.data.trust %}
    <div class="trust rise d4">
      {% for t in block.data.trust %}<span>{{ t | safe }}</span>{% endfor %}
    </div>
    {% endif %}
    {% if block.data.artHtml %}<div class="device rise d4">{{ block.data.artHtml | safe }}</div>{% endif %}
  </div>
</section>
```

- [ ] **Step 2: band.njk**

```njk
{# 全宽标语带：一个 h2 + 一段引言。 #}
<section class="band"{% if block.data.id %} id="{{ block.data.id }}"{% endif %}>
  <div class="wrap">
    <h2>{{ block.data.title | safe }}</h2>
    {% if block.data.lead %}<p class="lead">{{ block.data.lead }}</p>{% endif %}
  </div>
</section>
```

- [ ] **Step 3: feature-bento.njk**

```njk
{# bento 卡片网格。每张卡：span 类名 + kicker + 标题 + 正文 + 可选一次性插画/价签。 #}
<section>
  <div class="wrap">
    <div class="bento">
      {% for card in block.data.cards %}
      <div class="card {{ card.cls }}">
        {% if card.kicker %}<span class="kicker">{{ card.kicker }}</span>{% endif %}
        <h3>{{ card.title | safe }}</h3>
        {% if card.body %}<p>{{ card.body }}</p>{% endif %}
        {% if card.artHtml %}{{ card.artHtml | safe }}{% endif %}
      </div>
      {% endfor %}
    </div>
  </div>
</section>
```

- [ ] **Step 4: support-panel.njk**

```njk
{# 支持区：标题 + 说明 + 邮件按钮 + FAQ 折叠列表。 #}
<section class="support"{% if block.data.id %} id="{{ block.data.id }}"{% endif %}>
  <div class="wrap">
    <div class="support-inner">
      <h2>{{ block.data.title }}</h2>
      <p>{{ block.data.body }}</p>
      {% if block.data.email %}
      <a class="mail" href="mailto:{{ block.data.email }}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3 7 9 6 9-6"/></svg>
        {{ block.data.email }}
      </a>
      {% endif %}
      {% if block.data.faq %}
      <div class="faq">
        {% for item in block.data.faq %}
        <details>
          <summary>{{ item.q }}</summary>
          <div class="a">{{ item.a }}</div>
        </details>
        {% endfor %}
      </div>
      {% endif %}
    </div>
  </div>
</section>
```

- [ ] **Step 5: 提交**

```bash
cd ~/sproot/matrix
git add themes/voicebridge/views/blocks
git commit -m "feat(theme): voicebridge 首页 block 模板（hero/band/feature-bento/support-panel）"
```

---

### Task 11: 站点配置 site.yaml

**Files:**
- Modify: `sites/voicebridge.top/site.yaml`（整体重写）

- [ ] **Step 1: 重写 site.yaml**

```yaml
# VoiceBridge 畅译官网 —— 数据驱动站点，voicebridge 主题。
theme: voicebridge
lang: zh-Hans
baseUrl: https://voicebridge.top

brand:
  name: VoiceBridge
  nameCn: 畅译
  desc: 端侧 AI 语音转写与实时纪要
  favicon: /favicon.svg

nav:
  - key: features
    text: 功能
    href: '#features'
  - key: support
    text: 支持
    href: '#support'
  - key: privacy
    text: 隐私
    href: /privacy.html

langSwitch:
  text: EN
  href: /index_en.html

cta:
  text: 免费下载
  href: '#download'

footer:
  columns:
    - title: 站内
      links:
        - text: 功能
          href: '#features'
        - text: 技术支持
          href: /support.html
        - text: 隐私政策
          href: /privacy.html
        - text: 使用条款
          href: /terms.html
        - text: 联系我们
          href: 'mailto:support@voicebridge.top'
        - text: English
          href: /index_en.html
  legal:
    contact: support@voicebridge.top
    company:
      text: VoiceBridge
      href: /
    foundingYear: 2026
    note: >-
      VoiceBridge（畅译）完全免费、100% 离线：识别、声纹与语义向量均在设备本地完成，无需联网。使用「AI 智能纪要」功能时，转录文本将在你的明确授权下通过系统剪贴板传递至你选择的第三方 AI 应用。
  social: []

defaults:
  ogImage: /og-image.png
  changefreq: monthly

extraAssets:
  - favicon.svg
  - apple-touch-icon.png
  - og-image.png
  - og-image.svg
  - googlebe863ce68fa6a6d4.html

llms:
  enabled: true
  summary: >-
    VoiceBridge（畅译）是一款完全免费、100% 离线的 iOS 录音转文字与 AI 会议纪要 App。语音识别、说话人声纹分离与语义检索全部在设备本地完成，音频与文字不上传任何服务器；无内购、无广告、无需注册；支持 12 语种离线识别，要求 iOS 17.0 及以上。

robots:
  - '# AI 生成引擎（GEO）：显式放行'
  - 'User-agent: GPTBot'
  - 'Allow: /'
  - ''
  - 'User-agent: OAI-SearchBot'
  - 'Allow: /'
  - ''
  - 'User-agent: PerplexityBot'
  - 'Allow: /'
  - ''
  - 'User-agent: ClaudeBot'
  - 'Allow: /'
  - ''
  - 'User-agent: Claude-SearchBot'
  - 'Allow: /'
  - ''
  - 'User-agent: Google-Extended'
  - 'Allow: /'
  - ''
  - 'User-agent: Bytespider'
  - 'Allow: /'
  - ''
  - 'User-agent: Baiduspider'
  - 'Allow: /'
  - ''
  - 'User-agent: YisouSpider'
  - 'Allow: /'
```

- [ ] **Step 2: 校验 YAML 可解析**

```bash
cd ~/sproot/matrix && node -e '
const yaml = require("js-yaml"), fs = require("fs");
const s = yaml.load(fs.readFileSync("sites/voicebridge.top/site.yaml", "utf-8"));
const assert = require("assert");
assert.strictEqual(s.theme, "voicebridge");
assert.strictEqual(s.baseUrl, "https://voicebridge.top");
assert.ok(Array.isArray(s.nav) && s.nav.length === 3, "nav 应有 3 项");
assert.ok(s.footer.legal.note.includes("100% 离线"), "footer note 缺失");
assert.ok(s.robots.includes("User-agent: GPTBot"), "robots 缺 GPTBot");
console.log("✅ site.yaml 结构断言通过");
'
```

预期：`✅ site.yaml 结构断言通过`。

- [ ] **Step 3: 提交**

```bash
cd ~/sproot/matrix
git add sites/voicebridge.top/site.yaml
git commit -m "feat(voicebridge): site.yaml 改为数据驱动配置（主题/导航/页脚/robots/llms）"
```

---

### Task 12: 中文页面内容（首页 + 3 法务支持页 + 404）

**Files:**
- Create: `sites/voicebridge.top/content/home.yaml`
- Create: `sites/voicebridge.top/content/support.yaml`
- Create: `sites/voicebridge.top/content/privacy.yaml`
- Create: `sites/voicebridge.top/content/terms.yaml`
- Create: `sites/voicebridge.top/content/404.yaml`

- [ ] **Step 1: home.yaml**

搬运对照表（行号已核对，均指 `sites/voicebridge.top/index.html`）：

| 目标 | 源行号 |
|---|---|
| `meta` 的 title/description/keywords | 6–8 |
| `meta.jsonLd`（`@graph` 三节点：SoftwareApplication / Organization / FAQPage） | 34–93（去掉外层 `<script>` 标签） |
| `hero` block | 359–441 |
| `hero.data.artHtml`（手机样机插画） | 379–438（`<div class="device">` 内的整段 `<svg>…</svg>`） |
| `band` block | 444–449 |
| `feature-bento.data.cards`（10 张） | 453–553（`<div class="bento">` 内每个 `<div class="card …">`） |
| `support-panel` block | 558–588，其中 `faq` 的 4 条 `<details>` 在 568–585 |

卡片的 `cls` 取原 `class` 里除 `card` 外的部分（如 `span-3 feature-hero accent`）；卡内一次性插画（`price-tag`、`art`、`offline-badge`、行内 SVG 等）整段塞进该卡的 `artHtml`，不拆结构。

骨架（其中 `title`/`sub`/卡片文案全部照抄原文）：

```yaml
path: /
template: home
meta:
  title: VoiceBridge 畅译 — 完全免费·离线录音转文字与 AI 会议纪要
  description: 畅译（VoiceBridge）是完全免费、100% 离线的录音转文字与 AI 会议纪要 App：导入音频离线识别、自动区分发言人、智能恢复标点排版、本地语义搜索、一键导出 PDF。音频与文字绝不上传服务器，无广告、无内购、无需注册。
  keywords: 录音转文字,会议纪要,语音识别,离线转录,逐字稿,声纹分离,发言人区分,AI 纪要,PDF 导出,语义搜索,完全免费,VoiceBridge,畅译
  canonical: /
  priority: 1.0
  changefreq: weekly
  alternates:
    - hreflang: zh-Hans
      href: /
    - hreflang: en
      href: /index_en.html
    - hreflang: x-default
      href: /
  jsonLd:
    '@context': https://schema.org
    '@graph': []   # ← 从 index.html:34-93 的 @graph 数组逐节点搬运，勿留空
blocks:
  - type: hero
    data:
      id: download
      eyebrow: 完全免费 · 100% 离线 · 数据不上传
      title: 录音转文字，<br>一键成纪要。
      sub: 导入任意录音，离线转成文字：自动区分发言人、恢复标点排成文章，一键生成 AI 纪要、导出 PDF。音频与文字 100% 留在设备，永久免费、无广告、无需注册。
      appstore:
        href: '#'
        label: 在 App Store 下载 VoiceBridge
        small: 下载于
        big: App Store
      secondary:
        text: 了解全部功能
        href: '#features'
      trust:
        - '<b>¥0</b> 完全免费'
        - 无广告 · 无内购
        - 无需注册登录
      artHtml: |
        <!-- 粘贴 index.html:379-438 的完整 <svg> -->
  - type: band
    data:
      id: features
      title: 收费 App 才有的功能，<span class="dim">这里全部免费、全部离线。</span>
      lead: 导入、识别、分离、整理、导出——全流程都在你的 iPhone 本地完成，音频与文字绝不离开设备。
  - type: feature-bento
    data:
      cards: []   # ← 从 index.html:453-553 逐张卡片搬运（cls/kicker/title/body/artHtml），共 10 张
  - type: support-panel
    data:
      id: support
      title: 需要帮助？
      body: 无论是使用问题、功能建议还是其它反馈，我们都乐意倾听。写封邮件，通常一个工作日内回复。
      email: support@voicebridge.top
      faq: []     # ← 从 index.html:568-585 的 4 条 details 搬运（q/a）
```

**⚠️ 上面三处 `[]` 与 `artHtml` 占位是搬运指令，不是可交付内容。本任务未把它们填满即视为未完成。** 填完后 `content/home.yaml` 里的可见文案必须与 `index.html` 一字不差——Task 14 会用 `html-text-diff.mjs` 逐字校验。

- [ ] **Step 2: support.yaml / privacy.yaml / terms.yaml**

三页都是长文，正文用 `custom-html` block 原样保留（这些是法律文本，重排风险大于收益）。以 `privacy.yaml` 为例：

```yaml
path: /privacy.html
template: page
meta:
  title: 隐私政策 — VoiceBridge 畅译
  description: VoiceBridge（畅译）隐私政策：录音与转录文本仅保存在设备本地，不上传任何服务器。
  canonical: /privacy.html
  priority: 0.5
  changefreq: yearly
  alternates:
    - hreflang: zh-Hans
      href: /privacy.html
    - hreflang: en
      href: /privacy_en.html
    - hreflang: x-default
      href: /privacy.html
blocks:
  - type: custom-html
    data:
      html: |
        <!-- 粘贴 sites/voicebridge.top/privacy.html 的 <body> 内正文（去掉原 nav 与 footer，二者已由主题提供） -->
```

`support.yaml`（`path: /support.html`，`priority: 0.8`，`changefreq: monthly`）与 `terms.yaml`（`path: /terms.html`，`priority: 0.5`，`changefreq: yearly`）同构，`meta.title`/`description` 从各自原 HTML 的 `<title>`/`<meta name="description">` 搬运。

- [ ] **Step 3: 404.yaml**

```yaml
path: /404
template: notFound
meta:
  title: 页面不存在 — VoiceBridge 畅译
  description: 你访问的页面不存在，返回首页继续了解 VoiceBridge（畅译）。
  canonical: /404
blocks:
  - type: band
    data:
      title: 页面不存在
      lead: 你访问的链接可能已失效。返回首页继续了解 VoiceBridge（畅译）。
```

- [ ] **Step 4: 提交**

```bash
cd ~/sproot/matrix
git add sites/voicebridge.top/content/home.yaml sites/voicebridge.top/content/support.yaml sites/voicebridge.top/content/privacy.yaml sites/voicebridge.top/content/terms.yaml sites/voicebridge.top/content/404.yaml
git commit -m "feat(voicebridge): 中文首页与法务/支持页迁入 content/"
```

---

### Task 13: 英文页面内容

**Files:**
- Create: `sites/voicebridge.top/content/en/home.yaml`
- Create: `sites/voicebridge.top/content/en/support.yaml`
- Create: `sites/voicebridge.top/content/en/privacy.yaml`
- Create: `sites/voicebridge.top/content/en/terms.yaml`

- [ ] **Step 1: en/home.yaml**

结构与 `content/home.yaml` 完全一致，差异只有四处：`path: /index_en.html`、`meta.lang: en`、全部文案取自 `index_en.html`、`alternates` 的 `x-default` 仍指向 `/`。

```yaml
path: /index_en.html
template: home
meta:
  lang: en
  canonical: /index_en.html
  priority: 1.0
  changefreq: weekly
  alternates:
    - hreflang: zh-Hans
      href: /
    - hreflang: en
      href: /index_en.html
    - hreflang: x-default
      href: /
  # title / description / keywords / jsonLd 从 index_en.html 的 <head> 逐字搬运
blocks: []   # ← 与中文版同构，文案取自 index_en.html
```

**⚠️ `blocks: []` 与注释掉的 meta 字段是搬运指令，必须填满。**

- [ ] **Step 2: en/support.yaml、en/privacy.yaml、en/terms.yaml**

与 Task 12 Step 2 同构，路径分别为 `/support_en.html`、`/privacy_en.html`、`/terms_en.html`，`meta.lang: en`，正文用 `custom-html` 从对应 `*_en.html` 的 `<body>` 搬运（去掉 nav/footer）。

⚠️ 英文页的导航与页脚文案来自 `site.yaml`（中文），迁移后英文页会显示中文导航。**本任务范围内的处理方式**：在 `en/*.yaml` 的 `meta` 里加 `bodyClass: lang-en`，Task 14 验收时若发现导航语言错乱，作为已知缺口记录并在阶段 2 计划中用 `locals` 覆盖解决——不在本计划扩大范围。

- [ ] **Step 3: 提交**

```bash
cd ~/sproot/matrix
git add sites/voicebridge.top/content/en
git commit -m "feat(voicebridge): 英文首页与法务/支持页迁入 content/en/"
```

---

### Task 14: 导出验收 —— URL 集合 + 逐页文本 + 视觉

**Files:**
- Modify: `sites/voicebridge.top/deploy/deploy.sh`
- Create: `.claude/launch.json`（若已存在则追加配置项）

- [ ] **Step 1: 切换发布链路**

`sites/voicebridge.top/deploy/deploy.sh` 中，把原来那行拷贝式 `EXPORT_CMD` 整段替换为（对齐 `sites/edaijia/deploy/deploy.sh`）：

```bash
# 平台包（blocks → site-kit → cli）与主题必须先构建为 dist/
(cd "$REPO_ROOT" && npm run build:platform && npm run build -w @matrix/theme-voicebridge)

export EXPORT_CMD="npm --prefix '$REPO_ROOT' run matrix -- export '$SITE_NAME'"
```

- [ ] **Step 2: 首次导出**

```bash
cd ~/sproot/matrix
npm run build:platform && npm run build -w @matrix/theme-voicebridge
npm run matrix -- export voicebridge.top
```

预期：逐行打印 9 个页面产物 + `404.html` + `sitemap.xml + robots.txt` + `theme.css` + `app.js` + `llms.txt + llms-full.txt`。

- [ ] **Step 3: URL 集合零变化断言**

```bash
cd ~/sproot/matrix/sites/voicebridge.top
for f in index.html index_en.html support.html support_en.html privacy.html privacy_en.html terms.html terms_en.html googlebe863ce68fa6a6d4.html; do
  [ -f "out/$f" ] && echo "OK  $f" || echo "缺失 $f"
done
find out -name index.html -not -path 'out/index.html' | sed 's|^|目录式: |'
```

预期：9 行全部 `OK`，没有 `缺失`；`目录式:` 一行都不应出现（本阶段还没有新增页面）。

- [ ] **Step 4: 逐页可见文本比对**

```bash
cd ~/sproot/matrix
fail=0
for f in index.html index_en.html support.html support_en.html privacy.html privacy_en.html terms.html terms_en.html; do
  node scripts/html-text-diff.mjs "/tmp/vb-baseline/$f" "sites/voicebridge.top/out/$f" || fail=1
done
echo "文本比对 fail=$fail"
```

预期：`fail=0`。若有差异，逐条对照 `content/*.yaml` 补齐——**允许的差异只有一类**：原 HTML 里被 `<svg>` 包裹的装饰性文本（脚本已整体剥离 svg，不会产生差异）。其余任何差异都必须修到零。

- [ ] **Step 5: sitemap 与 robots 检查**

```bash
cd ~/sproot/matrix
grep -c '<loc>' sites/voicebridge.top/out/sitemap.xml
grep -c 'xhtml:link' sites/voicebridge.top/out/sitemap.xml
head -20 sites/voicebridge.top/out/robots.txt
head -12 sites/voicebridge.top/out/llms.txt
```

预期：8 个 `<loc>`（首页 + 英文首页 + 6 个法务支持页，404 不入 sitemap）；`xhtml:link` 24 个（8 页 × 3 条 hreflang）；robots.txt 含 `User-agent: GPTBot`；llms.txt 首行是 `# VoiceBridge`。

- [ ] **Step 6: 起本地预览做视觉比对**

创建或追加 `.claude/launch.json`：

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "voicebridge-baseline",
      "runtimeExecutable": "python3",
      "runtimeArgs": ["-m", "http.server", "8788", "--directory", "/tmp/vb-baseline"],
      "port": 8788
    },
    {
      "name": "voicebridge-new",
      "runtimeExecutable": "python3",
      "runtimeArgs": ["-m", "http.server", "8789", "--directory", "sites/voicebridge.top/out"],
      "port": 8789
    }
  ]
}
```

分别用 `preview_start` 起两个服务，对 `/`、`/index_en.html`、`/support.html`、`/privacy.html`、`/terms.html` 各截一次图（桌面 1280×800 与移动 375×812 两档），逐对比对。

预期：布局、配色、字号、卡片阴影、导航模糊、滚动入场动效一致。发现差异回 Task 7/8/10 修 CSS 或模板。

- [ ] **Step 7: 清理已被数据替代的手写文件**

确认 Step 3–6 全绿之后，删除已迁移的源文件（它们的内容现在活在 `content/` 里；`out/` 是构建产物且被 gitignore）：

```bash
cd ~/sproot/matrix/sites/voicebridge.top
git rm index.html index_en.html support.html support_en.html privacy.html privacy_en.html terms.html terms_en.html sitemap.xml robots.txt
```

保留 `favicon.svg`、`apple-touch-icon.png`、`og-image.png`、`og-image.svg`、`googlebe863ce68fa6a6d4.html`（已在 `extraAssets` 中声明）。

- [ ] **Step 8: 提交**

```bash
cd ~/sproot/matrix
git add sites/voicebridge.top/deploy/deploy.sh .claude/launch.json
git add -u sites/voicebridge.top
git commit -m "refactor(voicebridge): 发布链路切到 matrix CLI，删除已迁移的手写 HTML"
```

---

### Task 15: 上线与线上回归

- [ ] **Step 1: 更新架构文档**

`AGENTS.md` 的目录结构树中，把 `voicebridge.top/ # VoiceBridge 畅译 App 官网（纯静态 HTML 页面同步）` 改为：

```
│   └── voicebridge.top/ # VoiceBridge 畅译 App 官网（voicebridge 主题，中英双语，SEO/GEO 内容矩阵）
```

并在 `themes/` 树中追加一行：

```
│   └── voicebridge/    # voicebridge.top 激活（苹果发布会风：大标题 hero + bento 卡片）
```

- [ ] **Step 2: 提交文档**

```bash
cd ~/sproot/matrix
git add AGENTS.md
git commit -m "docs(agents): 登记 themes/voicebridge 与 voicebridge.top 站点形态变更"
```

- [ ] **Step 3: 征得用户确认后发布**

⚠️ **这一步会改动线上站点，必须先向用户确认再执行。**

```bash
cd ~/sproot/matrix/sites/voicebridge.top && ./deploy/deploy.sh
```

预期：末行 `[deploy] 部署完成! 🚀 https://voicebridge.top`。

- [ ] **Step 4: 线上 URL 回归**

```bash
for u in / /index_en.html /support.html /support_en.html /privacy.html /privacy_en.html /terms.html /terms_en.html /sitemap.xml /robots.txt /llms.txt /googlebe863ce68fa6a6d4.html; do
  printf '%-40s %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' https://voicebridge.top$u)"
done
```

预期：全部 `200`。任何一个非 200 立即回滚（`git revert` 上一批提交后重新 `deploy.sh`）。

- [ ] **Step 5: 复查 Google 站点验证仍有效**

```bash
curl -s https://voicebridge.top/googlebe863ce68fa6a6d4.html
```

预期：输出 `google-site-verification: googlebe863ce68fa6a6d4.html`。

---

## 阶段 0–1 完成定义

全部满足才算完成：

1. `npm run matrix -- export voicebridge.top` 一条命令产出全站。
2. 现网 8 个页面 URL 全部 200，`html-text-diff.mjs` 逐页 `fail=0`。
3. 桌面与移动两档截图与迁移前一致。
4. `sitemap.xml` 含 24 条 `xhtml:link`；`robots.txt` 含 9 段 AI 爬虫放行；`llms.txt` / `llms-full.txt` 正常产出。
5. `synon.ai` 回归比对无 `DIFF:`，`sitemap.xml` 逐字节不变。
6. `AGENTS.md` 已登记新主题与站点形态。

## 后续（另写计划，不在本计划范围）

- **阶段 2**：新增 27 页内容（4 支柱 / 5 场景 + 列表 / 6 教程 + 列表 / 4 知识 + 列表 / 3 支撑 / 1 对比 / 1 事实页），需先补 `answer-card`、`prose`、`step-list`、`card-grid`、`fact-table`、`breadcrumb`、`related-links` 七个 block，以及英文页导航文案覆盖（Task 13 Step 2 记录的已知缺口）。
- **阶段 3**：百度站长 / GSC / Bing 站长提交与主动推送脚本，AI 引用基线实测记录。
