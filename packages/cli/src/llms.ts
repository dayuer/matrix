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

/**
 * 这些键是结构/链接元数据，不是文案。递归收集时跳过它们，
 * 否则 llms-full.txt 会混进 `/privacy.html`、`span-3 feature-hero accent` 这类噪音，
 * 反而稀释了给 AI 引擎看的事实密度。
 */
const NON_CONTENT_KEYS = new Set([
  'href',
  'url',
  'src',
  'id',
  'cls',
  'class',
  'type',
  'target',
  'icon',
  'variant',
]);

/**
 * 递归收集 block 数据里的文案。
 * block 的内容常嵌在数组或对象里（如 bento 卡片列表 data.cards[]、页头 data.header{}），
 * 只取 Object.values(data) 的顶层字符串会把整段内容静默丢掉——首页卖点全在卡片数组里。
 */
function collectText(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    const text = value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) out.push(text);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectText(item, out);
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (NON_CONTENT_KEYS.has(key)) continue;
      collectText(v, out);
    }
  }
}

/** 把 block 里的文案粗剥为纯文本（只用于 llms-full.txt，不参与页面渲染）。 */
function blocksToText(page: SiteDefinition['pages'][number]): string {
  const parts: string[] = [];
  for (const block of page.page.blocks || []) collectText(block.data, parts);
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
