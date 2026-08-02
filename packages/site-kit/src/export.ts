import path from 'path';
import fs from 'fs';

import { createEnv } from './render';
import { resolveTemplate } from './theme';
import { generateSitemap, generateRobots } from './sitemap';
import type { SiteDefinition } from './types';

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

/**
 * 页面路由 → out/ 内的相对输出文件路径。
 * 路径冲突守卫与实际写入循环共用这一份实现——规则只有一处真源，
 * 否则两处漂移会让守卫报「无冲突」而写入时真的互相覆盖。
 */
function resolveOutputRel(routePath: string): string {
  if (routePath === '/') return 'index.html';
  const bare = routePath.replace(/^\//, '');
  return /\.html?$/i.test(routePath) ? bare : `${bare}/index.html`;
}

/**
 * 将一份站点定义静态导出到 out/。
 * 页面、404、theme.css/style.css、app.js、images/、sitemap.xml、robots.txt 一次产出。
 */
export function exportSite(def: SiteDefinition): void {
  const { root, site, pages, notFound, extraAssets = [], cssAliases = [], theme, themeOptions, robots = [] } = def;
  const OUT = path.join(root, 'out');
  const basePath = (process.env.BASE_PATH || '').replace(/\/$/, '');

  const env = createEnv(root, {
    site,
    basePath,
    assetVersion: String(Date.now()),
    noCache: true,
    theme,
    themeOptions,
  });

  console.log(`🚀 开始静态导出 ${site.brand.name}...\n`);

  // 输出路径守卫：扁平 .html 与目录式两种形态共存后，两类冲突会静默产出错误的站点结构。
  // 其一，两个页面写到同一个文件（后者覆盖前者，页面凭空消失）。
  // 其二，/foo 与 /foo.html 并存：nginx 的 try_files $uri $uri/ 会让两个 URL 都返回
  // 不同内容，是搜索引擎眼里的重复内容——而这次迁移的全部目的就是 SEO。
  // 前置到 rm -rf out/ 之前：守卫只读内存里的 pages、不碰文件系统，本可免费前置；
  // 放在 rm 之后，throw 时 out/ 已被清空，本地预览会看到站点「消失」而不是停在旧版本。
  const outputPaths = new Map<string, string>();
  const urlStems = new Map<string, string>();
  for (const p of pages) {
    const rel = resolveOutputRel(p.path);
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

  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
  ensureDir(OUT);

  // 1. 页面
  for (const p of pages) {
    const html = env.render(resolveTemplate(p.template, p.page, env, theme), { page: p.page, ...(p.locals || {}) });
    const rel = resolveOutputRel(p.path);
    const file = path.join(OUT, rel);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, html);
    console.log(`  ✅ ${p.path} → out/${rel}`);
  }

  // 2. 404
  const html404 = env.render(resolveTemplate(notFound.template, notFound.page, env, theme), {
    page: notFound.page,
    ...(notFound.locals || {}),
  });
  fs.writeFileSync(path.join(OUT, '404.html'), html404);
  console.log('  ✅ 404.html');

  // 3. sitemap + robots
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), generateSitemap(site.baseUrl, pages));
  fs.writeFileSync(path.join(OUT, 'robots.txt'), generateRobots(site.baseUrl, robots));
  console.log('  ✅ sitemap.xml + robots.txt');

  // 4. 样式：先主题 theme.css，再站点 style.css（子主题覆盖，<head> 顺序在后者）
  if (theme) {
    fs.copyFileSync(path.join(theme.dir, theme.css), path.join(OUT, 'theme.css'));
    console.log('  ✅ theme.css');
    // 兼容别名：把 theme.css 再复制成旧缓存 HTML 引用的资源名（如 style.css）
    for (const alias of cssAliases) {
      fs.copyFileSync(path.join(theme.dir, theme.css), path.join(OUT, alias));
      console.log(`  ✅ ${alias}（theme.css 别名）`);
    }
  }
  const siteCss = path.join(root, 'style.css');
  if (fs.existsSync(siteCss)) {
    fs.copyFileSync(siteCss, path.join(OUT, 'style.css'));
    console.log('  ✅ style.css');
  }

  // 5. 客户端 JS：站点 public/app.js 覆盖主题 clientJs
  const siteJs = path.join(root, 'public', 'app.js');
  const themeJs = theme?.clientJs ? path.join(theme.dir, theme.clientJs) : null;
  const jsSrc = fs.existsSync(siteJs) ? siteJs : themeJs;
  if (jsSrc && fs.existsSync(jsSrc)) {
    fs.copyFileSync(jsSrc, path.join(OUT, 'app.js'));
    console.log('  ✅ app.js');
  } else {
    console.warn('  ⚠️  未找到 app.js（先构建主题 client 或站点 build:client）。');
  }

  // 6. 图片
  const images = path.join(root, 'images');
  if (fs.existsSync(images)) {
    copyDir(images, path.join(OUT, 'images'));
    console.log('  ✅ images/');
  }

  // 7. 额外资源
  for (const rel of extraAssets) {
    const src = path.join(root, rel);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(OUT, path.basename(rel)));
      console.log(`  ✅ ${rel}`);
    }
  }

  console.log(`\n🎉 导出完成！${OUT}\n`);
}
