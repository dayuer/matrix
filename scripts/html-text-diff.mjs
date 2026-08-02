#!/usr/bin/env node
/**
 * HTML 可见文本比对 —— 迁移验收工具。
 * 剥掉标签、script/style 与属性，只留可见文本与 <title>/<meta description>，
 * 用于证明「模板重写后页面说的话没变」。构建产物的 ?v= 时间戳、空白差异一律忽略。
 *
 *   node scripts/html-text-diff.mjs <基线文件> <新文件>
 *   退出码 0 = 文本一致，1 = 有差异（差异打到 stdout）
 */
import fs from 'fs';

function extract(file) {
  const raw = fs.readFileSync(file, 'utf-8');
  const title = (raw.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1].trim();
  const desc = (raw.match(/<meta\s+name="description"\s+content="([\s\S]*?)"/i) || [, ''])[1].trim();
  const body = (raw.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, raw])[1];
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .split('\n')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return [`TITLE: ${title}`, `DESC: ${desc}`, ...text];
}

const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error('用法：node scripts/html-text-diff.mjs <基线文件> <新文件>');
  process.exit(2);
}
const la = extract(a);
const lb = extract(b);
const setB = new Set(lb);
const setA = new Set(la);
const onlyA = la.filter((l) => !setB.has(l));
const onlyB = lb.filter((l) => !setA.has(l));

if (onlyA.length === 0 && onlyB.length === 0) {
  console.log(`✅ 文本一致：${a} ≡ ${b}（${la.length} 段）`);
  process.exit(0);
}
console.log(`❌ 文本有差异：${a} vs ${b}`);
for (const l of onlyA) console.log(`  - 仅基线有: ${l}`);
for (const l of onlyB) console.log(`  + 仅新版有: ${l}`);
process.exit(1);
