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
