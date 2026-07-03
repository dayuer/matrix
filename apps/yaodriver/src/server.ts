import { startServer } from '@matrix/site-kit';
import { getSiteDefinition } from './site-def';

async function main() {
  const siteDefinition = await getSiteDefinition();
  startServer(siteDefinition, 'yaodriver.com');
}

main().catch(err => {
  console.error('Failed to start yaodriver server:', err);
  process.exit(1);
});
