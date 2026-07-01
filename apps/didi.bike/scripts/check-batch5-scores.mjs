import fs from 'node:fs/promises';
import path from 'node:path';
import { scoreArticle } from './verify-human-standard.mjs';

const files = [
  "429-bike-fitting-crank-length-biomechanical-assessment.md",
  "430-bike-fitting-crank-length-impact-on-power-transfer.md",
  "431-bike-fitting-crank-length-injury-prevention-protocol.md",
  "432-bike-fitting-crank-length-comfort-optimization.md",
  "433-bike-fitting-crank-length-motion-capture-validation.md",
  "434-bike-fitting-crank-length-static-vs-dynamic-analysis.md",
  "435-bike-fitting-crank-length-force-vector-alignment.md",
  "436-bike-fitting-crank-length-pressure-mapping-evaluation.md",
  "437-power-pedaling-strain-gauge-wheatstone-bridge-mathematical-modeling.md",
  "438-power-pedaling-strain-gauge-wheatstone-bridge-biomechanical-efficiency.md",
  "439-power-pedaling-strain-gauge-wheatstone-bridge-hardware-calibration.md",
  "440-power-pedaling-strain-gauge-wheatstone-bridge-signal-processing.md",
  "441-power-pedaling-strain-gauge-wheatstone-bridge-loss-analysis.md",
  "442-power-pedaling-strain-gauge-wheatstone-bridge-optimal-delivery.md",
  "443-power-pedaling-strain-gauge-wheatstone-bridge-real-time-estimation.md",
  "444-power-pedaling-strain-gauge-wheatstone-bridge-laboratory-protocol.md",
  "445-power-pedaling-strain-gauge-wheatstone-bridge-data-interpretation.md",
  "446-power-pedaling-strain-gauge-wheatstone-bridge-computational-algorithm.md",
  "447-power-pedaling-tangential-pedal-force-mathematical-modeling.md",
  "448-power-pedaling-tangential-pedal-force-biomechanical-efficiency.md",
  "449-power-pedaling-tangential-pedal-force-hardware-calibration.md",
  "450-power-pedaling-tangential-pedal-force-signal-processing.md",
  "451-power-pedaling-tangential-pedal-force-loss-analysis.md",
  "452-power-pedaling-tangential-pedal-force-optimal-delivery.md",
  "453-power-pedaling-tangential-pedal-force-real-time-estimation.md",
  "454-power-pedaling-tangential-pedal-force-laboratory-protocol.md",
  "455-power-pedaling-tangential-pedal-force-data-interpretation.md",
  "456-power-pedaling-tangential-pedal-force-computational-algorithm.md",
  "457-power-pedaling-radial-pedal-force-mathematical-modeling.md",
  "458-power-pedaling-radial-pedal-force-biomechanical-efficiency.md"
];

async function main() {
  const draftsDir = path.resolve('../../docs/didi.bike-drafts');
  const reportsDir = path.resolve('config/persona-reports');

  let passedAll = true;
  let totalScore = 0;

  console.log("File Name | Score | Deductions");
  console.log("---|---|---");

  for (const file of files) {
    const filePath = path.join(draftsDir, file);
    let rawContent;
    try {
      rawContent = await fs.readFile(filePath, 'utf8');
    } catch (err) {
      console.log(`${file} | Not Found | ${err.message}`);
      passedAll = false;
      continue;
    }

    const result = scoreArticle(rawContent, file);

    // Apply the persona reports check just like verify-human-standard.mjs does
    const slug = file.replace(/\.md$/, '');
    const reportPath = path.join(reportsDir, `${slug}.json`);
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
      personaMessage = 'Missing persona evaluation report.';
    }

    if (!personaPassed) {
      result.score = Math.max(0, result.score - 20);
      result.deductions.push(`Reader Persona Appeal: ${personaMessage}`);
    }

    totalScore += result.score;
    const isPassed = result.score >= 90;
    if (!isPassed) passedAll = false;

    console.log(`${file} | ${result.score}/100 | ${result.deductions.join('; ') || 'None'}`);
  }

  const avg = (totalScore / files.length).toFixed(1);
  console.log(`\nAverage Score: ${avg}/100`);
  console.log(`Overall Pass: ${passedAll ? "✅ YES" : "❌ NO"}`);
}

main().catch(console.error);
