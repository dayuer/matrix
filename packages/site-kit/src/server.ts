import path from 'path';
import fs from 'fs';
import express, { type Request, type Response, type Express } from 'express';
import compression from 'compression';

import { createEnv } from './render';
import { resolveTemplate } from './theme';
import { generateSitemap, generateRobots } from './sitemap';
import type { SiteDefinition } from './types';

/**
 * 用一份站点定义创建 Express 应用（开发/运行时用）。
 * 静态资源、模板路由、sitemap/robots、404、主题解析全部由 site-kit 统一处理。
 */
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
  
  const publicDir = path.join(root, 'public');
  if (fs.existsSync(publicDir)) {
    app.use('/', express.static(publicDir));
  }

  const env = createEnv(root, {
    site,
    basePath: '',
    assetVersion: String(Date.now()),
    noCache: process.env.NODE_ENV !== 'production',
    theme,
    themeOptions,
  });
  env.express(app);

  app.get('/sitemap.xml', (_req: Request, res: Response) => {
    res.type('application/xml').send(generateSitemap(site.baseUrl, pages));
  });

  app.get('/robots.txt', (_req: Request, res: Response) => {
    res.type('text/plain').send(generateRobots(site.baseUrl));
  });

  for (const p of pages) {
    app.get(p.path, (_req: Request, res: Response) => {
      res.render(resolveTemplate(p.template, p.page, env, theme), { page: p.page, ...(p.locals || {}) });
    });
  }

  app.use((_req: Request, res: Response) => {
    res
      .status(404)
      .render(resolveTemplate(notFound.template, notFound.page, env, theme), { page: notFound.page, ...(notFound.locals || {}) });
  });

  return app;
}

/** 便捷启动：createServer + listen，并打印启动日志。 */
export function startServer(def: SiteDefinition, label = def.site.brand.name): void {
  const app = createServer(def);
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`[${label}] 服务器启动成功: http://localhost:${port}`);
  });
}
