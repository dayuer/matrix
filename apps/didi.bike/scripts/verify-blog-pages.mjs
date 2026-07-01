import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const DRAFTS_DIR = path.resolve('../../docs/didi.bike-drafts');
const DEFAULT_HOST = 'https://didi.bike';


const CONCURRENCY_LIMIT = 30;

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD', 
      headers: { 'User-Agent': 'DIDI-BIKE-Verify-Crawler/1.0' }
    });
    return { url, ok: res.ok, status: res.status };
  } catch (err) {
    return { url, ok: false, status: err.message };
  }
}

async function asyncPool(limit, array, fn) {
  const ret = [];
  const executing = new Set();
  for (const item of array) {
    const p = Promise.resolve().then(() => fn(item));
    ret.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

async function main() {
  const host = process.argv[2] || DEFAULT_HOST;
  console.log(`Starting blog verification crawl on host: ${host}`);

  if (!fs.existsSync(DRAFTS_DIR)) {
    console.error(`Error: Directory not found: ${DRAFTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DRAFTS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'redundancy_report.md')
    .sort();

  console.log(`Total draft files found: ${files.length}`);

  const targets = [];
  for (const file of files) {
    const filePath = path.join(DRAFTS_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(raw);
    
    const slug = data.slug || path.basename(file, '.md');
    const locale = data.locale || 'en';
    
    const targetUrl = `${host}/${locale}/blog/${slug}`;
    targets.push({ file, slug, locale, url: targetUrl });
  }

  console.log(`Prepared ${targets.length} target URLs to verify.`);

  const start = Date.now();
  const results = await asyncPool(CONCURRENCY_LIMIT, targets, async (t) => {
    const checkResult = await checkUrl(t.url);
    return { ...t, ...checkResult };
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);

  const passed = results.filter(r => r.ok && r.status === 200);
  const failed = results.filter(r => !r.ok || r.status !== 200);

  console.log('\n=================== VERIFICATION REPORT ===================');
  console.log(`Completed in ${elapsed} seconds.`);
  console.log(`Total URLs Checked : ${results.length}`);
  console.log(`Passed (200 OK)    : ${passed.length}`);
  console.log(`Failed (Error/404) : ${failed.length}`);
  console.log('===========================================================');

  if (failed.length > 0) {
    console.error('\n✗ The following pages failed to render/load correctly:');
    failed.forEach(f => {
      console.error(`  - File  : ${f.file}`);
      console.error(`    URL   : ${f.url}`);
      console.error(`    Status: ${f.status}\n`);
    });
    process.exit(1);
  } else {
    console.log('\n✓ All blog pages verified successfully! No 404 or compilation errors found.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error during validation:', err);
  process.exit(1);
});
