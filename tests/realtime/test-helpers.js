const http = require('http');
const { io: Client } = require('socket.io-client');
const app = require('../../src/app');
const { initSocketServer, closeSocketServer, getIO } = require('../../src/realtime/socket.server');
const { initModels, sequelize } = require('../../src/config/database');
const { signToken } = require('../../src/common/utils/jwt');
const Customer = require('../../src/v1/modules/customer/models/customer.model');
const Vendor = require('../../src/v1/modules/vendor/models/vendor.model');
const Admin = require('../../src/v1/modules/admin/models/admin.model');
const Product = require('../../src/v1/modules/vendor/models/product.model');
const Category = require('../../src/v1/modules/admin/models/category.model');
const CartItem = require('../../src/v1/modules/customer/models/cartItem.model');
const Address = require('../../src/v1/modules/customer/models/address.model');
const Order = require('../../src/v1/modules/customer/models/order.model');
const OrderItem = require('../../src/v1/modules/customer/models/orderItem.model');
const Payment = require('../../src/v1/modules/customer/models/payment.model');
const StripeEvent = require('../../src/v1/modules/customer/models/stripeEvent.model');

/**
 * Boots the HTTP test server and attaches Socket.IO.
 */
async function setupTestServer() {
  await initModels();

  const server = http.createServer(app);
  const io = initSocketServer(server);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const url = `http://localhost:${port}`;

  const cleanup = async () => {
    closeSocketServer();
    await new Promise((resolve) => server.close(resolve));
  };

  return { server, port, url, io, cleanup };
}

/**
 * Creates a socket client configured for testing.
 */
function connectClient(url, token, options = {}) {
  const auth = token !== undefined ? { token } : {};
  return Client(url, {
    auth,
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    ...options,
  });
}

/**
 * Connects a socket and resolves once connected.
 */
function connectAndReady(url, token, options = {}) {
  return new Promise((resolve, reject) => {
    const client = connectClient(url, token, options);
    client.on('connect', () => resolve(client));
    client.on('connect_error', (err) => {
      client.close();
      reject(err);
    });
  });
}

/**
 * Waits for a specific event to fire within timeoutMs.
 */
function waitForEvent(socket, eventName, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event '${eventName}' after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

/**
 * Ensures an event is NOT emitted during a quiet window.
 */
function ensureNoEvent(socket, eventName, windowMs = 500) {
  return new Promise((resolve, reject) => {
    const handler = (data) => {
      reject(new Error(`Unexpected event '${eventName}' received: ${JSON.stringify(data)}`));
    };

    socket.once(eventName, handler);
    setTimeout(() => {
      socket.off(eventName, handler);
      resolve();
    }, windowMs);
  });
}

module.exports = {
  setupTestServer,
  connectClient,
  connectAndReady,
  waitForEvent,
  ensureNoEvent,
  signToken,
  models: {
    Customer,
    Vendor,
    Admin,
    Product,
    Category,
    CartItem,
    Address,
    Order,
    OrderItem,
    Payment,
    StripeEvent,
  },
};
