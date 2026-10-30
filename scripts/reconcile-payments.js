require('dotenv').config();
const { initModels } = require('../src/config/database');
const { expireStalePayments } = require('../src/jobs/expireStalePayments.job');

console.log('\n======================================================');
console.log('🔄 Triggering Stale Payments & Reconciliation Job...');
console.log('Checking all pending online orders against Stripe API...');
console.log('======================================================\n');

// Ensure model associations are wired
initModels();

expireStalePayments({ forceAll: true })
  .then(() => {
    console.log('\n======================================================');
    console.log('✅ Stale Payments Check & Reconciliation Finished!');
    console.log('======================================================\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Reconciliation job encountered an error:', err.message);
    process.exit(1);
  });
