const assert = require('assert');
const { connectAndReady, waitForEvent, signToken, models } = require('./test-helpers');
const { placeOrder } = require('../../src/v1/modules/customer/order/placeOrder/placeOrder.service');
const { cancelOrder } = require('../../src/v1/modules/customer/order/cancelOrder/cancelOrder.service');
const { updateStock } = require('../../src/v1/modules/vendor/product/updateStock/updateStock.service');
const { deleteProduct } = require('../../src/v1/modules/vendor/product/deleteProduct/deleteProduct.service');
const { disableProduct } = require('../../src/v1/modules/admin/product/disableProduct/disableProduct.service');
const { handleStripeWebhook } = require('../../src/webhooks/stripe/handleStripeWebhook/handleStripeWebhook.service');
const stripeService = require('../../src/common/services/stripe.service');
const { Customer, Vendor, Category, Product, CartItem, Address, Order, OrderItem, Payment, StripeEvent } = models;

async function runCategory4(url) {
  console.log('\n--- Category 4: Realtime Stock Updates & Cart Notifications ---');

  const category = await Category.findOne({ where: { isActive: true } });
  assert(category, 'Active category required');

  const vendor = await Vendor.create({
    ownerName: 'Stock Vendor',
    email: `stock_vendor_${Date.now()}@test.com`,
    phone: `+1201${Date.now().toString().slice(-7)}`,
    passwordHash: 'hash',
    status: 'approved',
    profileCompleted: true,
  });

  const product = await Product.create({
    vendorId: vendor.id,
    categoryId: category.id,
    name: 'Stock Tracked Pizza',
    price: 20.0,
    stock: 10,
    isAvailable: true,
    isDisabledByAdmin: false,
  });

  const customer1 = await Customer.create({
    phone: `+1202${Date.now().toString().slice(-7)}`,
    status: 'active',
  });
  const address1 = await Address.create({
    customerId: customer1.id,
    label: 'Home',
    addressLine: '123 Test St',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94101',
  });

  const customer2 = await Customer.create({
    phone: `+1203${Date.now().toString().slice(-7)}`,
    status: 'active',
  });

  const client1 = await connectAndReady(url, signToken({ sub: customer1.id, role: 'customer' }));
  const client2 = await connectAndReady(url, signToken({ sub: customer2.id, role: 'customer' }));

  // Both subscribe to product
  await new Promise((r) => client1.emit('product:subscribe', { productIds: [product.id] }, r));
  await new Promise((r) => client2.emit('product:subscribe', { productIds: [product.id] }, r));

  // 1. Order Placed (stock decrement emit)
  await CartItem.create({
    customerId: customer1.id,
    productId: product.id,
    quantity: 3,
  });

  const waitOrderPlacedStock = waitForEvent(client1, 'product:stockUpdated');
  const placedOrder = await placeOrder(customer1.id, {
    addressId: address1.id,
    paymentMethod: 'COD',
  });

  const stockPlacedPayload = await waitOrderPlacedStock;
  assert.strictEqual(stockPlacedPayload.productId, product.id);
  assert.strictEqual(stockPlacedPayload.stock, 7); // 10 - 3
  assert.strictEqual(stockPlacedPayload.reason, 'order_placed');
  console.log('  √ 4.1 Order placed emits product:stockUpdated (reason: order_placed, stock: 7)');

  // 2. Order Cancelled (stock restored emit)
  const waitOrderCancelledStock = waitForEvent(client1, 'product:stockUpdated');
  await cancelOrder(customer1.id, placedOrder.id);

  const stockCancelledPayload = await waitOrderCancelledStock;
  assert.strictEqual(stockCancelledPayload.productId, product.id);
  assert.strictEqual(stockCancelledPayload.stock, 10); // restored back to 10
  assert.strictEqual(stockCancelledPayload.reason, 'order_cancelled');
  console.log('  √ 4.2 Order cancelled emits product:stockUpdated (reason: order_cancelled, stock: 10)');

  // 3. Stock falls below cart quantity -> cart:itemUnavailable
  // Put quantity 8 in customer2's cart
  await CartItem.create({
    customerId: customer2.id,
    productId: product.id,
    quantity: 8,
  });

  // Vendor updates stock to 5 (< 8)
  const waitItemUnavailable = waitForEvent(client2, 'cart:itemUnavailable');
  await updateStock(vendor.id, product.id, 5);

  const unavailPayload = await waitItemUnavailable;
  assert.strictEqual(unavailPayload.productId, product.id);
  assert.strictEqual(unavailPayload.availableStock, 5);
  assert.strictEqual(unavailPayload.cartQuantity, 8);
  assert.strictEqual(unavailPayload.reason, 'insufficient_stock');
  console.log('  √ 4.3 Stock reduction emits cart:itemUnavailable (reason: insufficient_stock)');

  // Vendor updates stock to 0
  const waitOutOfStock = waitForEvent(client2, 'cart:itemUnavailable');
  await updateStock(vendor.id, product.id, 0);

  const outOfStockPayload = await waitOutOfStock;
  assert.strictEqual(outOfStockPayload.availableStock, 0);
  assert.strictEqual(outOfStockPayload.reason, 'out_of_stock');
  console.log('  √ 4.4 Stock to 0 emits cart:itemUnavailable (reason: out_of_stock)');

  // 4. Admin disables product -> availabilityChanged & cart:itemUnavailable (product_disabled)
  const waitAdminDisabled = waitForEvent(client1, 'product:availabilityChanged');
  const waitAdminDisabledCart = waitForEvent(client2, 'cart:itemUnavailable');
  await disableProduct(product.id);

  const adminDisPayload = await waitAdminDisabled;
  assert.strictEqual(adminDisPayload.isVisible, false);
  const adminDisCartPayload = await waitAdminDisabledCart;
  assert.strictEqual(adminDisCartPayload.reason, 'product_disabled');
  console.log('  √ 4.5 Admin disable emits product:availabilityChanged and cart:itemUnavailable');

  // 5. Vendor deletes product -> availabilityChanged & cart:itemUnavailable (product_deleted)
  const waitDeleted = waitForEvent(client1, 'product:availabilityChanged');
  const waitDeletedCart = waitForEvent(client2, 'cart:itemUnavailable');
  await deleteProduct(vendor.id, product.id);

  const delPayload = await waitDeleted;
  assert.strictEqual(delPayload.isVisible, false);
  const delCartPayload = await waitDeletedCart;
  assert.strictEqual(delCartPayload.reason, 'product_deleted');
  console.log('  √ 4.6 Vendor soft-delete emits product:availabilityChanged and cart:itemUnavailable');

  // 6. Webhook checkout.session.expired stock restore test
  // Create a clean dedicated product for webhook test
  const webhookProduct = await Product.create({
    vendorId: vendor.id,
    categoryId: category.id,
    name: 'Webhook Expire Pizza',
    price: 20.0,
    stock: 5,
    isAvailable: true,
    isDisabledByAdmin: false,
  });

  // Subscribe client1 to webhookProduct
  await new Promise((r) => client1.emit('product:subscribe', { productIds: [webhookProduct.id] }, r));

  const mockSessionId = `cs_test_mock_${Date.now()}`;
  const mockOrderId = (
    await Order.create({
      customerId: customer1.id,
      addressSnapshot: {},
      totalAmount: 40.0,
      currency: 'USD',
      paymentMethod: 'ONLINE',
      paymentStatus: 'pending',
    })
  ).id;

  await OrderItem.create({
    orderId: mockOrderId,
    vendorId: vendor.id,
    productId: webhookProduct.id,
    productName: webhookProduct.name,
    priceAtPurchase: 20.0,
    quantity: 2,
    status: 'pending_payment',
  });

  await Payment.create({
    orderId: mockOrderId,
    provider: 'stripe',
    amount: 40.0,
    currency: 'USD',
    status: 'pending',
    providerSessionId: mockSessionId,
  });

  // Mock constructWebhookEvent for this test
  const originalConstruct = stripeService.constructWebhookEvent;
  const expiredEventId = `evt_mock_expired_${Date.now()}`;
  stripeService.constructWebhookEvent = () => ({
    id: expiredEventId,
    type: 'checkout.session.expired',
    data: {
      object: {
        id: mockSessionId,
        metadata: { orderId: mockOrderId },
      },
    },
  });

  const waitExpiredStock = waitForEvent(client1, 'product:stockUpdated');
  await handleStripeWebhook('{}', 'sig');

  const expiredStockPayload = await waitExpiredStock;
  assert.strictEqual(expiredStockPayload.productId, webhookProduct.id);
  assert.strictEqual(expiredStockPayload.stock, 7); // 5 + 2
  assert.strictEqual(expiredStockPayload.reason, 'payment_expired');
  console.log('  √ 4.7 Webhook checkout.session.expired restores stock and emits product:stockUpdated');

  // Restore mock
  stripeService.constructWebhookEvent = originalConstruct;

  client1.close();
  client2.close();

  // Cleanup
  await CartItem.destroy({ where: { customerId: [customer1.id, customer2.id] } });
  await OrderItem.destroy({ where: { orderId: [placedOrder.id, mockOrderId] } });
  await Payment.destroy({ where: { orderId: [placedOrder.id, mockOrderId] } });
  await Order.destroy({ where: { id: [placedOrder.id, mockOrderId] } });
  await StripeEvent.destroy({ where: { eventId: expiredEventId } });
  await address1.destroy();
  await product.destroy({ force: true });
  await webhookProduct.destroy({ force: true });
  await customer1.destroy();
  await customer2.destroy();
  await vendor.destroy();
}

module.exports = { runCategory4 };
