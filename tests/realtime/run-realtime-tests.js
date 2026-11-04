/**
 * Automated Real-time Feature Test Suite
 *
 * Runs end-to-end integration tests using Socket.IO client against a live HTTP & Socket server.
 * Covers all 6 specification categories:
 *  1. Connection & Handshake Authentication
 *  2. Product Subscriptions & Room Management
 *  3. Real-time Price Updates (Vendor update, Cart price change, Room isolation)
 *  4. Real-time Stock Updates (Order placed, Cancelled, Expired session, Refund restock, Unavailability)
 *  5. Concurrency & Race Conditions (Flash sale single-unit contention)
 *  6. Isolation, Safe No-Op & Payload Privacy
 */

const { setupTestServer } = require('./test-helpers');
const { runCategory1 } = require('./category1-auth.test');
const { runCategory2 } = require('./category2-subscriptions.test');
const { runCategory3 } = require('./category3-price.test');
const { runCategory4 } = require('./category4-stock.test');
const { runCategory5 } = require('./category5-concurrency.test');
const { runCategory6 } = require('./category6-isolation.test');

async function main() {
  console.log('====================================================');
  console.log('  ORDER & DELIVERY API: REAL-TIME TEST SUITE        ');
  console.log('====================================================');

  const startTime = Date.now();
  let serverEnv;

  try {
    serverEnv = await setupTestServer();
    console.log(`Test server running at ${serverEnv.url}`);

    await runCategory1(serverEnv.url, serverEnv.io);
    await runCategory2(serverEnv.url, serverEnv.io);
    await runCategory3(serverEnv.url, serverEnv.io);
    await runCategory4(serverEnv.url, serverEnv.io);
    await runCategory5(serverEnv.url, serverEnv.io);
    await runCategory6(serverEnv.url, serverEnv.io);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n====================================================');
    console.log(`  ALL 6 REAL-TIME TEST CATEGORIES PASSED! (${duration}s)`);
    console.log('====================================================\n');

    await serverEnv.cleanup();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ REAL-TIME TEST RUN FAILED:\n', error);
    if (serverEnv?.cleanup) {
      try {
        await serverEnv.cleanup();
      } catch (_) {}
    }
    process.exit(1);
  }
}

main();

