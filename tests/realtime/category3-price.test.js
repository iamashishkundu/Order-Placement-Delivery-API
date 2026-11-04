const assert = require('assert');
const { connectAndReady, waitForEvent, ensureNoEvent, signToken, models } = require('./test-helpers');
const { updateProduct } = require('../../src/v1/modules/vendor/product/updateProduct/updateProduct.service');
const { Customer, Vendor, Category, Product, CartItem } = models;

async function runCategory3(url) {
  console.log('\n--- Category 3: Realtime Price Updates ---');

  const category = await Category.findOne({ where: { isActive: true } });
  assert(category, 'Active category required');

  const vendor = await Vendor.create({
    ownerName: 'Price Vendor',
    email: `price_vendor_${Date.now()}@test.com`,
    phone: `+1222${Date.now().toString().slice(-7)}`,
    passwordHash: 'hash',
    status: 'approved',
    profileCompleted: true,
  });

  const productA = await Product.create({
    vendorId: vendor.id,
    categoryId: category.id,
    name: 'Price Product A',
    price: 20.0,
    stock: 50,
    isAvailable: true,
    isDisabledByAdmin: false,
  });

  const productB = await Product.create({
    vendorId: vendor.id,
    categoryId: category.id,
    name: 'Price Product B',
    price: 40.0,
    stock: 50,
    isAvailable: true,
    isDisabledByAdmin: false,
  });

  // Customer 1: has productA in cart, subscribed to productA
  const cust1 = await Customer.create({
    phone: `+1111${Date.now().toString().slice(-7)}`,
    status: 'active',
  });
  await CartItem.create({
    customerId: cust1.id,
    productId: productA.id,
    quantity: 3,
  });

  // Customer 2: has productB in cart, subscribed to productB
  const cust2 = await Customer.create({
    phone: `+1110${Date.now().toString().slice(-7)}`,
    status: 'active',
  });
  await CartItem.create({
    customerId: cust2.id,
    productId: productB.id,
    quantity: 1,
  });

  const client1 = await connectAndReady(url, signToken({ sub: cust1.id, role: 'customer' }));
  const client2 = await connectAndReady(url, signToken({ sub: cust2.id, role: 'customer' }));

  // Subscribe client1 to productA, client2 to productB
  await new Promise((r) => client1.emit('product:subscribe', { productIds: [productA.id] }, r));
  await new Promise((r) => client2.emit('product:subscribe', { productIds: [productB.id] }, r));

  // 1. Vendor updates price of productA from 20.00 to 25.00
  const waitPriceUpdated = waitForEvent(client1, 'product:priceUpdated');
  const waitCartPriceChanged = waitForEvent(client1, 'cart:priceChanged');
  const ensureNoPriceToClient2 = ensureNoEvent(client2, 'product:priceUpdated', 400);
  const ensureNoCartToClient2 = ensureNoEvent(client2, 'cart:priceChanged', 400);

  await updateProduct(vendor.id, productA.id, { price: 25.0 });

  const pricePayload = await waitPriceUpdated;
  const cartPayload = await waitCartPriceChanged;
  await ensureNoPriceToClient2;
  await ensureNoCartToClient2;

  // Assertions on product:priceUpdated
  assert.strictEqual(pricePayload.productId, productA.id);
  assert.strictEqual(pricePayload.oldPrice, 20.0);
  assert.strictEqual(pricePayload.newPrice, 25.0);
  assert.strictEqual(pricePayload.currency, 'USD');
  assert(pricePayload.updatedAt);
  console.log('  √ 3.1 Subscribed customer receives product:priceUpdated with correct payload');

  // Assertions on cart:priceChanged
  assert.strictEqual(cartPayload.productId, productA.id);
  assert.strictEqual(cartPayload.oldPrice, 20.0);
  assert.strictEqual(cartPayload.newPrice, 25.0);
  assert.strictEqual(cartPayload.quantity, 3);
  assert.strictEqual(cartPayload.newLineTotal, 75.0); // 3 * 25.00
  assert(cartPayload.updatedAt);
  console.log('  √ 3.2 Customer with item in cart receives cart:priceChanged with updated line total');

  console.log('  √ 3.3 Customer without item in cart does NOT receive cart:priceChanged');
  console.log('  √ 3.4 Sockets subscribed to different products do NOT receive cross-product price events');

  // 2. Updating with the same price does NOT emit
  const ensureNoRedundantEmit = ensureNoEvent(client1, 'product:priceUpdated', 400);
  await updateProduct(vendor.id, productA.id, { price: 25.0 });
  await ensureNoRedundantEmit;
  console.log('  √ 3.5 Identical price update is safely ignored (no redundant emission)');

  client1.close();
  client2.close();

  // Cleanup
  await CartItem.destroy({ where: { customerId: [cust1.id, cust2.id] } });
  await productA.destroy({ force: true });
  await productB.destroy({ force: true });
  await cust1.destroy();
  await cust2.destroy();
  await vendor.destroy();
}

module.exports = { runCategory3 };

