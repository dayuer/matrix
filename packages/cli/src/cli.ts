#!/usr/bin/env node
/**
 * matrix —— 内容矩阵静态发布 CLI。
 *
 *   matrix list                 列出 sites/ 下所有站点
 *   matrix dev <site>           本地开发服务器（改 content 后重启生效）
 *   matrix export <site>        静态导出到 sites/<site>/out/
 *   matrix export --all         导出全部站点
 *
 * 站点 = sites/<site>/ 纯数据目录（site.yaml + content/ + images/），无需任何 node 工程。
 */
import fs from 'fs';
import path from 'path';
import { exportSite, startServer } from '@matrix/site-kit';
import { loadSite } from './load';

/** sites/ 根目录：默认相对仓库根（本包上两级），可用 MATRIX_SITES_DIR 覆盖。 */
function sitesRoot(): string {
  if (process.env.MATRIX_SITES_DIR) return path.resolve(process.env.MATRIX_SITES_DIR);
  return path.resolve(__dirname, '..', '..', '..', 'sites');
}

function listSites(): string[] {
  const root = sitesRoot();
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(root, e.name, 'site.yaml')))
    .map((e) => e.name)
    .sort();
}

function siteDir(name: string): string {
  const dir = path.join(sitesRoot(), name);
  if (!fs.existsSync(path.join(dir, 'site.yaml'))) {
    const known = listSites();
    console.error(`[matrix] 站点 "${name}" 不存在（${dir}）。`);
    if (known.length) console.error(`[matrix] 可用站点：${known.join(', ')}`);
    process.exit(1);
  }
  return dir;
}

function usage(): never {
  console.log('用法：matrix <list | dev <site> | export <site>|--all>');
  process.exit(1);
}

const [cmd, arg] = process.argv.slice(2);

switch (cmd) {
  case 'list': {
    const sites = listSites();
    if (sites.length === 0) console.log(`（${sitesRoot()} 下暂无站点）`);
    else for (const s of sites) console.log(s);
    break;
  }
  case 'dev': {
    if (!arg) usage();
    startServer(loadSite(siteDir(arg)));
    break;
  }
  case 'export': {
    if (!arg) usage();
    const targets = arg === '--all' ? listSites() : [arg];
    if (targets.length === 0) {
      console.error('[matrix] 没有可导出的站点。');
      process.exit(1);
    }
    for (const name of targets) exportSite(loadSite(siteDir(name)));
    break;
  }
  default:
    usage();
}
