const { CLIENT_EVENTS } = require('./events');
const ROLES = require('../common/constants/roles');
const VENDOR_STATUS = require('../common/constants/vendorStatus');
const env = require('../config/env');
const Product = require('../v1/modules/vendor/models/product.model');
const Vendor = require('../v1/modules/vendor/models/vendor.model');
const { registerUserSocket, removeUserSocket } = require('./socket.auth');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Simple in-memory rate limiter per socket connection.
 * Window: 10 seconds, Max events: 60.
 */
class SocketRateLimiter {
  constructor(limit = 60, windowMs = 10000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.timestamps = [];
  }

  isAllowed() {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((ts) => now - ts < this.windowMs);
    if (this.timestamps.length >= this.limit) {
      return false;
    }
    this.timestamps.push(now);
    return true;
  }
}

/**
 * Registers Socket.IO connection and client event handlers.
 */
const registerSocketHandlers = (io, socket) => {
  const { user } = socket;
  socket.subscriptions = new Set();
  const rateLimiter = new SocketRateLimiter(60, 10000);

  // 1. Join personal notification room
  if (user.role === ROLES.CUSTOMER) {
    socket.join(`customer:${user.id}`);
  } else if (user.role === ROLES.VENDOR) {
    socket.join(`vendor:${user.id}`);
  } else if (user.role === ROLES.ADMIN) {
    socket.join('admin');
  }

  // Register in user-to-socket registry
  registerUserSocket(user.id, socket.id);

  // Clean up on disconnect
  socket.on('disconnect', () => {
    removeUserSocket(user.id, socket.id);
  });

  // 2. Handle product:subscribe
  socket.on(CLIENT_EVENTS.PRODUCT_SUBSCRIBE, async (data, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    if (!rateLimiter.isAllowed()) {
      return ack({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
      });
    }

    try {
      const rawIds = Array.isArray(data?.productIds)
        ? data.productIds
        : Array.isArray(data)
        ? data
        : [];

      if (!Array.isArray(rawIds) || rawIds.length === 0) {
        return ack({
          success: false,
          error: 'INVALID_PAYLOAD',
          message: 'productIds must be a non-empty array of UUIDs.',
        });
      }

      // Check max subscriptions limit
      const uniqueRequestedIds = [...new Set(rawIds)];
      const totalFutureSubscriptions = socket.subscriptions.size + uniqueRequestedIds.length;

      if (totalFutureSubscriptions > env.SOCKET_MAX_SUBSCRIPTIONS) {
        return ack({
          success: false,
          error: 'MAX_SUBSCRIPTIONS_EXCEEDED',
          message: `Subscription limit exceeded. Maximum allowed per connection is ${env.SOCKET_MAX_SUBSCRIPTIONS}.`,
          currentCount: socket.subscriptions.size,
          maxLimit: env.SOCKET_MAX_SUBSCRIPTIONS,
        });
      }

      // Filter valid UUID formats
      const validFormatIds = [];
      const invalidFormatIds = [];

      for (const id of uniqueRequestedIds) {
        if (typeof id === 'string' && UUID_REGEX.test(id)) {
          validFormatIds.push(id);
        } else {
          invalidFormatIds.push(id);
        }
      }

      if (validFormatIds.length === 0) {
        return ack({
          success: false,
          error: 'INVALID_PRODUCT_IDS',
          message: 'None of the provided productIds are valid UUIDs.',
          rejected: invalidFormatIds,
        });
      }

      // Query database for visible products only:
      // (approved vendor with completed profile, available, not disabled by admin, not soft-deleted)
      const visibleProducts = await Product.findAll({
        where: {
          id: validFormatIds,
          isAvailable: true,
          isDisabledByAdmin: false,
        },
        include: [
          {
            model: Vendor,
            as: 'vendor',
            where: {
              status: VENDOR_STATUS.APPROVED,
              profileCompleted: true,
            },
            attributes: ['id'],
          },
        ],
        attributes: ['id'],
      });

      const visibleIdSet = new Set(visibleProducts.map((p) => p.id));
      const subscribed = [];
      const rejected = [...invalidFormatIds];

      for (const id of validFormatIds) {
        if (visibleIdSet.has(id)) {
          socket.join(`product:${id}`);
          socket.subscriptions.add(id);
          subscribed.push(id);
        } else {
          rejected.push(id);
        }
      }

      return ack({
        success: true,
        subscribed,
        rejected,
        totalSubscriptions: socket.subscriptions.size,
      });
    } catch (err) {
      console.error('[Socket Handler Error] product:subscribe failed:', err.message);
      return ack({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Could not process subscription request.',
      });
    }
  });

  // 3. Handle product:unsubscribe
  socket.on(CLIENT_EVENTS.PRODUCT_UNSUBSCRIBE, (data, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    if (!rateLimiter.isAllowed()) {
      return ack({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
      });
    }

    try {
      const rawIds = Array.isArray(data?.productIds)
        ? data.productIds
        : Array.isArray(data)
        ? data
        : [];

      const unsubscribed = [];

      for (const id of rawIds) {
        if (typeof id === 'string' && socket.subscriptions.has(id)) {
          socket.leave(`product:${id}`);
          socket.subscriptions.delete(id);
          unsubscribed.push(id);
        }
      }

      return ack({
        success: true,
        unsubscribed,
        totalSubscriptions: socket.subscriptions.size,
      });
    } catch (err) {
      console.error('[Socket Handler Error] product:unsubscribe failed:', err.message);
      return ack({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Could not process unsubscription request.',
      });
    }
  });
};

module.exports = {
  registerSocketHandlers,
};

