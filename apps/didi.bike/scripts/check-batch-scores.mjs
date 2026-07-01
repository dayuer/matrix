import fs from 'node:fs/promises';
import path from 'node:path';
import { scoreArticle } from './verify-human-standard.mjs';

const DRAFTS_DIR = path.resolve('../../docs/didi.bike-drafts');

const files = [
  "369-bike-fitting-cleat-lateral-stance-biomechanical-assessment.md",
  "370-bike-fitting-cleat-lateral-stance-impact-on-power-transfer.md",
  "371-bike-fitting-cleat-lateral-stance-injury-prevention-protocol.md",
  "372-bike-fitting-cleat-lateral-stance-comfort-optimization.md",
  "373-bike-fitting-cleat-lateral-stance-motion-capture-validation.md",
  "374-bike-fitting-cleat-lateral-stance-static-vs-dynamic-analysis.md",
  "375-bike-fitting-cleat-lateral-stance-force-vector-alignment.md",
  "376-bike-fitting-cleat-lateral-stance-pressure-mapping-evaluation.md",
  "377-bike-fitting-cleat-lateral-stance-neuromuscular-recruitment.md",
  "378-bike-fitting-cleat-lateral-stance-kinetic-chain-analysis.md",
  "379-bike-fitting-cleat-rotational-float-biomechanical-assessment.md",
  "380-bike-fitting-cleat-rotational-float-impact-on-power-transfer.md",
  "381-bike-fitting-cleat-rotational-float-injury-prevention-protocol.md",
  "382-bike-fitting-cleat-rotational-float-comfort-optimization.md",
  "383-bike-fitting-cleat-rotational-float-motion-capture-validation.md",
  "384-bike-fitting-cleat-rotational-float-static-vs-dynamic-analysis.md",
  "385-bike-fitting-cleat-rotational-float-force-vector-alignment.md",
  "386-bike-fitting-cleat-rotational-float-pressure-mapping-evaluation.md",
  "387-bike-fitting-cleat-rotational-float-neuromuscular-recruitment.md",
  "388-bike-fitting-cleat-rotational-float-kinetic-chain-analysis.md",
  "389-bike-fitting-handlebar-reach-biomechanical-assessment.md",
  "390-bike-fitting-handlebar-reach-impact-on-power-transfer.md",
  "391-bike-fitting-handlebar-reach-injury-prevention-protocol.md",
  "392-bike-fitting-handlebar-reach-comfort-optimization.md",
  "393-bike-fitting-handlebar-reach-motion-capture-validation.md",
  "394-bike-fitting-handlebar-reach-static-vs-dynamic-analysis.md",
  "395-bike-fitting-handlebar-reach-force-vector-alignment.md",
  "396-bike-fitting-handlebar-reach-pressure-mapping-evaluation.md",
  "397-bike-fitting-handlebar-reach-neuromuscular-recruitment.md",
  "398-bike-fitting-handlebar-reach-kinetic-chain-analysis.md"
];

async function main() {
  console.log('File | Score | Deductions');
  console.log('---|---|---');
  let total = 0;
  let count = 0;
  for (const file of files) {
    const raw = await fs.readFile(path.join(DRAFTS_DIR, file), 'utf8');
    const result = scoreArticle(raw, file);
    
    // Check if report has passed
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
        personaMessage = `Failed personas (only got ${report.passedCount}/${report.totalCount})`;
      }
    } catch (err) {
      personaMessage = 'Missing report';
    }
    
    let finalScore = result.score;
    if (!personaPassed) {
      finalScore = Math.max(0, finalScore - 20);
      result.deductions.push(`Reader Persona Appeal: ${personaMessage}`);
    }
    
    console.log(`${file} | ${finalScore} | ${result.deductions.join('; ')}`);
    total += finalScore;
    count++;
  }
  console.log(`Average: ${total / count}`);
}

main().catch(console.error);
