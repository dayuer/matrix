import fs from 'node:fs/promises';
import { scoreArticle } from './verify-human-standard.mjs';

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Please specify a filename');
    process.exit(1);
  }
  const content = await fs.readFile(file, 'utf8');
  const result = scoreArticle(content, file);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
