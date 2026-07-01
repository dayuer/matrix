import { readdir, readFile, writeFile } from 'node:fs/promises';
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
  { pattern: /this guide.*explains/i, name: 'this guide ... explains' },
  { pattern: /this guide.*covers/i, name: 'this guide ... covers' },
  { pattern: /in this section/i, name: 'in this section' }
];

async function main() {
  const files = (await readdir(DRAFTS_DIR))
    .filter((f) => f.endsWith('.md') && f !== 'redundancy_report.md')
    .sort();

  console.log(`Scanning ${files.length} drafts for AI cliches...\n`);

  const globalStats = {};
  const fileStats = [];

  for (const file of files) {
    const filePath = path.join(DRAFTS_DIR, file);
    const raw = await readFile(filePath, 'utf8');
    const { content } = matter(raw);
    const lines = content.split('\n');
    const matches = [];

    lines.forEach((line, index) => {
      CLICHES.forEach((cliche) => {
        if (cliche.pattern.test(line)) {
          matches.push({ line: index + 1, text: line.trim(), name: cliche.name });
          globalStats[cliche.name] = (globalStats[cliche.name] || 0) + 1;
        }
      });
    });

    if (matches.length > 0) {
      fileStats.push({ file, count: matches.length, matches });
    }
  }

  let report = '=== DETAILED AI CLICHE REPORT ===\n\n';

  fileStats.sort((a, b) => b.count - a.count);
  fileStats.forEach((fs) => {
    report += `📄 File: ${fs.file} (${fs.count} cliches)\n`;
    fs.matches.forEach((m) => {
      report += `  Line ${m.line} [${m.name}]: "${m.text}"\n`;
    });
    report += '\n';
  });

  await writeFile(path.resolve('../../docs/didi.bike-drafts/tmp-ai-report.txt'), report, 'utf8');
  console.log('Report successfully generated at ../../docs/didi.bike-drafts/tmp-ai-report.txt');
}

main().catch(console.error);
