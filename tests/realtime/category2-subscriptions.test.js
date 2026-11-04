const assert = require('assert');
const { connectAndReady, signToken, models } = require('./test-helpers');
const { Customer, Vendor, Category, Product } = models;

async function runCategory2(url, io) {
  console.log('\n--- Category 2: Subscriptions & Room Management ---');

  // Setup test customer, vendor, category, and products
  const customer = await Customer.create({
    phone: `+1444${Date.now().toString().slice(-7)}`,
    status: 'active',
  });
  const customerToken = signToken({ sub: customer.id, role: 'customer' });

  const vendor = await Vendor.create({
    ownerName: 'Sub Test Vendor',
    email: `sub_vendor_${Date.now()}@test.com`,
    phone: `+1333${Date.now().toString().slice(-7)}`,
    passwordHash: 'hash',
    status: 'approved',
    profileCompleted: true,
  });

  const category = await Category.findOne({ where: { isActive: true } });
  assert(category, 'Active category required');

  const visibleProduct = await Product.create({
    vendorId: vendor.id,
    categoryId: category.id,
    name: 'Visible Item',
    price: 15.0,
    stock: 20,
    isAvailable: true,
    isDisabledByAdmin: false,
  });

  const unavailableProduct = await Product.create({
    vendorId: vendor.id,
    categoryId: category.id,
    name: 'Unavailable Item',
    price: 15.0,
    stock: 20,
    isAvailable: false,
    isDisabledByAdmin: false,
  });

  const disabledProduct = await Product.create({
    vendorId: vendor.id,
    categoryId: category.id,
    name: 'Disabled Item',
    price: 15.0,
    stock: 20,
    isAvailable: true,
    isDisabledByAdmin: true,
  });

  const client = await connectAndReady(url, customerToken);
  const socket = io.sockets.sockets.get(client.id);

  // 1. Subscribe to valid visible product
  const subRes1 = await new Promise((resolve) => {
    client.emit('product:subscribe', { productIds: [visibleProduct.id] }, resolve);
  });
  assert.strictEqual(subRes1.success, true);
  assert.deepStrictEqual(subRes1.subscribed, [visibleProduct.id]);
  assert.deepStrictEqual(subRes1.rejected, []);
  assert(socket.rooms.has(`product:${visibleProduct.id}`), 'Socket must be in product room');
  console.log('  √ 2.1 Subscribes to valid visible product and joins room');

  // 2. Reject invalid non-UUID
  const subRes2 = await new Promise((resolve) => {
    client.emit('product:subscribe', { productIds: ['not-a-valid-uuid'] }, resolve);
  });
  assert.strictEqual(subRes2.success, false);
  assert.strictEqual(subRes2.error, 'INVALID_PRODUCT_IDS');
  assert.deepStrictEqual(subRes2.rejected, ['not-a-valid-uuid']);
  console.log('  √ 2.2 Rejects invalid non-UUID identifier');

  // 3. Reject non-existent UUID
  const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
  const subRes3 = await new Promise((resolve) => {
    client.emit('product:subscribe', { productIds: [nonExistentUuid] }, resolve);
  });
  assert.deepStrictEqual(subRes3.rejected, [nonExistentUuid]);
  console.log('  √ 2.3 Rejects non-existent product UUID');

  // 4. Reject unavailable and admin-disabled products
  const subRes4 = await new Promise((resolve) => {
    client.emit(
      'product:subscribe',
      { productIds: [unavailableProduct.id, disabledProduct.id] },
      resolve
    );
  });
  assert.deepStrictEqual(subRes4.subscribed, []);
  assert(subRes4.rejected.includes(unavailableProduct.id));
  assert(subRes4.rejected.includes(disabledProduct.id));
  console.log('  √ 2.4 Rejects unavailable and admin-disabled products');

  // 5. Unsubscribe from product leaves room
  const unsubRes = await new Promise((resolve) => {
    client.emit('product:unsubscribe', { productIds: [visibleProduct.id] }, resolve);
  });
  assert.strictEqual(unsubRes.success, true);
  assert.deepStrictEqual(unsubRes.unsubscribed, [visibleProduct.id]);
  assert(!socket.rooms.has(`product:${visibleProduct.id}`), 'Socket must leave product room');
  console.log('  √ 2.5 Unsubscribe removes socket from product room');

  // 6. Max subscriptions capping
  const dummyUuids = Array.from({ length: 105 }, (_, i) => {
    const hex = i.toString(16).padStart(12, '0');
    return `11111111-1111-1111-1111-${hex}`;
  });
  const subResLimit = await new Promise((resolve) => {
    client.emit('product:subscribe', { productIds: dummyUuids }, resolve);
  });
  assert.strictEqual(subResLimit.success, false);
  assert.strictEqual(subResLimit.error, 'MAX_SUBSCRIPTIONS_EXCEEDED');
  console.log('  √ 2.6 Enforces SOCKET_MAX_SUBSCRIPTIONS cap');

  client.close();

  // Cleanup
  await visibleProduct.destroy({ force: true });
  await unavailableProduct.destroy({ force: true });
  await disabledProduct.destroy({ force: true });
  await customer.destroy();
  await vendor.destroy();
}

module.exports = { runCategory2 };
