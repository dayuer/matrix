import fs from 'node:fs/promises';
import path from 'node:path';

const files = [
  "379-bike-fitting-cleat-rotational-float-biomechanical-assessment.md",
  "380-bike-fitting-cleat-rotational-float-impact-on-power-transfer.md",
  "381-bike-fitting-cleat-rotational-float-injury-prevention-protocol.md",
  "382-bike-fitting-cleat-rotational-float-comfort-optimization.md",
  "383-bike-fitting-cleat-rotational-float-motion-capture-validation.md",
  "384-bike-fitting-cleat-rotational-float-static-vs-dynamic-analysis.md",
  "385-bike-fitting-cleat-rotational-float-force-vector-alignment.md",
  "386-bike-fitting-cleat-rotational-float-pressure-mapping-evaluation.md",
  "387-bike-fitting-cleat-rotational-float-neuromuscular-recruitment.md",
  "388-bike-fitting-cleat-rotational-float-kinetic-chain-analysis.md"
];

async function main() {
  const draftsDir = path.resolve('../../docs/didi.bike-drafts');

  for (const file of files) {
    const filePath = path.join(draftsDir, file);
    let content = await fs.readFile(filePath, 'utf8');

    // 1. Replace "essential" with "indispensable" in 381
    if (file === "381-bike-fitting-cleat-rotational-float-injury-prevention-protocol.md") {
      content = content.replace(/\bessential\b/g, 'indispensable');
      content = content.replace(/\bEssential\b/g, 'Indispensable');
    }

    // 2. Format references to have empty lines between items
    const refHeader = '## References';
    const parts = content.split(refHeader);
    if (parts.length === 2) {
      let refBody = parts[1].trim();
      const lines = refBody.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const newRefBody = '\n' + lines.join('\n\n') + '\n';
      content = parts[0] + refHeader + '\n' + newRefBody;
    }

    await fs.writeFile(filePath, content, 'utf8');
    console.log(`Fixed and formatted ${file}`);
  }
}

main().catch(console.error);
