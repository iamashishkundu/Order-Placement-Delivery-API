const path = require('path');
const dotenv = require('dotenv');
const { spawnSync } = require('child_process');

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder_secret';
const collectionPath = path.resolve(__dirname, '../postman/payment.collection.json');
const environmentPath = path.resolve(__dirname, '../postman/payment.environment.json');
const reportPath = path.resolve(__dirname, '../postman/reports/payment-report.html');

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = [
  'newman',
  'run',
  `"${collectionPath}"`,
  '-e',
  `"${environmentPath}"`,
  '--env-var',
  `stripeWebhookSecret=${secret}`,
  '--folder',
  'P0-Setup',
  '--folder',
  'P1-Online-Order-Creation',
  '--folder',
  'P2-Synthetic-Webhooks',
  '--folder',
  'P3-Concurrency',
  '--folder',
  'P4-COD-Regression',
  '--folder',
  'P5-Result-Pages',
  '-r',
  'cli,htmlextra',
  '--reporter-htmlextra-export',
  `"${reportPath}"`,
];

console.log('Running automated Stripe payment test suite via Newman...');
const result = spawnSync(npxCmd, args, { stdio: 'inherit', shell: true });
if (result.error) {
  console.error('Failed to run Newman:', result.error);
  process.exit(1);
}
process.exit(result.status || 0);
