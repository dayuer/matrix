#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const DRAFTS_DIR = path.resolve('../../docs/didi.bike-drafts');

async function main() {
  console.log('🔍 Checking drafts YAML syntax...');
  let files;
  try {
    const all = await readdir(DRAFTS_DIR);
    files = all
      .filter((f) => f.endsWith('.md') && f !== 'redundancy_report.md')
      .map((f) => path.join(DRAFTS_DIR, f));
  } catch (err) {
    console.error(`✗ Failed to read drafts directory: ${err.message}`);
    process.exit(1);
  }

  let failed = false;
  for (const file of files) {
    try {
      const raw = await readFile(file, 'utf8');
      matter(raw);
    } catch (err) {
      console.error(`\n✗ YAML Syntax Error in: ${path.relative(process.cwd(), file)}`);
      console.error(err.message);
      failed = true;
    }
  }

  if (failed) {
    console.error('\n✗ YAML validation failed. Please fix the syntax errors above before deploying.');
    process.exit(1);
  } else {
    console.log('✓ All YAML headers are valid!');
  }
}

main().catch((err) => {
  console.error('Fatal error during YAML validation:', err);
  process.exit(1);
});
