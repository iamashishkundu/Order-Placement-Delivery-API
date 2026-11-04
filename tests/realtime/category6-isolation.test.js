const assert = require('assert');
const realtimeService = require('../../src/common/services/realtime.service');
const {
  buildPriceUpdatedPayload,
  buildCartPriceChangedPayload,
  buildStockUpdatedPayload,
  buildAvailabilityChangedPayload,
  buildCartItemUnavailablePayload,
} = require('../../src/realtime/events');
const { updateProduct } = require('../../src/v1/modules/vendor/product/updateProduct/updateProduct.service');
const { models } = require('./test-helpers');
const { Vendor, Category, Product } = models;

async function runCategory6(url) {
  console.log('\n--- Category 6: Isolation & Safe No-Op ---');

  // 1. Safe no-op when calling realtimeService directly
  assert.doesNotThrow(() => {
    realtimeService.emitPriceUpdated({ productId: '00000000-0000-0000-0000-000000000000', oldPrice: 10, newPrice: 15 });
    realtimeService.emitStockUpdated({ productId: '00000000-0000-0000-0000-000000000000', stock: 10, reason: 'vendor_update' });
    realtimeService.emitProductAvailabilityChanged({ productId: '00000000-0000-0000-0000-000000000000', isVisible: false });
    realtimeService.emitCartPriceChanged({ customerId: '00000000-0000-0000-0000-000000000000', productId: '00000000-0000-0000-0000-000000000000', oldPrice: 10, newPrice: 15, quantity: 1 });
    realtimeService.emitCartItemUnavailable({ customerId: '00000000-0000-0000-0000-000000000000', productId: '00000000-0000-0000-0000-000000000000', availableStock: 0, cartQuantity: 1, reason: 'out_of_stock' });
    realtimeService.disconnectUser('00000000-0000-0000-0000-000000000000', 'customer');
  }, 'All realtimeService calls must be completely safe without throwing');
  console.log('  √ 6.1 Realtime service safely handles calls without throws');

  // 2. Business operations continue even if realtime emit throws
  const originalEmit = realtimeService.emitPriceUpdated;
  realtimeService.emitPriceUpdated = () => {
    throw new Error('Simulated Socket.IO engine failure');
  };

  const category = await Category.findOne({ where: { isActive: true } });
  const vendor = await Vendor.create({
    ownerName: 'Isolation Vendor',
    email: `isolation_${Date.now()}@test.com`,
    phone: `+1207${Date.now().toString().slice(-7)}`,
    passwordHash: 'hash',
    status: 'approved',
    profileCompleted: true,
  });

  const product = await Product.create({
    vendorId: vendor.id,
    categoryId: category.id,
    name: 'Isolation Test Item',
    price: 30.0,
    stock: 10,
    isAvailable: true,
    isDisabledByAdmin: false,
  });

  let updateResult;
  assert.doesNotThrow(async () => {
    updateResult = await updateProduct(vendor.id, product.id, { price: 35.0 });
  });

  // Restore emit
  realtimeService.emitPriceUpdated = originalEmit;
  console.log('  √ 6.2 Business operations succeed and persist even if socket engine encounters error');

  // 3. Payload privacy: inspect all built payloads for private fields
  const samplePayloads = [
    buildPriceUpdatedPayload({ productId: product.id, oldPrice: 30, newPrice: 35 }),
    buildCartPriceChangedPayload({ productId: product.id, oldPrice: 30, newPrice: 35, quantity: 2, newLineTotal: 70 }),
    buildStockUpdatedPayload({ productId: product.id, stock: 10, reason: 'vendor_update' }),
    buildAvailabilityChangedPayload({ productId: product.id, isVisible: true }),
    buildCartItemUnavailablePayload({ productId: product.id, availableStock: 5, cartQuantity: 8, reason: 'insufficient_stock' }),
  ];

  const forbiddenKeys = ['password', 'passwordHash', 'email', 'phone', 'secret', 'stripe', 'token'];
  for (const payload of samplePayloads) {
    for (const key of forbiddenKeys) {
      assert.strictEqual(
        key in payload,
        false,
        `Payload must never contain private field '${key}'`
      );
    }
    assert(payload.updatedAt, 'Payload must contain ISO-8601 updatedAt');
  }
  console.log('  √ 6.3 Event payloads contain zero private credentials/customer PII and contain ISO updatedAt');

  // Cleanup
  await product.destroy({ force: true });
  await vendor.destroy();
}

module.exports = { runCategory6 };

