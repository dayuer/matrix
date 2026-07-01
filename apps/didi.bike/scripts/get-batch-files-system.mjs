#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const DRAFTS_DIR = path.resolve('../../docs/didi.bike-drafts');

async function main() {
  const args = process.argv.slice(2);
  const type = args[0]; // 'half' or 'template'
  const batchIndex = parseInt(args[1] || '0', 10);
  const batchSize = parseInt(args[2] || '25', 10);

  const files = (await fs.readdir(DRAFTS_DIR))
    .filter((f) => f.endsWith('.md') && f !== 'redundancy_report.md' && f !== 'tmp-ai-report.txt')
    .sort();

  const halfRewritten = [];
  const pureTemplate = [];

  for (const file of files) {
    const rawContent = await fs.readFile(path.join(DRAFTS_DIR, file), 'utf8');
    const hasTemplateBody = rawContent.includes('# Understanding ') && rawContent.includes(' through ');
    const hasTemplateMeta = rawContent.includes('Deep-dive study on');

    if (hasTemplateBody) {
      pureTemplate.push(file);
    } else if (hasTemplateMeta) {
      halfRewritten.push(file);
    }
  }

  let targetList = [];
  if (type === 'half') {
    targetList = halfRewritten;
  } else if (type === 'template') {
    targetList = pureTemplate;
  } else {
    console.log(JSON.stringify({
      halfCount: halfRewritten.length,
      templateCount: pureTemplate.length,
      totalCount: halfRewritten.length + pureTemplate.length
    }, null, 2));
    return;
  }

  const start = batchIndex * batchSize;
  const end = Math.min(start + batchSize, targetList.length);
  const batch = targetList.slice(start, end);

  console.log(JSON.stringify({
    type,
    batchIndex,
    batchSize,
    totalFiles: targetList.length,
    start,
    end,
    files: batch
  }, null, 2));
}

main().catch(console.error);
