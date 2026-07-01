#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const DRAFTS_DIR = path.resolve('docs/edaijia-drafts');
const AUTHORS_DIR = path.resolve('config/authors');

async function main() {
  console.log('🔍 [didi-matrix] 启动 edaijia 内容矩阵文章质检流水线...');
  
  let files;
  try {
    const all = await readdir(DRAFTS_DIR);
    files = all
      .filter((f) => f.endsWith('.md') && f !== 'sample-article.md' && f !== 'redundancy_report.md')
      .map((f) => path.join(DRAFTS_DIR, f));
  } catch (err) {
    console.error(`✗ 读取草稿目录失败: ${err.message}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.log('⚠️ 未在 docs/edaijia-drafts 中找到待发布的文章草稿。');
    return;
  }

  let failed = false;

  for (const file of files) {
    const filename = path.basename(file);
    console.log(`\n📄 正在审计文章: ${filename}`);
    
    try {
      const raw = await readFile(file, 'utf8');
      const { data, content } = matter(raw);

      const deductions = [];

      // 1. 验证 YAML 元数据完整性
      const requiredFields = ['title', 'slug', 'locale', 'author', 'cluster', 'publishedAt', 'excerpt'];
      for (const field of requiredFields) {
        if (!data[field]) {
          deductions.push(`YAML 头部缺失必要字段: "${field}"`);
        }
      }

      // 2. 验证作者配置是否存在 (EEAT)
      if (data.author) {
        const authorConfigPath = path.join(AUTHORS_DIR, `${data.author}.json`);
        if (!existsSync(authorConfigPath)) {
          deductions.push(`关联的作者画像不存在: "config/authors/${data.author}.json"`);
        }
      }

      // 3. 验证 GEO 规范 (摘要前置与结论加粗)
      const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const bodyLines = lines.filter(l => !l.startsWith('#')); // 排除 H1/H2
      const firstParagraph = bodyLines[0] || '';
      
      if (!firstParagraph.includes('**')) {
        deductions.push('GEO 校验失败: 文章首段未对核心结论进行 **加粗** 显示，不利于 AI 搜索引擎抓取');
      }

      // 4. 验证 GEO 规范 (表格结构)
      const hasTable = content.includes('|') && content.includes('---');
      if (!hasTable) {
        deductions.push('GEO 校验失败: 文章未包含 Markdown 结构化对照表格，不利于结构化数据抓取');
      }

      // 5. 校验敏感词 (合规质检)
      const sensitiveWords = ['报名注册费', '兼职招募费', '注册费'];
      for (const word of sensitiveWords) {
        if (content.includes(word)) {
          deductions.push(`合规校验失败: 文章包含法务敏感词 "${word}"，可能存在预收费合规风险`);
        }
      }

      // 结果反馈
      if (deductions.length > 0) {
        console.error(`  ✗ 质检失败 (${deductions.length} 个缺陷):`);
        deductions.forEach(d => console.error(`    - ${d}`));
        failed = true;
      } else {
        console.log('  ✓ 质检通过！完全符合 SEO 和 GEO（生成式引擎优化）规范。');
      }

    } catch (err) {
      console.error(`  ✗ 解析文件失败: ${err.message}`);
      failed = true;
    }
  }

  console.log('\n---');
  if (failed) {
    console.error('✗ 质检流水线未通过，请根据以上提示修改文章后再行发布。');
    process.exit(1);
  } else {
    console.log('🎉 质检通过！所有待发布文章均符合高质量 SEO/GEO 规范与合规要求！');
  }
}

main().catch((err) => {
  console.error('Fatal error during validation:', err);
  process.exit(1);
});
