require('dotenv').config();
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rawArgs = process.argv.slice(2);
let mode = null;
let caseId = null;

for (const arg of rawArgs) {
  const lower = arg.toLowerCase();
  if (lower === 'setup' || lower === 'verify') {
    mode = lower;
  } else if (/^m([1-9]|10)$/i.test(arg)) {
    caseId = arg.toUpperCase();
  }
}

if (!mode || !caseId) {
  console.error('\n❌ Usage: node scripts/run-manual-case.js <setup|verify> <M1..M10>');
  console.error('Example: npm run test:payment:manual:setup -- M1');
  console.error('Example: npm run test:payment:manual:verify -- M1\n');
  process.exit(1);
}

const rootDir = path.join(__dirname, '..');
const collectionPath = path.join(rootDir, 'postman', 'payment.collection.json');
const baseEnvPath = path.join(rootDir, 'postman', 'payment.environment.json');
const runtimeEnvPath = path.join(rootDir, 'postman', 'payment.runtime.json');
const newmanBin = path.join(rootDir, 'node_modules', '.bin', 'newman');

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

// Case details dictionary for clean UI printing
const CASE_DETAILS = {
  M1: {
    title: 'Real Payment Happy Path',
    card: '4242 4242 4242 4242',
    steps: [
      'Open the Checkout URL in your browser.',
      'Enter card 4242 4242 4242 4242, any future expiry (e.g. 12/28), CVC 123, ZIP 90210.',
      'Click "Pay" and wait for redirect to success URL.',
      'Confirm terminal running "stripe listen" prints: 200 POST /api/v1/webhooks/stripe [checkout.session.completed]'
    ]
  },
  M2: {
    title: 'Declined Card Retry on Same Checkout Session',
    card: '4000 0000 0000 0002 (Decline) -> 4242 4242 4242 4242 (Success)',
    steps: [
      'Open the Checkout URL.',
      'Enter 4000 0000 0000 0002 and click Pay. Confirm inline decline message.',
      'On the same open page, replace card with 4242 4242 4242 4242 and click Pay.'
    ]
  },
  M3: {
    title: '3D Secure (3DS) Friction Flow Authentication',
    card: '4000 0000 0000 3155 (or 3184)',
    steps: [
      'Open the Checkout URL.',
      'Enter card 4000 0000 0000 3155 and click Pay.',
      'In the "Customer Authentication" popup dialog, click "Complete authentication".'
    ]
  },
  M4: {
    title: 'Abandoned Checkout Session Expiry & Stock Restoral',
    card: 'None (abandon page)',
    steps: [
      'Open the Checkout URL to reserve inventory, but do NOT pay.',
      'In a terminal, expire session: stripe checkout sessions expire <providerSessionId> (or run stale cron).',
      'Confirm Stripe CLI prints: 200 POST /api/v1/webhooks/stripe [checkout.session.expired]'
    ]
  },
  M5: {
    title: 'Customer Cancels Before Submitting Payment',
    card: 'None',
    steps: [
      'Open the Checkout URL.',
      'Click the Back / Cancel link in Stripe Checkout.',
      'Confirm redirect to STRIPE_CANCEL_URL.'
    ]
  },
  M6: {
    title: 'Customer Cancels After Paying (Automatic Full Refund)',
    card: '4242 4242 4242 4242',
    steps: [
      'Open the Checkout URL and pay with 4242 4242 4242 4242.',
      'Confirm CLI logs 200 checkout.session.completed.',
      'Customer cancels order via API before vendor begins preparing.'
    ]
  },
  M7: {
    title: 'Refund Initiated From Stripe Dashboard',
    card: '4242 4242 4242 4242',
    steps: [
      'Open Checkout URL and pay with 4242 4242 4242 4242.',
      'Go to Stripe Dashboard -> Payments (in test mode). Click payment -> Refund full amount.',
      'Confirm Stripe CLI prints: 200 POST /api/v1/webhooks/stripe [charge.refunded]'
    ]
  },
  M8: {
    title: 'Charge Dispute / Chargeback Simulation & Resolution',
    card: '4000 0000 0000 0110',
    steps: [
      'Open Checkout URL and pay with 4000 0000 0000 0110.',
      'In Stripe Dashboard -> Payments, create a test dispute on this payment.',
      'Confirm Stripe CLI prints: 200 POST /api/v1/webhooks/stripe [charge.dispute.created].'
    ]
  },
  M9: {
    title: 'Missed Webhook Fallback (Stale Payments Job Reconciler)',
    card: '4242 4242 4242 4242',
    steps: [
      'Pause or stop Stripe CLI listener (Ctrl+C).',
      'Open Checkout URL and pay with 4242 4242 4242 4242.',
      'Server misses webhook. Restart CLI listener and trigger backend reconciliation.'
    ]
  },
  M10: {
    title: 'Late Payment After Local Expiration (Auto-Refund Race Guard)',
    card: '4242 4242 4242 4242',
    steps: [
      'Open Checkout URL, but do NOT pay yet.',
      'Cancel or expire order in backend so order is cancelled.',
      'Now submit payment on the open checkout page.',
      'Webhook handler sees order is already cancelled and automatically refunds it!'
    ]
  }
};

function ensureInitializedEnvironment() {
  let needsInit = true;
  if (fs.existsSync(runtimeEnvPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(runtimeEnvPath, 'utf8'));
      const adminTok = data.values && data.values.find(v => v.key === 'adminToken');
      const custTok = data.values && data.values.find(v => v.key === 'customer1Token');
      if (adminTok && adminTok.value && custTok && custTok.value) {
        needsInit = false;
      }
    } catch (e) {
      needsInit = true;
    }
  }

  if (needsInit) {
    console.log('\n⚙️  Initializing runtime test environment (P0-Setup)...');
    const initCmd = spawnSync(
      `"${newmanBin}"`,
      [
        'run',
        `"${collectionPath}"`,
        '--folder', '"P0-Setup"',
        '-e', `"${baseEnvPath}"`,
        '--env-var', `stripeWebhookSecret=${webhookSecret}`,
        '--export-environment', `"${runtimeEnvPath}"`,
        '--reporters', 'cli'
      ],
      { shell: true, stdio: 'inherit' }
    );

    if (initCmd.status !== 0) {
      console.error('❌ Failed to initialize test environment with P0-Setup.');
      process.exit(1);
    }
    console.log('✅ Runtime test environment initialized successfully.\n');
  }
}

if (mode === 'setup') {
  ensureInitializedEnvironment();

  const folderName = `${caseId}-Setup`;
  console.log(`\n======================================================`);
  console.log(`🚀 RUNNING SETUP FOR [${caseId}]: ${CASE_DETAILS[caseId]?.title || ''}`);
  console.log(`======================================================\n`);

  const setupRun = spawnSync(
    `"${newmanBin}"`,
    [
      'run',
      `"${collectionPath}"`,
      '--folder', `"${folderName}"`,
      '-e', `"${runtimeEnvPath}"`,
      '--env-var', `stripeWebhookSecret=${webhookSecret}`,
      '--export-environment', `"${runtimeEnvPath}"`,
      '--reporters', 'cli'
    ],
    { shell: true, stdio: 'inherit' }
  );

  if (setupRun.status !== 0) {
    console.error(`\n❌ Failed during setup of ${caseId}.`);
    process.exit(setupRun.status || 1);
  }

  // Read back the updated runtime environment to display checkout details
  try {
    const envData = JSON.parse(fs.readFileSync(runtimeEnvPath, 'utf8'));
    const orderIdVal = envData.values?.find(v => v.key === 'orderId')?.value;
    const checkoutUrlVal = envData.values?.find(v => v.key === 'checkoutUrl')?.value;
    const details = CASE_DETAILS[caseId];

    console.log(`\n` + `═`.repeat(72));
    console.log(`🎉 ${caseId} SETUP COMPLETE — READY FOR MANUAL ACTION!`);
    console.log(`═`.repeat(72));
    console.log(`Order ID:     ${orderIdVal || 'saved'}`);
    console.log(`Checkout URL: \x1b[36m${checkoutUrlVal || 'N/A'}\x1b[0m`);
    console.log(`Test Card:    \x1b[33m${details.card}\x1b[0m`);
    console.log(`\n📋 Action Steps:`);
    details.steps.forEach((st, idx) => {
      console.log(`   ${idx + 1}. ${st}`);
    });
    console.log(`\n👉 NEXT STEP (Run after completing action in browser):`);
    console.log(`   \x1b[32mnpm run test:payment:manual:verify -- ${caseId}\x1b[0m`);
    console.log(`═`.repeat(72) + `\n`);
  } catch (err) {
    console.log(`Setup finished. Run 'npm run test:payment:manual:verify -- ${caseId}' to verify.`);
  }

} else if (mode === 'verify') {
  if (!fs.existsSync(runtimeEnvPath)) {
    console.error(`\n❌ Runtime environment not found. Please run setup first:`);
    console.error(`   npm run test:payment:manual:setup -- ${caseId}\n`);
    process.exit(1);
  }

  const folderName = `${caseId}-Verify`;
  console.log(`\n======================================================`);
  console.log(`🔍 RUNNING VERIFICATION FOR [${caseId}]`);
  console.log(`======================================================\n`);

  const verifyRun = spawnSync(
    `"${newmanBin}"`,
    [
      'run',
      `"${collectionPath}"`,
      '--folder', `"${folderName}"`,
      '-e', `"${runtimeEnvPath}"`,
      '--env-var', `stripeWebhookSecret=${webhookSecret}`,
      '--reporters', 'cli'
    ],
    { shell: true, stdio: 'inherit' }
  );

  if (verifyRun.status !== 0) {
    console.error(`\n❌ Verification failed for ${caseId}.`);
    console.error(`Did you complete the manual payment/action in the browser or Stripe dashboard?`);
    console.error(`Is the Stripe CLI forwarder active and showing 200 on events?`);
    process.exit(verifyRun.status || 1);
  }

  console.log(`\n` + `═`.repeat(72));
  console.log(`✅ CASE [${caseId}] VERIFICATION PASSED!`);
  console.log(`All assertions confirmed matching database and Stripe lifecycle states.`);
  console.log(`═`.repeat(72) + `\n`);
}
