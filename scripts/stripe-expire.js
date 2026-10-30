require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('\n❌ STRIPE_SECRET_KEY is not defined in .env');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function resolveSessionId() {
  // 1. Direct command-line argument (e.g. npm run stripe:expire -- cs_test_...)
  const cliArg = process.argv.slice(2).find(arg => arg.startsWith('cs_test_') || arg.startsWith('cs_'));
  if (cliArg) {
    return { id: cliArg, source: 'CLI argument' };
  }

  // 2. Query Database for most recent pending Stripe payment
  try {
    const { initModels } = require('../src/config/database');
    initModels();
    const Payment = require('../src/v1/modules/customer/models/payment.model');
    const Order = require('../src/v1/modules/customer/models/order.model');

    const pendingPayment = await Payment.findOne({
      where: {
        status: 'pending',
        provider: 'stripe',
      },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'totalAmount', 'createdAt'],
        },
      ],
    });

    if (pendingPayment && pendingPayment.providerSessionId) {
      return {
        id: pendingPayment.providerSessionId,
        source: `PostgreSQL Database (Order: ${pendingPayment.orderId || 'N/A'}, Amount: $${pendingPayment.amount})`,
      };
    }
  } catch (dbErr) {
    // Database query failed or unavailable; continue to file fallbacks
  }

  // 3. Check postman/payment.environment.json
  const envPath = path.join(__dirname, '..', 'postman', 'payment.environment.json');
  if (fs.existsSync(envPath)) {
    try {
      const envData = JSON.parse(fs.readFileSync(envPath, 'utf8'));
      const found = envData.values?.find(v => v.key === 'providerSessionId')?.value;
      if (found && found.startsWith('cs_')) {
        return { id: found, source: 'postman/payment.environment.json' };
      }
    } catch (_) {}
  }

  // 4. Check postman/payment.runtime.json
  const runtimePath = path.join(__dirname, '..', 'postman', 'payment.runtime.json');
  if (fs.existsSync(runtimePath)) {
    try {
      const runtimeData = JSON.parse(fs.readFileSync(runtimePath, 'utf8'));
      const found = runtimeData.values?.find(v => v.key === 'providerSessionId')?.value;
      if (found && found.startsWith('cs_')) {
        return { id: found, source: 'postman/payment.runtime.json' };
      }
    } catch (_) {}
  }

  return null;
}

async function main() {
  console.log('\n======================================================');
  console.log('⚡ Stripe Checkout Session Expiration Tool');
  console.log('======================================================');

  const resolved = await resolveSessionId();

  if (!resolved) {
    console.error('\n❌ Could not detect an active pending Stripe Checkout Session.');
    console.error('\nTroubleshooting:');
    console.error('1. Did you run step "5.3 Customer Places ONLINE Order" in Postman first?');
    console.error('   (Adding items to cart does NOT generate a session; placing the order does)');
    console.error('2. You can also specify the session ID manually:');
    console.error('   npm run stripe:expire -- cs_test_your_session_id_here\n');
    process.exit(1);
  }

  const { id: sessionId, source } = resolved;
  console.log(`\n🔍 Found Session: ${sessionId}`);
  console.log(`📍 Source: ${source}`);
  console.log(`⏳ Calling Stripe API: stripe.checkout.sessions.expire('${sessionId}')...\n`);

  try {
    const session = await stripe.checkout.sessions.expire(sessionId);

    console.log('======================================================');
    console.log(`✅ Session Expired Successfully: ${session.id}`);
    console.log(`Status: ${session.status}`);
    console.log('======================================================');
    console.log('\nNext Steps:');
    console.log('1. Check your "npm run stripe:listen" terminal:');
    console.log('   Expected: 200 POST /api/v1/webhooks/stripe [checkout.session.expired]');
    console.log('2. In Postman, run request:');
    console.log('   "5.4 Verify Order Status is Failed" (confirms paymentStatus=\'failed\')');
    console.log('3. In Postman, run request:');
    console.log('   "5.5 Verify Stock Returned Back to Original Baseline" (confirms stock restored)\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to expire session in Stripe:');
    console.error(`   ${err.message}`);

    if (err.message.includes('complete')) {
      console.error('\n💡 Note: This session was already paid/completed, so it cannot be expired.');
      console.error('   Please run "5.3 Customer Places ONLINE Order" to create a fresh pending order.');
    } else if (err.message.includes('expired')) {
      console.error('\n💡 Note: This session has already been expired.');
    }

    process.exit(1);
  }
}

main();
