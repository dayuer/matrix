import fs from 'node:fs/promises';
import path from 'node:path';
import { scoreArticle } from './verify-human-standard.mjs';

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Please specify a filename (e.g. 168-aerodynamics-...).');
    process.exit(1);
  }
  
  const filePath = path.join('../../docs/didi.bike-drafts', file);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const result = scoreArticle(content, file);
    
    // Check persona report status
    const slug = file.replace(/\.md$/, '');
    const reportPath = path.join('config/persona-reports', `${slug}.json`);
    let personaPassed = false;
    let personaMessage = '';
    try {
      const reportRaw = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(reportRaw);
      if (report.passed) {
        personaPassed = true;
      } else {
        personaMessage = `Failed to engage at least 20% of target personas (only got ${report.passedCount}/${report.totalCount} scoring >= 80).`;
      }
    } catch (err) {
      personaMessage = 'Missing persona evaluation report. Run scripts/verify-personas.mjs --prompt & --save first.';
    }

    if (!personaPassed) {
      result.score = Math.max(0, result.score - 20);
      result.deductions.push(`Reader Persona Appeal: ${personaMessage}`);
    }

    console.log(`======================================`);
    console.log(`File: ${file}`);
    console.log(`Score: ${result.score}/100`);
    console.log(`Word Count: ${result.metrics.wordCount || 0}`);
    console.log(`TTR (Vocabulary): ${(result.metrics.ttr * 100 || 0).toFixed(1)}%`);
    console.log(`Sentence Length StdDev: ${(result.metrics.sentenceLengthStdDev || 0).toFixed(1)}`);
    console.log(`======================================`);
    if (result.deductions.length > 0) {
      console.log('Deductions:');
      result.deductions.forEach(d => console.log(` - ${d}`));
    }
  } catch (err) {
    console.error(`Error reading or scoring file: ${err.message}`);
  }
}

main().catch(console.error);
