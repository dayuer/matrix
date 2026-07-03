import { exportSite } from '@matrix/site-kit';
import { getSiteDefinition } from './site-def';

async function main() {
  const siteDefinition = await getSiteDefinition();
  exportSite(siteDefinition);
}

main().catch(err => {
  console.error('Static export failed for yaodriver.com:', err);
  process.exit(1);
});
