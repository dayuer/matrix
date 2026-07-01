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
 * 将一份站点定义静态导出到 out/。
 * 页面、404、theme.css/style.css、app.js、images/、sitemap.xml、robots.txt 一次产出。
 */
export function exportSite(def: SiteDefinition): void {
  const { root, site, pages, notFound, extraAssets = [], theme, themeOptions } = def;
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

  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
  ensureDir(OUT);

  // 1. 页面
  for (const p of pages) {
    const html = env.render(resolveTemplate(p.template, p.page, env, theme), { page: p.page, ...(p.locals || {}) });
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

  // 2. 404
  const html404 = env.render(resolveTemplate(notFound.template, notFound.page, env, theme), {
    page: notFound.page,
    ...(notFound.locals || {}),
  });
  fs.writeFileSync(path.join(OUT, '404.html'), html404);
  console.log('  ✅ 404.html');

  // 3. sitemap + robots
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), generateSitemap(site.baseUrl, pages));
  fs.writeFileSync(path.join(OUT, 'robots.txt'), generateRobots(site.baseUrl));
  console.log('  ✅ sitemap.xml + robots.txt');

  // 4. 样式：先主题 theme.css，再站点 style.css（子主题覆盖，<head> 顺序在后者）
  if (theme) {
    fs.copyFileSync(path.join(theme.dir, theme.css), path.join(OUT, 'theme.css'));
    console.log('  ✅ theme.css');
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
