const assert = require('assert');
const { connectAndReady, waitForEvent, signToken, models } = require('./test-helpers');
const { placeOrder } = require('../../src/v1/modules/customer/order/placeOrder/placeOrder.service');
const { Customer, Vendor, Category, Product, CartItem, Address, Order, OrderItem } = models;

async function runCategory5(url) {
  console.log('\n--- Category 5: Concurrency & Race Conditions ---');

  const category = await Category.findOne({ where: { isActive: true } });
  assert(category, 'Active category required');

  const vendor = await Vendor.create({
    ownerName: 'Flash Vendor',
    email: `flash_vendor_${Date.now()}@test.com`,
    phone: `+1204${Date.now().toString().slice(-7)}`,
    passwordHash: 'hash',
    status: 'approved',
    profileCompleted: true,
  });

  // Exactly 1 unit in stock
  const product = await Product.create({
    vendorId: vendor.id,
    categoryId: category.id,
    name: 'Sole Unit Collectible',
    price: 99.0,
    stock: 1,
    isAvailable: true,
    isDisabledByAdmin: false,
  });

  const custA = await Customer.create({
    phone: `+1205${Date.now().toString().slice(-7)}`,
    status: 'active',
  });
  const addrA = await Address.create({
    customerId: custA.id,
    label: 'Home',
    addressLine: '100 Race St',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94101',
  });

  const custB = await Customer.create({
    phone: `+1206${Date.now().toString().slice(-7)}`,
    status: 'active',
  });
  const addrB = await Address.create({
    customerId: custB.id,
    label: 'Home',
    addressLine: '200 Race St',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94101',
  });

  // Both customers put the 1 unit in their cart
  await CartItem.create({ customerId: custA.id, productId: product.id, quantity: 1 });
  await CartItem.create({ customerId: custB.id, productId: product.id, quantity: 1 });

  const clientA = await connectAndReady(url, signToken({ sub: custA.id, role: 'customer' }));
  const clientB = await connectAndReady(url, signToken({ sub: custB.id, role: 'customer' }));

  // Both subscribe to product
  await new Promise((r) => clientA.emit('product:subscribe', { productIds: [product.id] }, r));
  await new Promise((r) => clientB.emit('product:subscribe', { productIds: [product.id] }, r));

  const waitStockToA = waitForEvent(clientA, 'product:stockUpdated');
  const waitStockToB = waitForEvent(clientB, 'product:stockUpdated');

  // Listen for cart:itemUnavailable on both (the one whose cart item wasn't cleared will receive it)
  let losingCartNotification = null;
  clientA.on('cart:itemUnavailable', (d) => {
    losingCartNotification = { client: 'A', data: d };
  });
  clientB.on('cart:itemUnavailable', (d) => {
    losingCartNotification = { client: 'B', data: d };
  });

  // Trigger simultaneous placeOrder requests
  const [resA, resB] = await Promise.allSettled([
    placeOrder(custA.id, { addressId: addrA.id, paymentMethod: 'COD' }),
    placeOrder(custB.id, { addressId: addrB.id, paymentMethod: 'COD' }),
  ]);

  const fulfilledCount = [resA, resB].filter((r) => r.status === 'fulfilled').length;
  const rejectedCount = [resA, resB].filter((r) => r.status === 'rejected').length;

  assert.strictEqual(fulfilledCount, 1, 'Exactly one customer order must succeed');
  assert.strictEqual(rejectedCount, 1, 'The other customer order must fail due to stock depletion');

  const failedResult = resA.status === 'rejected' ? resA : resB;
  assert.match(
    failedResult.reason.message,
    /cannot be fulfilled|insufficient stock/i,
    'Failed order must indicate insufficient stock'
  );
  console.log('  √ 5.1 Concurrency race: Exactly one order succeeds; conflicting order rejected');

  // Both sockets receive product:stockUpdated with stock 0
  const stockPayloadA = await waitStockToA;
  const stockPayloadB = await waitStockToB;

  assert.strictEqual(stockPayloadA.stock, 0);
  assert.strictEqual(stockPayloadA.reason, 'order_placed');
  assert.strictEqual(stockPayloadB.stock, 0);
  assert.strictEqual(stockPayloadB.reason, 'order_placed');
  console.log('  √ 5.2 Both connected clients instantly receive product:stockUpdated (stock: 0)');

  // Verify losing customer receives cart:itemUnavailable
  await new Promise((r) => setTimeout(r, 400));
  assert(losingCartNotification, 'Losing customer must receive cart:itemUnavailable event');
  assert.strictEqual(losingCartNotification.data.availableStock, 0);
  assert.strictEqual(losingCartNotification.data.reason, 'out_of_stock');
  console.log('  √ 5.3 Losing customer receives cart:itemUnavailable (out_of_stock)');

  clientA.close();
  clientB.close();

  // Cleanup
  const successfulOrder = resA.status === 'fulfilled' ? resA.value : resB.value;
  await CartItem.destroy({ where: { customerId: [custA.id, custB.id] } });
  await OrderItem.destroy({ where: { orderId: successfulOrder.id } });
  await Order.destroy({ where: { id: successfulOrder.id } });
  await addrA.destroy();
  await addrB.destroy();
  await product.destroy({ force: true });
  await custA.destroy();
  await custB.destroy();
  await vendor.destroy();
}

module.exports = { runCategory5 };

