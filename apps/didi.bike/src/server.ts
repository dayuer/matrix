import { startServer } from '@matrix/site-kit';
import { getSiteDefinition } from './site-def';

async function main() {
  const siteDefinition = await getSiteDefinition();
  startServer(siteDefinition, 'didi.bike');
}

main().catch(err => {
  console.error('Failed to start didi.bike server:', err);
  process.exit(1);
});
