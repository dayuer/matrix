# Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce WordPress-style themes: extract the "engineering dossier" look into a reusable `themes/dossier` package, make `site-kit` theme-aware (template registry + token injection + child-theme overrides), and rewire `synon.ai` to *activate* the theme with content only.

**Architecture:** A theme package owns all presentation (layout, partials, templates, `theme.css` authored against CSS custom properties, client JS) plus a manifest of token defaults + a named-template registry. `site-kit` merges `theme.tokens` with per-site `themeOptions` into an injected `:root{}` block, resolves page `template` names via the theme registry (falling back to literal paths for non-theme sites), and copies theme assets on export. Sites without a `theme` are 100% unchanged.

**Tech Stack:** TypeScript (CommonJS, tsc), Nunjucks, Express, npm workspaces, vanilla CSS custom properties. No git in this workspace — "Commit" steps are replaced by verification checkpoints.

**Verification model:** These are templates/CSS, not unit-testable code. Each task's "test" is a typecheck/build/export/grep assertion, with browser checks in the final task.

---

## File structure

```
themes/dossier/                      # NEW workspace package @matrix/theme-dossier
  package.json, tsconfig.json, tsconfig.client.json
  theme.ts                           # manifest (tokens + template registry)
  theme.css                          # from synon style.css, :root removed
  client/app.ts                      # from synon src/client/app.ts
  public/app.js                      # compiled
  views/layout.njk                   # from synon base.njk (+ token inject)
  views/partials/logo.njk            # from synon
  views/templates/home.njk           # from synon index.njk
  views/templates/404.njk            # from synon 404.njk

packages/site-kit/src/
  types.ts                           # + ThemeManifest, SiteDefinition.theme?/themeOptions?
  theme.ts                           # NEW: buildTokensCss(), resolveTemplate()
  render.ts                          # theme-aware search paths + themeTokensCss global
  server.ts, export.ts               # resolve template names, copy theme assets
  index.ts                           # export new symbols

apps/synon.ai/
  src/site-def.ts                    # activate theme
  package.json                       # + @matrix/theme-dossier dep; drop build:client
  (delete) views/, style.css, src/client/, public/app.js, tsconfig.client.json
```

---

## Task 1: Scaffold the `themes/dossier` package

**Files:**
- Modify: `package.json` (root, workspaces)
- Create: `themes/dossier/package.json`
- Create: `themes/dossier/tsconfig.json`
- Create: `themes/dossier/tsconfig.client.json`

- [ ] **Step 1: Add `themes/*` to root workspaces**

Modify root `package.json`:

```json
{
  "name": "didi-matrix",
  "private": true,
  "workspaces": [
    "packages/*",
    "themes/*",
    "apps/*"
  ]
}
```

- [ ] **Step 2: Create `themes/dossier/package.json`**

```json
{
  "name": "@matrix/theme-dossier",
  "version": "1.0.0",
  "private": true,
  "description": "内容矩阵主题：工程档案（Engineering Dossier）—— 浅色技术纸 + 蓝图网格 + Archivo/JetBrains Mono + 朱红标注。",
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

- [ ] **Step 3: Create `themes/dossier/tsconfig.json`**

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

- [ ] **Step 4: Create `themes/dossier/tsconfig.client.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "public",
    "rootDir": "client",
    "strict": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true
  },
  "include": ["client/**/*.ts"]
}
```

- [ ] **Step 5: Checkpoint**

Run: `ls themes/dossier`
Expected: `package.json  tsconfig.client.json  tsconfig.json`

---

## Task 2: Add theme types to site-kit

**Files:**
- Modify: `packages/site-kit/src/types.ts`

- [ ] **Step 1: Add `ThemeManifest` and extend `SiteDefinition`**

Append `ThemeManifest` before `SiteDefinition`, and add two optional fields to `SiteDefinition`:

```ts
/** 一个主题的清单：模板集 + 设计 token 默认值 + 资源。 */
export interface ThemeManifest {
  id: string;
  name: string;
  /** 主题包根目录，通常 path.resolve(__dirname)。 */
  dir: string;
  /** 基础布局，相对 views/，如 'layout.njk'。 */
  layout: string;
  /** 命名模板 → 相对 views/ 的文件路径。 */
  templates: Record<string, string>;
  /** CSS 自定义属性默认值：{ '--paper': '#faf9f6', ... } */
  tokens: Record<string, string>;
  /** 主题样式文件，相对 dir，如 'theme.css'。 */
  css: string;
  /** 主题客户端脚本产物，相对 dir，如 'public/app.js'。 */
  clientJs?: string;
  /** 主题自带 favicon 兜底路径（可选）。 */
  defaultFavicon?: string;
}
```

In `SiteDefinition`, add after `notFound: PageDef;`:

```ts
  /** 激活的主题（可选）。未设置时站点用自有 views/ + style.css（向后兼容）。 */
  theme?: ThemeManifest;
  /** 覆盖主题 token 的子集，如 { '--accent': '#1f5fbf' }。 */
  themeOptions?: Record<string, string>;
```

- [ ] **Step 2: Typecheck**

Run: `npm run build -w @matrix/site-kit`
Expected: no errors (compiles to dist/).

- [ ] **Step 3: Checkpoint** — confirm `ThemeManifest` in `packages/site-kit/dist/types.d.ts`.

Run: `grep -c ThemeManifest packages/site-kit/dist/types.d.ts`
Expected: `>= 1`

---

## Task 3: site-kit theme resolution helpers

**Files:**
- Create: `packages/site-kit/src/theme.ts`
- Modify: `packages/site-kit/src/index.ts`

- [ ] **Step 1: Create `packages/site-kit/src/theme.ts`**

```ts
import path from 'path';
import type { ThemeManifest } from './types';

/** 合并主题默认 token 与站点覆盖，生成注入用的 :root{} 字符串。无主题时返回 ''。 */
export function buildTokensCss(theme?: ThemeManifest, options?: Record<string, string>): string {
  if (!theme) return '';
  const merged = { ...theme.tokens, ...(options || {}) };
  const body = Object.entries(merged)
    .map(([k, v]) => `${k}: ${v};`)
    .join(' ');
  return `:root{ ${body} }`;
}

/**
 * 把页面的 template 解析为实际模板路径。
 * 有主题且命中命名模板 → 主题模板；否则原样作为字面路径（向后兼容）。
 */
export function resolveTemplate(name: string, theme?: ThemeManifest): string {
  if (theme && theme.templates[name]) return theme.templates[name];
  return name;
}

/** 主题 views 目录的绝对路径。 */
export function themeViewsDir(theme: ThemeManifest): string {
  return path.join(theme.dir, 'views');
}
```

- [ ] **Step 2: Export from `packages/site-kit/src/index.ts`**

Add:

```ts
export { buildTokensCss, resolveTemplate, themeViewsDir } from './theme';
```

- [ ] **Step 3: Typecheck**

Run: `npm run build -w @matrix/site-kit`
Expected: no errors.

- [ ] **Step 4: Behavior check**

Run:
```bash
node -e "const {buildTokensCss,resolveTemplate}=require('./packages/site-kit/dist'); \
console.log(buildTokensCss({tokens:{'--accent':'#c6431c'}},{'--accent':'#1f5fbf'})); \
console.log(resolveTemplate('home',{templates:{home:'templates/home.njk'}})); \
console.log(resolveTemplate('pages/index.njk'))"
```
Expected:
```
:root{ --accent: #1f5fbf; }
templates/home.njk
pages/index.njk
```

---

## Task 4: Make render/server/export theme-aware

**Files:**
- Modify: `packages/site-kit/src/render.ts`
- Modify: `packages/site-kit/src/server.ts`
- Modify: `packages/site-kit/src/export.ts`

- [ ] **Step 1: Update `render.ts` — search paths + tokens global**

Replace the body of `createEnv` so it accepts an optional theme + tokens css. Change `RenderContext` and `createEnv`:

```ts
import path from 'path';
import nunjucks from 'nunjucks';
import type { BaseSiteConfig, ThemeManifest } from './types';
import { buildTokensCss, themeViewsDir } from './theme';

export interface RenderContext {
  site: BaseSiteConfig;
  basePath: string;
  assetVersion: string;
  noCache: boolean;
  theme?: ThemeManifest;
  themeOptions?: Record<string, string>;
}

export function createEnv(root: string, ctx: RenderContext): nunjucks.Environment {
  const searchPaths = [path.join(root, 'views')];
  if (ctx.theme) searchPaths.push(themeViewsDir(ctx.theme));
  searchPaths.push(path.join(__dirname, '..', 'views'));

  const env = nunjucks.configure(searchPaths, { autoescape: true, noCache: ctx.noCache });

  env.addGlobal('site', ctx.site);
  env.addGlobal('assetVersion', ctx.assetVersion);
  env.addGlobal('currentYear', new Date().getFullYear());
  env.addGlobal('basePath', ctx.basePath);
  env.addGlobal('themeTokensCss', buildTokensCss(ctx.theme, ctx.themeOptions));

  return env;
}
```

- [ ] **Step 2: Update `server.ts` — pass theme, resolve templates, mount theme assets**

In `createServer`, after destructuring add theme, and change env creation + static mounts + routes:

```ts
import { resolveTemplate } from './theme';
// ...
export function createServer(def: SiteDefinition): Express {
  const app = express();
  const { root, site, pages, notFound, theme, themeOptions } = def;

  app.use(compression());

  app.use('/style.css', express.static(path.join(root, 'style.css')));
  if (theme) app.use('/theme.css', express.static(path.join(theme.dir, theme.css)));
  const clientJs = theme?.clientJs
    ? path.join(theme.dir, theme.clientJs)
    : path.join(root, 'public', 'app.js');
  app.use('/app.js', express.static(clientJs));
  app.use('/images', express.static(path.join(root, 'images')));

  const env = createEnv(root, {
    site, basePath: '', assetVersion: String(Date.now()),
    noCache: process.env.NODE_ENV !== 'production', theme, themeOptions,
  });
  env.express(app);

  app.get('/sitemap.xml', (_req, res) => res.type('application/xml').send(generateSitemap(site.baseUrl, pages)));
  app.get('/robots.txt', (_req, res) => res.type('text/plain').send(generateRobots(site.baseUrl)));

  for (const p of pages) {
    app.get(p.path, (_req, res) => res.render(resolveTemplate(p.template, theme), { page: p.page, ...(p.locals || {}) }));
  }
  app.use((_req, res) => res.status(404).render(resolveTemplate(notFound.template, theme), { page: notFound.page, ...(notFound.locals || {}) }));

  return app;
}
```

(The `startServer` function is unchanged.)

- [ ] **Step 3: Update `export.ts` — resolve templates, inject theme, copy theme assets**

Change env creation, page/404 rendering, and asset copying in `exportSite`:

```ts
import { resolveTemplate } from './theme';
// ...
export function exportSite(def: SiteDefinition): void {
  const { root, site, pages, notFound, extraAssets = [], theme, themeOptions } = def;
  const OUT = path.join(root, 'out');
  const basePath = (process.env.BASE_PATH || '').replace(/\/$/, '');

  const env = createEnv(root, {
    site, basePath, assetVersion: String(Date.now()), noCache: true, theme, themeOptions,
  });

  console.log(`🚀 开始静态导出 ${site.brand.name}...\n`);
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
  ensureDir(OUT);

  for (const p of pages) {
    const html = env.render(resolveTemplate(p.template, theme), { page: p.page, ...(p.locals || {}) });
    if (p.path === '/') {
      fs.writeFileSync(path.join(OUT, 'index.html'), html);
      console.log('  ✅ / → out/index.html');
    } else {
      const dir = path.join(OUT, p.path.replace(/^\//, ''));
      ensureDir(dir);
      fs.writeFileSync(path.join(dir, 'index.html'), html);
      console.log(`  ✅ ${p.path} → out${p.path}/index.html`);
    }
  }

  const html404 = env.render(resolveTemplate(notFound.template, theme), { page: notFound.page, ...(notFound.locals || {}) });
  fs.writeFileSync(path.join(OUT, '404.html'), html404);
  console.log('  ✅ 404.html');

  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), generateSitemap(site.baseUrl, pages));
  fs.writeFileSync(path.join(OUT, 'robots.txt'), generateRobots(site.baseUrl));
  console.log('  ✅ sitemap.xml + robots.txt');

  // theme.css (if themed), then site style.css (child override), last wins in <head> order
  if (theme) {
    fs.copyFileSync(path.join(theme.dir, theme.css), path.join(OUT, 'theme.css'));
    console.log('  ✅ theme.css');
  }
  const siteCss = path.join(root, 'style.css');
  if (fs.existsSync(siteCss)) {
    fs.copyFileSync(siteCss, path.join(OUT, 'style.css'));
    console.log('  ✅ style.css');
  }

  // client JS: site public/app.js overrides theme clientJs
  const siteJs = path.join(root, 'public', 'app.js');
  const themeJs = theme?.clientJs ? path.join(theme.dir, theme.clientJs) : null;
  const jsSrc = fs.existsSync(siteJs) ? siteJs : themeJs;
  if (jsSrc && fs.existsSync(jsSrc)) {
    fs.copyFileSync(jsSrc, path.join(OUT, 'app.js'));
    console.log('  ✅ app.js');
  } else {
    console.warn('  ⚠️  未找到 app.js（先构建主题 client 或站点 build:client）。');
  }

  const images = path.join(root, 'images');
  if (fs.existsSync(images)) { copyDir(images, path.join(OUT, 'images')); console.log('  ✅ images/'); }

  for (const rel of extraAssets) {
    const src = path.join(root, rel);
    if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(OUT, path.basename(rel))); console.log(`  ✅ ${rel}`); }
  }

  console.log(`\n🎉 导出完成！${OUT}\n`);
}
```

- [ ] **Step 4: Rebuild site-kit and re-verify arrfunds (no-theme backward compat)**

Run:
```bash
npm run build -w @matrix/site-kit
npm run build:server -w arrfunds-website
npm run export -w arrfunds-website
```
Expected: all succeed; arrfunds `out/` still has `index.html`, `sitemap.xml`, `style.css`, no `theme.css` (it has no theme).

Run: `ls apps/arrfunds/out | grep -c theme.css`
Expected: `0`

---

## Task 5: Populate the dossier theme

**Files:**
- Create: `themes/dossier/theme.ts`
- Create: `themes/dossier/theme.css` (moved from `apps/synon.ai/style.css`, `:root` removed)
- Create: `themes/dossier/client/app.ts` (moved from `apps/synon.ai/src/client/app.ts`)
- Create: `themes/dossier/views/layout.njk` (from synon `base.njk` + token inject)
- Create: `themes/dossier/views/partials/logo.njk` (copy)
- Create: `themes/dossier/views/templates/home.njk` (from synon `index.njk`)
- Create: `themes/dossier/views/templates/404.njk` (from synon `404.njk`)

- [ ] **Step 1: Move template + client + css files into the theme**

Run:
```bash
mkdir -p themes/dossier/views/partials themes/dossier/views/templates themes/dossier/client
cp apps/synon.ai/views/layouts/base.njk    themes/dossier/views/layout.njk
cp apps/synon.ai/views/partials/logo.njk    themes/dossier/views/partials/logo.njk
cp apps/synon.ai/views/pages/index.njk      themes/dossier/views/templates/home.njk
cp apps/synon.ai/views/pages/404.njk        themes/dossier/views/templates/404.njk
cp apps/synon.ai/style.css                  themes/dossier/theme.css
cp apps/synon.ai/src/client/app.ts          themes/dossier/client/app.ts
```

- [ ] **Step 2: Fix `{% extends %}` paths in the moved templates**

In `themes/dossier/views/templates/home.njk` and `themes/dossier/views/templates/404.njk`, change the first line from `{% extends "layouts/base.njk" %}` to:

```njk
{% extends "layout.njk" %}
```

- [ ] **Step 3: Inject theme tokens into `layout.njk`**

In `themes/dossier/views/layout.njk`, add the tokens `<style>` immediately BEFORE the `style.css`/`theme.css` links in `<head>`. Replace the stylesheet link line:

```njk
  <link rel="stylesheet" href="{{ basePath }}/style.css?v={{ assetVersion }}">
```

with:

```njk
  {% if themeTokensCss %}<style id="theme-tokens">{{ themeTokensCss | safe }}</style>{% endif %}
  <link rel="stylesheet" href="{{ basePath }}/theme.css?v={{ assetVersion }}">
  <link rel="stylesheet" href="{{ basePath }}/style.css?v={{ assetVersion }}">
```

(Both stylesheets are requested; the site `style.css` is optional child-override and 404s harmlessly if absent — to avoid the 404, the synon migration in Task 6 keeps no `style.css`, so also guard it: wrap the `style.css` link in `{% if hasSiteCss %}`. Simpler: drop the `style.css` link entirely here since the dossier theme is self-contained; sites needing child overrides re-add it. Use ONLY these two lines:)

```njk
  {% if themeTokensCss %}<style id="theme-tokens">{{ themeTokensCss | safe }}</style>{% endif %}
  <link rel="stylesheet" href="{{ basePath }}/theme.css?v={{ assetVersion }}">
```

- [ ] **Step 4: Remove `:root{}` from `theme.css`**

In `themes/dossier/theme.css`, delete the entire `:root { ... }` block under section "1. Tokens" (the design-token values now come from the injected `themeTokensCss`). Keep everything else (the `* { box-sizing }` reset and all selectors that consume `var(--…)`). Leave a comment marker:

```css
/* Design tokens are injected by @matrix/site-kit from theme.ts manifest (see themeTokensCss). */
```

- [ ] **Step 5: Create `themes/dossier/theme.ts` manifest**

```ts
import path from 'path';
import type { ThemeManifest } from '@matrix/site-kit';

const dossier: ThemeManifest = {
  id: 'dossier',
  name: 'Engineering Dossier',
  dir: path.resolve(__dirname),
  layout: 'layout.njk',
  templates: {
    home: 'templates/home.njk',
    notFound: 'templates/404.njk',
  },
  css: 'theme.css',
  clientJs: 'public/app.js',
  tokens: {
    '--paper': '#faf9f6',
    '--paper-2': '#f1efea',
    '--paper-3': '#eae7e0',
    '--ink': '#16181d',
    '--ink-2': '#3b3f47',
    '--muted': '#6b7079',
    '--line': 'rgba(22, 24, 29, 0.12)',
    '--line-soft': 'rgba(22, 24, 29, 0.07)',
    '--grid': 'rgba(22, 24, 29, 0.05)',
    '--accent': '#c6431c',
    '--accent-ink': '#a5360f',
    '--accent-soft': 'rgba(198, 67, 28, 0.09)',
    '--font-display': "'Archivo', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif",
    '--font-body': "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', Roboto, sans-serif",
    '--font-mono': "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    '--r-1': '2px',
    '--r-2': '4px',
    '--container': '1160px',
    '--ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
};

export { dossier };
export default dossier;
```

> Note: `dir` resolves to `themes/dossier/dist` at runtime (compiled), so `css`/`clientJs`/`views`
> are read relative to the package root. Since `views/`, `theme.css`, `public/` sit at the package
> root (not `dist/`), set `dir` to the package root explicitly:

Replace the `dir` line with:

```ts
  dir: path.resolve(__dirname, '..'),
```

(so from `dist/theme.js`, `..` is the package root holding `views/`, `theme.css`, `public/`).

- [ ] **Step 6: Build the theme**

Run:
```bash
npm install
npm run build -w @matrix/theme-dossier
```
Expected: `themes/dossier/dist/theme.js` and `themes/dossier/public/app.js` exist.

Run: `ls themes/dossier/dist themes/dossier/public`
Expected: `theme.js` (+ .d.ts) and `app.js`.

- [ ] **Step 7: Assert `:root` removed from theme.css**

Run: `grep -c '^:root' themes/dossier/theme.css`
Expected: `0`

---

## Task 6: Rewire synon.ai to activate the theme

**Files:**
- Modify: `apps/synon.ai/src/site-def.ts`
- Modify: `apps/synon.ai/package.json`
- Delete: `apps/synon.ai/views/`, `apps/synon.ai/style.css`, `apps/synon.ai/src/client/`, `apps/synon.ai/public/app.js`, `apps/synon.ai/tsconfig.client.json`

- [ ] **Step 1: Activate theme in `site-def.ts`**

Add the theme import and fields; change page templates to names. Edit `apps/synon.ai/src/site-def.ts`:

At top, add:

```ts
import { dossier } from '@matrix/theme-dossier';
```

In the returned `siteDefinition`, add `theme` + `themeOptions` and change template values:
- add after `root: ROOT,`: `theme: dossier,` and `themeOptions: {},`
- change the index page `template: 'pages/index.njk'` → `template: 'home'`
- change `notFound.template: 'pages/404.njk'` → `template: 'notFound'`

- [ ] **Step 2: Update `apps/synon.ai/package.json`**

Add dep and drop client build (theme owns client now):

```json
  "scripts": {
    "build:server": "tsc -p tsconfig.json",
    "build": "npm run build:server",
    "dev": "tsx watch src/server.ts",
    "export": "tsx src/export.ts",
    "prestart": "npm run build",
    "start": "node dist/server.js"
  },
```

In `dependencies` add:

```json
    "@matrix/theme-dossier": "1.0.0",
```

Remove `dev:client` and `build:client` scripts (shown removed above).

- [ ] **Step 3: Delete migrated presentation files**

Run:
```bash
rm -rf apps/synon.ai/views apps/synon.ai/src/client apps/synon.ai/public apps/synon.ai/style.css apps/synon.ai/tsconfig.client.json
```

- [ ] **Step 4: Install + typecheck**

Run:
```bash
npm install
npm run build:server -w synon-website
```
Expected: no TS errors. (`site-def.ts` resolves `@matrix/theme-dossier` types.)

- [ ] **Step 5: Export**

Run: `npm run export -w synon-website`
Expected output includes: `✅ theme.css`, `✅ app.js`, `✅ images/`, `✅ sitemap.xml + robots.txt`, `🎉 导出完成`.

- [ ] **Step 6: Assert exported HTML uses injected tokens + theme css**

Run:
```bash
grep -c 'id="theme-tokens"' apps/synon.ai/out/index.html
grep -c '/theme.css' apps/synon.ai/out/index.html
grep -c -- '--accent: #c6431c' apps/synon.ai/out/index.html
```
Expected: each `1` (theme-tokens style present, theme.css linked, accent token injected).

---

## Task 7: Verify parity + prove reuse

**Files:** none (verification only)

- [ ] **Step 1: Full build chain green**

Run:
```bash
npm run build -w @matrix/site-kit && npm run build -w @matrix/theme-dossier && \
npm run build:server -w synon-website && npm run export -w synon-website
```
Expected: all succeed.

- [ ] **Step 2: Browser parity — desktop**

Serve `apps/synon.ai/out` (e.g. via preview) and screenshot at desktop width. Confirm the page is visually identical to the pre-migration dossier design: light paper + blueprint hero grid, INPUT→`FDE ×5`→OUTPUT spec panel, §01–§05 sections, before→after comparison bars, vermilion accent.

- [ ] **Step 3: Browser parity — 375px**

Resize to 375px. Confirm hamburger menu opens the numbered nav panel, sections stack, case meta wraps, no overflow.

- [ ] **Step 4: Reuse proof (token-only recolor)**

Temporarily set `themeOptions: { '--accent': '#1f5fbf' }` in `apps/synon.ai/src/site-def.ts`, re-export, and screenshot. Confirm every accent (kicker, ticks, bars, links, buttons-hover, logo mark) turns blue while layout/typography are unchanged — proving a second site could activate `dossier` with a different palette and no template edits.

- [ ] **Step 5: Revert the proof**

Restore `themeOptions: {}`, re-export. Confirm accent is vermilion again.

- [ ] **Step 6: Update docs**

- In `themes/dossier/`, create `README.md` stating the theme's content contract (expects `site.fdeSteps / teamModels / portfolio / faqs / nav / footer / cta / brand`) and how to activate + override tokens.
- In root `README.md`, add a `themes/` bullet to the directory tree and a one-paragraph "主题系统" section pointing at the theme.
- In `AGENTS.md`, add `themes/dossier/theme.ts` and `apps/synon.ai/src/site-def.ts` (theme activation) to the file-responsibility list.

---

## Self-review notes

- **Spec coverage:** §3 package (T1,T5), §4 manifest (T5.5), §5 token merge/inject (T3.1, T4.1, T5.3), §6 template hierarchy (T3.1, T4.2-3), §7.1 optional theme + backward-compat (T2, T4.4), §7.2 render (T4.1), §7.3 export assets (T4.3), §8 dossier contents (T5), §9 synon shape (T6), §10 build order (T1,T5.6,T6.4), §11 verification (T7), §12 risks (T7.6 README contract). All covered.
- **`dir` gotcha:** compiled manifest lives in `dist/`; `dir` set to package root via `path.resolve(__dirname,'..')` so `views/`/`theme.css`/`public/` resolve (T5.5).
- **Backward-compat:** `theme` optional; `resolveTemplate` falls back to literal path; arrfunds re-verified in T4.4.
- **No git:** commits replaced by build/grep/browser checkpoints.
