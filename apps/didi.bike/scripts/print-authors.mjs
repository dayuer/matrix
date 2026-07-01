import fs from 'node:fs/promises';
import path from 'node:path';

const AUTHORS_DIR = path.resolve('../../config/authors');

async function main() {
  const files = await fs.readdir(AUTHORS_DIR);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const content = await fs.readFile(path.join(AUTHORS_DIR, file), 'utf8');
      console.log(`=== ${file} ===`);
      console.log(content);
    }
  }
}

main().catch(console.error);
