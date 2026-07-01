import path from 'path';
import nunjucks from 'nunjucks';
import { blocksViewsDir } from '@matrix/blocks';
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

/**
 * 构建站点共享的 Nunjucks 环境。
 * 模板搜索路径优先级：app 自有 views/（子主题覆盖）> 主题 views/ > @matrix/blocks 通用 block > site-kit 内置 partials。
 */
export function createEnv(root: string, ctx: RenderContext): nunjucks.Environment {
  const searchPaths = [path.join(root, 'views')];
  if (ctx.theme) searchPaths.push(themeViewsDir(ctx.theme));
  searchPaths.push(blocksViewsDir);
  searchPaths.push(path.join(__dirname, '..', 'views'));

  const env = nunjucks.configure(searchPaths, {
    autoescape: true,
    noCache: ctx.noCache,
  });

  env.addGlobal('site', ctx.site);
  env.addGlobal('assetVersion', ctx.assetVersion);
  env.addGlobal('currentYear', new Date().getFullYear());
  env.addGlobal('basePath', ctx.basePath);
  env.addGlobal('themeTokensCss', buildTokensCss(ctx.theme, ctx.themeOptions));

  return env;
}
