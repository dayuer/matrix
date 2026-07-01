#!/usr/bin/env node



import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const DRAFTS_DIR = path.resolve('../../docs/didi.bike-drafts');
const DEFAULT_HOST = 'https://didi.bike';
const CONCURRENCY_LIMIT = 20;

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

async function checkUrlOnline(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'DIDI-BIKE-Metadata-Link-Verifier/1.0' }
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: err.message };
  }
}

async function main() {
  const runOnline = process.argv.includes('--online');
  const host = process.argv.find(arg => arg.startsWith('http')) || DEFAULT_HOST;

  console.log('===========================================================');
  console.log('🤖 DIDI.BIKE Technical Wiki - Metadata Internal Link Verifier');
  console.log(`Mode: Static Map Verification${runOnline ? ` + Online Verification (Host: ${host})` : ''}`);
  console.log('===========================================================');

  if (!fs.existsSync(DRAFTS_DIR)) {
    console.error(`✗ Error: Drafts directory not found: ${DRAFTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DRAFTS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'redundancy_report.md')
    .sort();

  console.log(`Parsing ${files.length} markdown draft files...`);

  
  const slugRegistry = new Set(); 
  const pillarRegistry = new Set(); 
  const parsedArticles = [];

  for (const file of files) {
    const filePath = path.join(DRAFTS_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);

    const slug = data.slug || path.basename(file, '.md');
    const locale = data.locale || 'en';
    const isPillar = !!data.isPillar;
    const pillarSlug = data.pillarSlug || '';

    const key = `${locale}:${slug}`;
    slugRegistry.add(key);
    if (isPillar) {
      pillarRegistry.add(key);
    }

    parsedArticles.push({
      file,
      slug,
      locale,
      isPillar,
      pillarSlug,
      content,
      title: data.title
    });
  }

  console.log(`✓ Map built successfully. Total unique articles: ${slugRegistry.size}`);

  
  const deadLinks = [];
  let linkedToPillarCount = 0;
  let totalSubArticles = 0;

  for (const art of parsedArticles) {
    if (art.isPillar) continue;
    totalSubArticles++;

    
    if (art.pillarSlug) {
      const targetKey = `${art.locale}:${art.pillarSlug}`;
      if (!pillarRegistry.has(targetKey)) {
        deadLinks.push({
          file: art.file,
          title: art.title,
          type: 'Pillar Connection Dead Link',
          desc: `pillarSlug "${art.pillarSlug}" does not exist as a Pillar Page in locale "${art.locale}"`
        });
      } else {
        linkedToPillarCount++;
      }
    } else {
      deadLinks.push({
        file: art.file,
        title: art.title,
        type: 'Missing Pillar Link (Orphan)',
        desc: 'This article has no pillarSlug configured, meaning it has no backlink to the parent pillar.'
      });
    }

    
    const mdLinkRegex = /\[[^\]]+\]\((?:\/([a-z]{2})\/blog\/|https?:\/\/db\.bike\/([a-z]{2})\/blog\/)([a-z0-9-]+)\)/g;
    let match;
    while ((match = mdLinkRegex.exec(art.content)) !== null) {
      const matchLocale = match[1] || match[2];
      const targetSlug = match[3];
      const targetKey = `${matchLocale}:${targetSlug}`;

      if (!slugRegistry.has(targetKey)) {
        deadLinks.push({
          file: art.file,
          title: art.title,
          type: 'Body Context Dead Link',
          desc: `In-text link points to non-existent article: "/${matchLocale}/blog/${targetSlug}"`
        });
      }
    }
  }

  
  console.log('\n=================== OFFLINE STATIC REPORT ===================');
  console.log(`Total Sub-Articles Checked   : ${totalSubArticles}`);
  console.log(`Correctly Linked to Pillar   : ${linkedToPillarCount}`);
  console.log(`Pillar Coverage Rate         : ${((linkedToPillarCount / totalSubArticles) * 100).toFixed(2)}%`);
  console.log(`Detected Map Link Issues     : ${deadLinks.length}`);
  console.log('===========================================================');

  if (deadLinks.length > 0) {
    console.error('\n✗ Static verification detected issues:');
    deadLinks.forEach(dl => {
      console.error(`  - File: ${dl.file}`);
      console.error(`    Type: ${dl.type}`);
      console.error(`    Desc: ${dl.desc}\n`);
    });
  } else {
    console.log('\n✓ Static Map Integrity Check Passed! All articles properly linked.');
  }

  
  if (runOnline) {
    console.log('\nStarting Online Links Probe (Validating URLs live)...');
    
    
    const onlineTargets = [];
    
    
    parsedArticles.filter(a => a.isPillar).forEach(a => {
      onlineTargets.push(`${host}/${a.locale}/blog/${a.slug}`);
    });
    
    
    const samples = parsedArticles.filter(a => !a.isPillar).sort(() => 0.5 - Math.random()).slice(0, 20);
    samples.forEach(a => {
      onlineTargets.push(`${host}/${a.locale}/blog/${a.slug}`);
    });

    console.log(`Prepared ${onlineTargets.length} online URLs to probe (including all Pillars + 20 samples)...`);
    
    const start = Date.now();
    const onlineResults = await asyncPool(CONCURRENCY_LIMIT, onlineTargets, async (url) => {
      const probe = await checkUrlOnline(url);
      return { url, ...probe };
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    const passed = onlineResults.filter(r => r.ok && r.status === 200);
    const failed = onlineResults.filter(r => !r.ok || r.status !== 200);

    console.log('\n=================== ONLINE PROBE REPORT ===================');
    console.log(`Completed in ${elapsed} seconds.`);
    console.log(`Total URLs Checked : ${onlineResults.length}`);
    console.log(`Passed (200 OK)    : ${passed.length}`);
    console.log(`Failed (Error/404) : ${failed.length}`);
    console.log('===========================================================');

    if (failed.length > 0) {
      console.error('\n✗ The following online URLs failed to load:');
      failed.forEach(f => {
        console.error(`  - URL: ${f.url} | Status: ${f.status}`);
      });
      process.exit(1);
    } else {
      console.log('\n✓ Online Link Validation Passed! Live pages are fully accessible.');
    }
  }

  
  if (deadLinks.length > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error during link validation:', err);
  process.exit(1);
});
