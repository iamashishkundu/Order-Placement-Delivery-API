require('dotenv').config();
const { spawn } = require('child_process');

const apiKey = process.env.STRIPE_SECRET_KEY;
if (!apiKey) {
  console.error('\n❌ Error: STRIPE_SECRET_KEY is not defined in your .env file.');
  process.exit(1);
}

console.log('\n======================================================');
console.log('⚡ Starting Stripe CLI Webhook Forwarder...');
console.log('Forwarding to: http://localhost:5000/api/v1/webhooks/stripe');
console.log('Using API Key: ' + apiKey.slice(0, 14) + '...' + apiKey.slice(-6));
console.log('======================================================\n');

const child = spawn(
  'stripe',
  [
    'listen',
    '--api-key', apiKey,
    '--forward-to', 'localhost:5000/api/v1/webhooks/stripe',
    '--events', 'checkout.session.completed,checkout.session.expired,charge.refunded,charge.dispute.created,charge.dispute.closed'
  ],
  { shell: true, stdio: 'inherit' }
);

child.on('error', (err) => {
  console.error('\n❌ Failed to launch Stripe CLI:', err.message);
  console.error('Make sure "stripe" is installed and available in your system PATH.\n');
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\nStripe CLI exited with code ${code}.`);
  }
});

