require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize, initModels } = require('../src/config/database');
const Order = require('../src/v1/modules/customer/models/order.model');
const OrderItem = require('../src/v1/modules/customer/models/orderItem.model');
const Payment = require('../src/v1/modules/customer/models/payment.model');
const Product = require('../src/v1/modules/vendor/models/product.model');
const { PAYMENT_STATUS, ITEM_STATUS } = require('../src/common/constants/orderStatus');

const runtimeEnvPath = path.join(__dirname, '..', 'postman', 'payment.runtime.json');

if (!fs.existsSync(runtimeEnvPath)) {
  console.error('\n❌ No active test session found. Please run setup first.');
  console.error('Example: npm run test:payment:manual:setup -- M10\n');
  process.exit(1);
}

async function expireLocalOrder() {
  initModels();

  const envData = JSON.parse(fs.readFileSync(runtimeEnvPath, 'utf8'));
  const orderId = envData.values?.find((v) => v.key === 'orderId')?.value;

  if (!orderId) {
    console.error('\n❌ Could not find orderId in test environment.');
    process.exit(1);
  }

  const order = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: 'items' }],
  });

  if (!order) {
    console.error(`\n❌ Order ${orderId} not found in database.`);
    process.exit(1);
  }

  await sequelize.transaction(async (t) => {
    // 1. Mark order paymentStatus as failed
    order.paymentStatus = PAYMENT_STATUS.FAILED;
    await order.save({ transaction: t });

    // 2. Mark payment row as failed
    await Payment.update(
      { status: PAYMENT_STATUS.FAILED },
      { where: { orderId: order.id }, transaction: t }
    );

    // 3. Cancel all items and restore stock
    if (order.items) {
      for (const item of order.items) {
        item.status = ITEM_STATUS.CANCELLED;
        await item.save({ transaction: t });

        const product = await Product.findByPk(item.productId, { transaction: t });
        if (product) {
          product.stock += item.quantity;
          await product.save({ transaction: t });
        }
      }
    }
  });

  console.log(`\n======================================================`);
  console.log(`✅ Order Marked FAILED Locally (Simulated Timeout Expiry)`);
  console.log(`Order ID:       ${order.id}`);
  console.log(`Local Status:   paymentStatus = 'failed', items = 'cancelled'`);
  console.log(`Inventory:      Restored to products`);
  console.log(`Stripe Session: Still active in your open browser tab!`);
  console.log(`======================================================\n`);
  console.log(`📋 Next Steps for M10:`);
  console.log(`   1. Switch to your open Stripe Checkout browser tab.`);
  console.log(`   2. Pay using test card: 4242 4242 4242 4242 (12/28, CVC 123).`);
  console.log(`   3. Stripe will process the charge and send "checkout.session.completed".`);
  console.log(`   4. Your backend detects the order is ALREADY FAILED, and immediately`);
  console.log(`      issues an automatic full refund (Auto-Refund Race Guard)!`);
  console.log(`   5. Verify by running:`);
  console.log(`      npm run test:payment:manual:verify -- M10\n`);
}

expireLocalOrder()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Error expiring order locally:', err.message);
    process.exit(1);
  });

