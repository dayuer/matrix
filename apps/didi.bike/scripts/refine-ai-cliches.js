import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DRAFTS_DIR = path.resolve('../../docs/didi.bike-drafts');


const GENERAL_RULES = [
  {
    pattern: /This guide covers\s+/gi,
    replacement: 'We analyze '
  },
  {
    pattern: /this guide covers\s+/gi,
    replacement: 'we analyze '
  },
  {
    pattern: /This guide explains\s+/gi,
    replacement: 'We break down '
  },
  {
    pattern: /this guide explains\s+/gi,
    replacement: 'we break down '
  },
  {
    pattern: /This guide defines\s+/gi,
    replacement: 'We define '
  },
  {
    pattern: /this guide defines\s+/gi,
    replacement: 'we define '
  }
];


const SPECIFIC_RULES = {
  '76-data-driven-cycling-coaching.md': [
    {
      pattern: 'While power is primary, heart rate adds crucial context:',
      replacement: 'While power is primary, heart rate provides essential physiological context:'
    }
  ],
  '10-frontal-area-cycling-drag.md': [
    {
      pattern: 'The crucial insight:',
      replacement: 'The key physical principle:'
    }
  ],
  '58-gyroscope-vs-accelerometer-cycling.md': [
    {
      pattern: 'Crucially, an accelerometer always measures',
      replacement: 'Fundamentally, an accelerometer measures'
    }
  ]
};

async function main() {
  const files = (await readdir(DRAFTS_DIR))
    .filter((f) => f.endsWith('.md') && f !== 'redundancy_report.md' && f !== 'tmp-ai-report.txt')
    .sort();

  console.log(`Processing ${files.length} draft files for De-AI-ification...`);

  let refinedCount = 0;

  for (const file of files) {
    const filePath = path.join(DRAFTS_DIR, file);
    let original = await readFile(filePath, 'utf8');
    let content = original;

    
    for (const rule of GENERAL_RULES) {
      content = content.replace(rule.pattern, rule.replacement);
    }

    
    if (SPECIFIC_RULES[file]) {
      for (const rule of SPECIFIC_RULES[file]) {
        content = content.replace(rule.pattern, rule.replacement);
      }
    }

    if (content !== original) {
      await writeFile(filePath, content, 'utf8');
      console.log(`Refined: ${file}`);
      refinedCount++;
    }
  }

  console.log(`\nSuccess: Refined ${refinedCount} out of ${files.length} files.`);
}

main().catch(console.error);
