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
 * 不单独剥 <svg>：样机插图的 <text> 节点是真实产品文案，通用标签剥离会保留其文本。
 *
 * ancestors 是环检测：YAML 锚点/别名（&a / *a）能构造出循环引用，js-yaml 会如实
 * 还原成循环的对象图，无保护的递归会以 RangeError 崩掉整个 export --all 批次。
 * 只记录「当前路径上的祖先」而非「所有访问过的对象」——别名的正常用途是**复用**
 * （多处引用同一片段），那种情况必须照常收集，只有指回祖先的真环才跳过。
 *
 * ⚠️ 已知取舍：NON_CONTENT_KEYS 按**键名**跳过，不区分层级。若某个 block 的 data 里
 * 合法地有一个叫 type / variant / target / icon 的**内容**字段（如「会议类型：周会」），
 * 它会被静默丢掉。新增 block 时，承载文案的字段请避开这些键名。
 */
function collectText(value: unknown, out: string[], ancestors: Set<object> = new Set()): void {
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
  if (value === null || typeof value !== 'object') return;
  if (ancestors.has(value)) return; // 环：指回当前路径上的祖先，停止下钻
  ancestors.add(value);
  if (Array.isArray(value)) {
    for (const item of value) collectText(item, out, ancestors);
  } else {
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (NON_CONTENT_KEYS.has(key)) continue;
      collectText(v, out, ancestors);
    }
  }
  ancestors.delete(value); // 回溯：离开这一层后，同一对象在兄弟分支里仍可被收集
}

/** 把 block 里的文案粗剥为纯文本（只用于 llms-full.txt，不参与页面渲染）。 */
function blocksToText(page: SiteDefinition['pages'][number]): string {
  const parts: string[] = [];
  for (const block of page.page.blocks || []) collectText(block.data, parts);
  return parts.join('\n');
}

/**
 * 按 canonical 排序。用序数比较而非 localeCompare——后者的结果依赖 Node 的 ICU 构建，
 * 同一份内容在不同机器上可能排出不同顺序，让构建产物不可复现。
 */
function sortByCanonical(pages: SiteDefinition['pages']): SiteDefinition['pages'] {
  return [...pages].sort((a, b) =>
    a.page.canonical < b.page.canonical ? -1 : a.page.canonical > b.page.canonical ? 1 : 0
  );
}

export function generateLlmsTxt(def: SiteDefinition, cfg: LlmsConfig): string {
  const base = def.site.baseUrl.replace(/\/$/, '');
  const lines = [`# ${def.site.brand.name}`, ''];
  if (cfg.summary) lines.push(`> ${cfg.summary}`, '');
  lines.push('## 页面', '');
  for (const p of sortByCanonical(def.pages)) {
    lines.push(`- [${p.page.title}](${base}${p.page.canonical}): ${p.page.description}`);
  }
  lines.push('');
  return lines.join('\n');
}

export function generateLlmsFullTxt(def: SiteDefinition, cfg: LlmsConfig): string {
  const base = def.site.baseUrl.replace(/\/$/, '');
  const chunks = [`# ${def.site.brand.name}`, ''];
  if (cfg.summary) chunks.push(cfg.summary, '');
  for (const p of sortByCanonical(def.pages)) {
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
