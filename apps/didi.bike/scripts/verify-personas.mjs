#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const DRAFTS_DIR = path.resolve('../../docs/didi.bike-drafts');
const PERSONAS_DIR = path.resolve('../../config/personas');
const REPORTS_DIR = path.resolve('config/persona-reports');

// Threshold constants
const MIN_PASSING_SCORE = 80;
const PASSING_PERCENTAGE_THRESHOLD = 0.20; // 20%

async function loadPersonas() {
  try {
    const files = (await fs.readdir(PERSONAS_DIR))
      .filter(f => f.startsWith('persona_') && f.endsWith('.json'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0], 10);
        const numB = parseInt(b.match(/\d+/)[0], 10);
        return numA - numB;
      });
    
    const list = [];
    for (const file of files) {
      const content = await fs.readFile(path.join(PERSONAS_DIR, file), 'utf8');
      list.push(JSON.parse(content));
    }
    return list;
  } catch (err) {
    throw new Error(`Failed to load reader personas: ${err.message}`);
  }
}

async function getArticleSlug(filename) {
  return filename.replace(/\.md$/, '');
}

async function listArticles() {
  try {
    const files = (await fs.readdir(DRAFTS_DIR))
      .filter(f => f.endsWith('.md') && f !== 'redundancy_report.md' && f !== 'tmp-ai-report.txt')
      .sort();

    const personas = await loadPersonas();
    const totalPersonas = personas.length;
    const minPassRequired = Math.ceil(totalPersonas * PASSING_PERCENTAGE_THRESHOLD);

    console.log(`Article Evaluation List (Requires at least ${minPassRequired}/${totalPersonas} personas to score >= ${MIN_PASSING_SCORE})`);
    console.log('=' .repeat(90));
    console.log(
      String('File Name').padEnd(45) + ' | ' +
      String('Pass Ratio').padEnd(12) + ' | ' +
      String('Pass Count').padEnd(12) + ' | ' +
      String('Status')
    );
    console.log('-'.repeat(45) + '-|-' + '-'.repeat(12) + '-|-' + '-'.repeat(12) + '-|-' + '-'.repeat(10));

    for (const file of files) {
      const slug = await getArticleSlug(file);
      const reportPath = path.join(REPORTS_DIR, `${slug}.json`);
      
      let passRatioStr = 'N/A';
      let passCountStr = 'N/A';
      let status = 'UNTESTED';

      try {
        const reportRaw = await fs.readFile(reportPath, 'utf8');
        const report = JSON.parse(reportRaw);
        
        let highScores = 0;
        let count = 0;
        
        for (const [_, data] of Object.entries(report.scores || {})) {
          count++;
          if (data.score >= MIN_PASSING_SCORE) {
            highScores++;
          }
        }
        
        if (count > 0) {
          const ratio = highScores / count;
          passRatioStr = `${Math.round(ratio * 100)}%`;
          passCountStr = `${highScores}/${count}`;
          status = ratio >= PASSING_PERCENTAGE_THRESHOLD ? 'PASSED' : 'FAILED';
        }
      } catch {
        // Report file doesn't exist, leave untested
      }

      console.log(
        file.padEnd(45) + ' | ' +
        passRatioStr.padEnd(12) + ' | ' +
        passCountStr.padEnd(12) + ' | ' +
        status
      );
    }
  } catch (err) {
    console.error('Error listing articles:', err.message);
  }
}

async function generatePrompt(filename) {
  const filePath = path.join(DRAFTS_DIR, filename);
  let raw;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch (err) {
    console.error(`Error: Cannot read article ${filename}: ${err.message}`);
    process.exit(1);
  }
  
  const { data, content } = matter(raw);
  const personas = await loadPersonas();

  let prompt = `You are a group of 20 diverse target readers evaluating a bicycle blog article titled "${data.title || filename}".
Your goal is to evaluate if this article is engaging, matches your background, and satisfies your specific queries.

--- THE 20 TARGET READERS PERSONAS ---
`;

  personas.forEach(p => {
    prompt += `\n[ID: ${p.id}] Name: ${p.name}
- Demographics: Age ${p.age}, ${p.gender}, Country: ${p.country}, Ethnicity: ${p.ethnicity}, Orientation: ${p.sexualOrientation}
- Background: ${p.industry} (${p.knowledgeLevel})
- Key Interests: ${p.interests.join(', ')}
- Personal Biases: ${p.biases.join(', ')}
- Expectations: ${p.expectations.join(', ')}
`;
  });

  prompt += `
--- ARTICLE CONTENT TO EVALUATE ---
${content}

--- INSTRUCTIONS ---
Roleplay each of the 20 target readers. Provide a rating from 0 to 100 representing how appealing and useful the article is to you personally, along with 1-2 sentences of specific feedback explaining your score.
Rules:
- High scores (80-100) are reserved for articles that directly address your key interests and respect your biases/expectations.
- Moderate scores (50-79) mean the article is informative but lacks personal relevance or suffers from style clash.
- Low scores (0-49) indicate the article is irrelevant, boring, or violates your biases.

Output the result STRICTLY as a raw JSON object matching the schema below. Do not wrap the JSON in Markdown code blocks (do not use \`\`\`json) and do not provide any conversational introductions. Just return the JSON object:

{
  "scores": {
    "persona_1": { "score": 85, "reason": "Detailed reasons here..." },
    "persona_2": { "score": 60, "reason": "Detailed reasons here..." },
    ...
  }
}`;

  return prompt;
}

async function saveEvaluation(filename, resultsJson) {
  let parsed;
  try {
    parsed = JSON.parse(resultsJson.trim());
  } catch (err) {
    console.error('✗ Error: Failed to parse input as JSON. Make sure the output contains valid JSON and try again.');
    console.error(err.message);
    process.exit(1);
  }

  if (!parsed.scores || typeof parsed.scores !== 'object') {
    console.error('✗ Error: Invalid schema. The JSON must contain a "scores" object.');
    process.exit(1);
  }

  const slug = await getArticleSlug(filename);
  const personas = await loadPersonas();
  const totalPersonas = personas.length;
  
  let highScores = 0;
  const list = [];

  for (const p of personas) {
    const data = parsed.scores[p.id] || { score: 50, reason: "No score provided" };
    const score = Number(data.score);
    if (score >= MIN_PASSING_SCORE) {
      highScores++;
    }
    list.push({
      id: p.id,
      name: p.name,
      industry: p.industry,
      score,
      reason: data.reason
    });
  }

  const passRatio = highScores / totalPersonas;
  const isPassed = passRatio >= PASSING_PERCENTAGE_THRESHOLD;
  const minPassRequired = Math.ceil(totalPersonas * PASSING_PERCENTAGE_THRESHOLD);

  console.log(`\n=== READER APPEAL AUDIT REPORT FOR: ${filename} ===`);
  console.log(`Status: ${isPassed ? '✅ PASSED' : '❌ FAILED'} (${highScores}/${totalPersonas} personas scored >= ${MIN_PASSING_SCORE})`);
  console.log(`Target: At least ${minPassRequired}/${totalPersonas} (${PASSING_PERCENTAGE_THRESHOLD * 100}%) readers scoring >= ${MIN_PASSING_SCORE} required to pass.`);
  console.log('='.repeat(90));
  
  console.log(
    String('Reader Persona').padEnd(25) + ' | ' + 
    String('Industry').padEnd(30) + ' | ' + 
    String('Score').padEnd(6) + ' | ' + 
    String('Feedback')
  );
  console.log('-'.repeat(25) + '-|-' + '-'.repeat(30) + '-|-' + '-'.repeat(6) + '-|-' + '-'.repeat(22));

  list.forEach(item => {
    console.log(
      item.name.padEnd(25) + ' | ' +
      item.industry.slice(0, 30).padEnd(30) + ' | ' +
      String(item.score).padEnd(6) + ' | ' +
      item.reason
    );
  });

  console.log('='.repeat(90));
  
  if (!isPassed) {
    console.log('\n💡 Audit Recommendations for Improvement:');
    const lowRated = list.filter(i => i.score < 80).slice(0, 3);
    if (lowRated.length > 0) {
      console.log('Consider adjusting the content style to appeal to the following groups:');
      lowRated.forEach(i => {
        console.log(`- For "${i.name}" (${i.industry}, Score: ${i.score}): ${i.reason}`);
      });
    }
  } else {
    console.log('\n🎉 Congratulations! The article satisfies the reader engagement threshold.');
  }

  // Save the report
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  const reportPath = path.join(REPORTS_DIR, `${slug}.json`);
  const record = {
    evaluatedAt: new Date().toISOString(),
    filename,
    passed: isPassed,
    passRatio,
    passedCount: highScores,
    totalCount: totalPersonas,
    scores: parsed.scores
  };
  await fs.writeFile(reportPath, JSON.stringify(record, null, 2), 'utf8');
  console.log(`\nReport successfully saved to: ${path.relative(process.cwd(), reportPath)}`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const targetFile = args[1];

  if (command === '--list') {
    await listArticles();
  } else if (command === '--prompt' && targetFile) {
    const prompt = await generatePrompt(targetFile);
    console.log(prompt);
  } else if (command === '--save' && targetFile) {
    let data = '';
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) {
      data += chunk;
    }
    await saveEvaluation(targetFile, data);
  } else {
    console.log(`Usage:
  node scripts/verify-personas.mjs --list
  node scripts/verify-personas.mjs --prompt <filename>
  node scripts/verify-personas.mjs --save <filename> < result.json`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
