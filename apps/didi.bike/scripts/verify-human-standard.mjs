#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const DRAFTS_DIR = path.resolve('../../docs/didi.bike-drafts');

const CLICHES = [
  { pattern: /important to remember/i, name: 'important to remember' },
  { pattern: /the era of .* is over/i, name: 'the era of ... is over' },
  { pattern: /let's dive in/i, name: "let's dive in" },
  { pattern: /look no further/i, name: 'look no further' },
  { pattern: /game-changer/i, name: 'game-changer' },
  { pattern: /game-changing/i, name: 'game-changing' },
  { pattern: /revolutionize/i, name: 'revolutionize' },
  { pattern: /revolutionizing/i, name: 'revolutionizing' },
  { pattern: /as we navigate/i, name: 'as we navigate' },
  { pattern: /in summary/i, name: 'in summary' },
  { pattern: /to conclude/i, name: 'to conclude' },
  { pattern: /ultimately/i, name: 'ultimately' },
  { pattern: /we will explore/i, name: 'we will explore' },
  { pattern: /we'll explore/i, name: "we'll explore" },
  { pattern: /crucial/i, name: 'crucial' },
  { pattern: /vital/i, name: 'vital' },
  { pattern: /essential/i, name: 'essential' },
  { pattern: /this guide.*explains/i, name: 'this guide ... explains' },
  { pattern: /this guide.*covers/i, name: 'this guide ... covers' },
  { pattern: /in this section/i, name: 'in this section' }
];

const TRANSITIONS = [
  /furthermore/i, /moreover/i, /additionally/i, /in conclusion/i, /consequently/i, /therefore/i
];

function analyzeSentences(body) {
  const sentences = body
    .replace(/\$\$[\s\S]+?\$\$/g, '') // strip math blocks
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  if (sentences.length === 0) return { mean: 0, stdDev: 0 };

  const wordCounts = sentences.map(s => s.split(/\s+/).length);
  const sum = wordCounts.reduce((a, b) => a + b, 0);
  const mean = sum / wordCounts.length;

  const sqDiffs = wordCounts.map(count => Math.pow(count - mean, 2));
  const avgSqDiff = sqDiffs.reduce((a, b) => a + b, 0) / sqDiffs.length;
  const stdDev = Math.sqrt(avgSqDiff);

  return { mean, stdDev, count: sentences.length };
}

function analyzeVocabulary(body) {
  const words = body
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1);

  if (words.length === 0) return 0;
  const uniqueWords = new Set(words);
  return uniqueWords.size / words.length; // Type-Token Ratio
}

export function scoreArticle(rawContent, filename) {
  let score = 100;
  const deductions = [];
  const metrics = {};

  let parsed;
  try {
    parsed = matter(rawContent);
  } catch (err) {
    return {
      score: 0,
      deductions: [`Failed to parse YAML frontmatter: ${err.message}`],
      metrics: {}
    };
  }

  const { data, content } = parsed;
  const lines = content.split('\n');

  // 1. AI Clichés Check (Max 30 points)
  let clicheHits = 0;
  CLICHES.forEach(cliche => {
    let hits = 0;
    if (data.title && cliche.pattern.test(data.title)) hits++;
    if (data.metaDescription && cliche.pattern.test(data.metaDescription)) hits++;
    content.split('\n').forEach((line, idx) => {
      if (cliche.pattern.test(line)) {
        hits++;
        deductions.push(`Body line ${idx + 1}: Found AI cliché phrase "${cliche.name}"`);
      }
    });

    if (hits > 0) {
      clicheHits += hits;
    }
  });
  const clicheDeduction = Math.min(30, clicheHits * 5);
  if (clicheDeduction > 0) {
    score -= clicheDeduction;
    deductions.push(`AI Clichés: Deducted ${clicheDeduction} points for ${clicheHits} cliché occurrences.`);
  }

  // 2. Template Patterns (Max 20 points)
  let templateHits = 0;
  if (data.title && data.title.includes('Understanding') && data.title.includes('through')) {
    templateHits++;
    deductions.push('YAML Title: Matches template pattern "Understanding X through Y"');
  }
  if (data.metaDescription && data.metaDescription.startsWith('Deep-dive study on')) {
    templateHits++;
    deductions.push('YAML MetaDescription: Matches template pattern "Deep-dive study on..."');
  }
  if (data.faqJson && data.faqJson.some(faq => faq.answer && faq.answer.includes('The case study highlights the practical impact of telemetry'))) {
    templateHits++;
    deductions.push('YAML FAQ: Contains generic template answer');
  }
  const firstLine = lines.find(l => l.trim().startsWith('# '));
  if (firstLine && firstLine.includes('Understanding') && firstLine.includes('through')) {
    templateHits++;
    deductions.push('Body H1: Matches template pattern "Understanding X through Y"');
  }
  const templateDeduction = templateHits * 5;
  if (templateDeduction > 0) {
    score -= templateDeduction;
    deductions.push(`Template Patterns: Deducted ${templateDeduction} points for template patterns.`);
  }

  // 3. Length & Structure (Max 15 points)
  const totalLines = rawContent.split('\n').length;
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  metrics.wordCount = wordCount;
  metrics.totalLines = totalLines;

  if (totalLines < 45) {
    score -= 10;
    deductions.push(`Length: File too short (${totalLines} lines total, expected >= 45)`);
  }
  if (wordCount < 400) {
    score -= 5;
    deductions.push(`Length: Body content word count too low (${wordCount} words, expected >= 400)`);
  }

  // 4. Vocabulary Diversity (Max 15 points)
  const ttr = analyzeVocabulary(content);
  metrics.ttr = ttr;
  if (ttr < 0.35) {
    score -= 15;
    deductions.push(`Vocabulary: Low lexical diversity (TTR: ${(ttr * 100).toFixed(1)}%, expected >= 40%)`);
  } else if (ttr < 0.40) {
    score -= 8;
    deductions.push(`Vocabulary: Moderate lexical diversity (TTR: ${(ttr * 100).toFixed(1)}%, expected >= 40%)`);
  }

  // 5. Sentence Length Variation (Max 10 points)
  const sentenceStats = analyzeSentences(content);
  metrics.sentenceCount = sentenceStats.count || 0;
  metrics.sentenceLengthMean = sentenceStats.mean || 0;
  metrics.sentenceLengthStdDev = sentenceStats.stdDev || 0;

  if (sentenceStats.count > 3) {
    if (sentenceStats.stdDev < 2.5) {
      score -= 10;
      deductions.push(`Sentence Variance: Flat sentence length standard deviation (${sentenceStats.stdDev.toFixed(1)} words, expected >= 4.0)`);
    } else if (sentenceStats.stdDev < 4.0) {
      score -= 5;
      deductions.push(`Sentence Variance: Low sentence length standard deviation (${sentenceStats.stdDev.toFixed(1)} words, expected >= 4.0)`);
    }
  }

  // 6. Transition Word Excess (Max 5 points)
  let transitionHits = 0;
  TRANSITIONS.forEach(regex => {
    const hits = (content.match(regex) || []).length;
    transitionHits += hits;
  });
  if (transitionHits > 8) {
    score -= 5;
    deductions.push(`Transitions: Excess transition words (${transitionHits} found, indicating AI structure)`);
  }

  // 7. LaTeX Delimiters Check (Max 5 points)
  const openDollars = (rawContent.match(/\$\$/g) || []).length;
  if (openDollars % 2 !== 0) {
    score -= 5;
    deductions.push('Formatting: Mismatched display math ($$) delimiters');
  }

  return {
    score: Math.max(0, score),
    deductions,
    metrics
  };
}

async function main() {
  const args = process.argv.slice(2);
  const sampleOnly = args.includes('--sample');

  let files = (await fs.readdir(DRAFTS_DIR))
    .filter((f) => f.endsWith('.md') && f !== 'redundancy_report.md' && f !== 'tmp-ai-report.txt')
    .sort();

  if (sampleOnly) {
    const sampleFiles = [
      '906-use-cases-elite-triathletes-aero-testing-case-study.md',
      '907-use-cases-elite-triathletes-aero-testing-field-protocol.md',
      '908-use-cases-elite-triathletes-aero-testing-data-analysis.md',
      '909-use-cases-elite-triathletes-aero-testing-optimization-workflow.md',
      '910-use-cases-elite-triathletes-aero-testing-engineering-validation.md',
      '911-use-cases-elite-triathletes-aero-testing-coaching-strategy.md',
      '912-use-cases-elite-triathletes-aero-testing-biomechanical-assessment.md',
      '913-use-cases-elite-triathletes-aero-testing-aerodynamic-profiling.md',
      '914-use-cases-elite-triathletes-aero-testing-hardware-integration.md',
      '915-use-cases-elite-triathletes-aero-testing-performance-evaluation.md'
    ];


    files = files.filter(f => sampleFiles.includes(f));
    console.log(`Running quality verification on sample of ${files.length} pilot files...\n`);
  } else {
    console.log(`Running quality verification on all ${files.length} draft files...\n`);
  }

  let totalScore = 0;
  let failCount = 0;
  const reports = [];

  for (const file of files) {
    const filePath = path.join(DRAFTS_DIR, file);
    const content = await fs.readFile(filePath, 'utf8');
    const result = scoreArticle(content, file);

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

    totalScore += result.score;
    const passed = result.score >= 90;
    if (!passed) failCount++;


    reports.push({
      file,
      score: result.score,
      passed,
      deductions: result.deductions,
      metrics: result.metrics
    });
  }

  reports.sort((a, b) => a.score - b.score);
  reports.forEach(r => {
    if (!r.passed) {
      console.log(`❌ ${r.file}: Score ${r.score}/100`);
      r.deductions.forEach(d => console.log(`   - ${d}`));
    } else {
      console.log(`✅ ${r.file}: Score ${r.score}/100`);
    }
  });

  const avgScore = files.length > 0 ? (totalScore / files.length).toFixed(1) : 0;
  console.log('\n======================================');
  console.log(`Verification Summary:`);
  console.log(`Total Files Checked: ${files.length}`);
  console.log(`Average Score: ${avgScore}/100`);
  console.log(`Passed (>= 90): ${files.length - failCount}`);
  console.log(`Failed (< 90): ${failCount}`);
  console.log('======================================');

  if (failCount > 0 && sampleOnly) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
