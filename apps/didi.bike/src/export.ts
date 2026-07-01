/**
 * didi.bike 静态导出脚本：预渲染所有多语言页面、博客详情页面并导出为静态 HTML 物理结构。
 * 逻辑收敛在 @matrix/site-kit。
 * 用法：npx tsx src/export.ts
 */
import 'dotenv/config';
import { exportSite } from '@matrix/site-kit';
import { getSiteDefinition } from './site-def';

async function main() {
  const siteDefinition = await getSiteDefinition();
  exportSite(siteDefinition);
}

main().catch(err => {
  console.error('Static export failed for didi.bike:', err);
  process.exit(1);
});
