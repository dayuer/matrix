#!/usr/bin/env node
/**
 * HTML 可见文本比对 —— 迁移验收工具。
 * 剥掉标签、script/style 与属性，只留可见文本、<title>、<meta description>，
 * 以及 <svg> 内 <text> 节点的文案（首页手机样机 SVG 里有真实产品文案，不能当装饰丢掉）。
 * 构建产物的 ?v= 时间戳与空白差异一律忽略。
 *
 * 判定按「有序序列」比对：段落顺序变化、重复次数变化都算差异——
 * 模板重写最容易踩的坑就是循环少渲染了几次、或栏目顺序被颠倒。
 *
 *   node scripts/html-text-diff.mjs <基线文件> <新文件>
 *   退出码 0 = 文本一致，1 = 有差异（差异打到 stdout），2 = 用法错误或文件读不出来
 */
import fs from 'fs';

const ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#34;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
};

function decodeEntities(s) {
  return s.replace(/&(?:nbsp|amp|lt|gt|quot|apos|mdash|ndash|hellip|#34|#39);/g, (m) => ENTITIES[m] ?? m);
}

/** 取 <meta name="description"> 的 content，与属性顺序、引号风格无关。 */
function metaDescription(raw) {
  for (const tag of raw.match(/<meta\b[^>]*>/gi) || []) {
    if (!/\bname\s*=\s*(['"])description\1/i.test(tag)) continue;
    const m = tag.match(/\bcontent\s*=\s*(['"])([\s\S]*?)\1/i);
    if (m) return m[2].trim();
  }
  return '';
}

/** SVG 只保留 <text> 节点的文案，其余结构丢弃。 */
function svgText(svg) {
  const texts = svg.match(/<text\b[^>]*>([\s\S]*?)<\/text>/gi) || [];
  return '\n' + texts.map((t) => t.replace(/<[^>]+>/g, '')).join('\n') + '\n';
}

function extract(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf-8');
  } catch (err) {
    console.error(`读取失败：${file} —— ${err.message}`);
    process.exit(2);
  }
  const title = (raw.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1].trim();
  const desc = metaDescription(raw);
  const body = (raw.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, raw])[1];
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    // 先剥自闭合 <svg .../>：它没有子节点，剥离无损。若留给下面的非贪婪匹配，
    // 它会与后面某个真实 </svg> 配对，把两者之间的正文整段静默吞掉。
    .replace(/<svg\b[^>]*\/>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, svgText)
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map((s) => decodeEntities(s).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return [`TITLE: ${decodeEntities(title)}`, `DESC: ${decodeEntities(desc)}`, ...text];
}

const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error('用法：node scripts/html-text-diff.mjs <基线文件> <新文件>');
  process.exit(2);
}
const la = extract(a);
const lb = extract(b);

if (la.length === lb.length && la.every((l, i) => l === lb[i])) {
  console.log(`✅ 文本一致：${a} ≡ ${b}（${la.length} 段，顺序与重复次数均一致）`);
  process.exit(0);
}

console.log(`❌ 文本有差异：${a}（${la.length} 段） vs ${b}（${lb.length} 段）`);

const setA = new Set(la);
const setB = new Set(lb);
const onlyA = la.filter((l) => !setB.has(l));
const onlyB = lb.filter((l) => !setA.has(l));
for (const l of onlyA) console.log(`  - 仅基线有: ${l}`);
for (const l of onlyB) console.log(`  + 仅新版有: ${l}`);
if (onlyA.length === 0 && onlyB.length === 0) {
  console.log('  ⚠️ 用词完全相同，差异在顺序或重复次数——模板循环渲染次数或栏目顺序变了。');
}

let firstDiff = -1;
const max = Math.max(la.length, lb.length);
for (let i = 0; i < max; i++) {
  if (la[i] !== lb[i]) {
    firstDiff = i;
    break;
  }
}
if (firstDiff >= 0) {
  console.log(`  首处不一致在第 ${firstDiff + 1} 段：`);
  console.log(`    基线: ${la[firstDiff] ?? '(无)'}`);
  console.log(`    新版: ${lb[firstDiff] ?? '(无)'}`);
}
process.exit(1);
