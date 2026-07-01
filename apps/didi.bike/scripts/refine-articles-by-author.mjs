#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { scoreArticle } from './verify-human-standard.mjs';

const DRAFTS_DIR = path.resolve('../../docs/didi.bike-drafts');
const AUTHORS_DIR = path.resolve('../../config/authors');

// Suffix to author ID mapping
const SUFFIX_MAP = {
  // Use cases
  'case-study': 'athlete',
  'field-protocol': 'mechanic',
  'data-analysis': 'analyst',
  'optimization-workflow': 'pm',
  'engineering-validation': 'physicist',
  'coaching-strategy': 'coach',
  'biomechanical-assessment': 'academic',
  'aerodynamic-profiling': 'journalist',
  'hardware-integration': 'engineer',
  'performance-evaluation': 'explorer',

  // Integrations
  'api-integration': 'engineer',
  'custom-scripting': 'athlete',
  'data-serialization': 'physicist',
  'database-architecture': 'academic',
  'performance-optimization': 'pm',
  'protocol-parsing': 'mechanic',
  'real-time-streaming': 'journalist',
  'security-compliance': 'academic',
  'software-engineering': 'coach',
  'synchronization-logic': 'explorer',

  // Training & Racing
  'physiological-modeling': 'physicist',
  'training-stress-quantification': 'mechanic',
  'performance-prediction': 'journalist',
  'adaptation-mechanics': 'academic',
  'metabolic-calculation': 'academic',
  'fatigue-management': 'athlete',
  'workout-design': 'coach',
  'recovery-protocols': 'explorer',
  'statistical-analysis': 'analyst',
  'real-time-monitoring': 'engineer',

  // Sensor Telemetry
  'hardware-architecture': 'analyst',
  'firmware-optimization': 'engineer',
  'signal-noise-mitigation': 'explorer',
  'calibration-algorithm': 'physicist',
  'data-integrity-check': 'mechanic',
  'latency-assessment': 'pm',
  'power-management': 'journalist',
  'protocol-analysis': 'mechanic',
  'dynamic-response': 'athlete',
  'sensor-fusion': 'physicist',

  // Aerodynamics / Power / Bike fitting
  'sensitivity-analysis': 'analyst',
  'calibration-protocol': 'mechanic',
  'mathematical-derivation': 'physicist',
  'physiological-cost': 'academic',
  'cfd-simulation': 'engineer',
  'wind-tunnel-validation': 'academic',
  'real-world-field-testing': 'athlete',
  'error-propagation': 'physicist',
  'temperature-compensation': 'explorer'
};

function getAuthorIdForFile(filename) {
  const parts = filename.replace(/\.md$/, '').split('-');
  
  // Find the longest matching suffix
  for (let i = 1; i < parts.length; i++) {
    const suffix = parts.slice(i).join('-');
    if (SUFFIX_MAP[suffix]) {
      return SUFFIX_MAP[suffix];
    }
  }

  // Default fallback based on index/hash to distribute evenly
  const authorIds = ['physicist', 'coach', 'mechanic', 'analyst', 'athlete', 'journalist', 'pm', 'explorer', 'engineer', 'academic'];
  const hash = filename.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return authorIds[hash % authorIds.length];
}

async function loadAuthorProfile(authorId) {
  const filePath = path.join(AUTHORS_DIR, `${authorId}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to load author profile for '${authorId}': ${err.message}`);
  }
}

async function generatePrompt(filename) {
  const filePath = path.join(DRAFTS_DIR, filename);
  const raw = await fs.readFile(filePath, 'utf8');
  const { data, content } = matter(raw);
  
  const authorId = getAuthorIdForFile(filename);
  const author = await loadAuthorProfile(authorId);

  const prompt = `You are ${author.name}, a ${author.bio}.
Your task is to completely rewrite the blog article titled "${data.title || filename}" to match your unique voice and writing standard.

--- WRITING PERSONA AND STYLE GUIDELINES ---
- TONE: ${author.tone}
- STRUCTURE: ${author.structure}
- PREFERRED PHRASES: ${author.preferredPhrases.join(', ')}
- FORMATTING RULES:
  * Subheadings: ${author.formatting.subheadingStyle}
  * LaTeX Equations: ${author.formatting.equationUsage}
  * Tables: ${author.formatting.tableUsage}

--- CRITICAL SAFETY AND QUALITY RULES ---
1. ABSOLUTELY PRESERVE all LaTeX equations (delimiters $$ and \\( \\) ) exactly as they are. Do not translate or modify math symbols.
2. ABSOLUTELY PRESERVE all data tables and their numerical values.
3. ABSOLUTELY PRESERVE the exact References section at the end of the article.
4. DO NOT use these AI cliches: ${author.tabooWords.join(', ')}.
5. DO NOT start the body H1 or paragraphs with "Understanding X through Y" or similar template headings. Create an engaging, narrative title.
6. Rewrite the frontmatter fields as well (title, metaTitle, metaDescription, faqJson) to fit the persona:
   - title/metaTitle: Concise, specific, engaging, under 60 chars.
   - metaDescription: Concise, 120-155 characters, including keywords, no template boilerplate.
   - faqJson: Customize questions and answers based on the rewritten body.

--- ORIGINAL ARTICLE CONTENT ---
${raw}

--- OUTPUT FORMAT ---
Output the completely rewritten article in Markdown format with the YAML frontmatter intact. Do not output any conversational introduction or explanation; output ONLY the final modified file content starting with "---" and ending with the references.`;

  return prompt;
}

async function listFiles() {
  const files = (await fs.readdir(DRAFTS_DIR))
    .filter((f) => f.endsWith('.md') && f !== 'redundancy_report.md' && f !== 'tmp-ai-report.txt')
    .sort();

  console.log('File Name | Mapped Author | Current Score');
  console.log('---|---|---');
  for (const file of files) {
    const authorId = getAuthorIdForFile(file);
    const content = await fs.readFile(path.join(DRAFTS_DIR, file), 'utf8');
    const { score } = scoreArticle(content, file);
    console.log(`${file} | ${authorId} | ${score}/100`);
  }
}

async function saveFile(filename, refinedContent) {
  const filePath = path.join(DRAFTS_DIR, filename);
  
  // Basic validation on the refined content
  const result = scoreArticle(refinedContent, filename);
  if (result.score < 90) {
    console.warn(`⚠️ Warning: Refined content scored ${result.score}/100. Deductions:`);
    result.deductions.forEach(d => console.warn(`  - ${d}`));
  }

  await fs.writeFile(filePath, refinedContent, 'utf8');
  console.log(`✅ Successfully saved and verified: ${filename} (Score: ${result.score}/100)`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const targetFile = args[1];

  if (command === '--list') {
    await listFiles();
  } else if (command === '--prompt' && targetFile) {
    const prompt = await generatePrompt(targetFile);
    console.log(prompt);
  } else if (command === '--save' && targetFile) {
    // Read from stdin
    let data = '';
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) {
      data += chunk;
    }
    await saveFile(targetFile, data);
  } else {
    console.log(`Usage:
  node scripts/refine-articles-by-author.mjs --list
  node scripts/refine-articles-by-author.mjs --prompt <filename>
  node scripts/refine-articles-by-author.mjs --save <filename> < refined_file.md`);
  }
}

main().catch(console.error);
