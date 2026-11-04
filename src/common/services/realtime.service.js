const { getIO } = require('../../realtime/socket.server');
const {
  SERVER_EVENTS,
  buildPriceUpdatedPayload,
  buildCartPriceChangedPayload,
  buildStockUpdatedPayload,
  buildAvailabilityChangedPayload,
  buildCartItemUnavailablePayload,
} = require('../../realtime/events');
const { getUserSockets } = require('../../realtime/socket.auth');

/**
 * Real-time event broadcasting service.
 * This is the ONLY interface invoked by business logic.
 *
 * Guarantees:
 * 1. Safe no-op when Socket.IO is not initialized (CLI tasks, cron scripts, isolated unit tests).
 * 2. Catches and logs all emit errors; NEVER throws or fails the surrounding business flow.
 * 3. Sends absolute values with ISO timestamps.
 * 4. Extensible to Socket.IO Redis adapter for horizontal scaling.
 */
class RealtimeService {
  /**
   * Helper to retrieve active io instance or null.
   * @private
   */
  _getIO() {
    try {
      return getIO();
    } catch (_) {
      return null;
    }
  }

  /**
   * Emits a price update event to all subscribers of a product.
   * Emits only if the price has genuinely changed.
   *
   * @param {Object} params
   * @param {string} params.productId - Product UUID
   * @param {number|string} params.oldPrice - Previous price
   * @param {number|string} params.newPrice - New price
   * @param {string} [params.currency='USD'] - Currency
   */
  emitPriceUpdated({ productId, oldPrice, newPrice, currency = 'USD' }) {
    try {
      const io = this._getIO();
      if (!io || !productId) return;

      const numOld = parseFloat(oldPrice);
      const numNew = parseFloat(newPrice);

      // Rule: Emit ONLY if the price actually changed
      if (!isNaN(numOld) && !isNaN(numNew) && numOld === numNew) {
        return;
      }

      const payload = buildPriceUpdatedPayload({
        productId,
        oldPrice: numOld,
        newPrice: numNew,
        currency,
      });

      io.to(`product:${productId}`).emit(SERVER_EVENTS.PRODUCT_PRICE_UPDATED, payload);
    } catch (err) {
      console.error(`[RealtimeService Error] emitPriceUpdated failed for product ${productId}:`, err.message);
    }
  }

  /**
   * Emits a personalized cart price change notification to a specific customer's room.
   *
   * @param {Object} params
   * @param {string} params.customerId - Customer UUID
   * @param {string} params.productId - Product UUID
   * @param {number|string} params.oldPrice - Previous price
   * @param {number|string} params.newPrice - New price
   * @param {number} params.quantity - Quantity in customer's cart
   * @param {number|string} [params.newLineTotal] - Computed total for the cart item line
   */
  emitCartPriceChanged({ customerId, productId, oldPrice, newPrice, quantity, newLineTotal }) {
    try {
      const io = this._getIO();
      if (!io || !customerId || !productId) return;

      const payload = buildCartPriceChangedPayload({
        productId,
        oldPrice,
        newPrice,
        quantity,
        newLineTotal,
      });

      io.to(`customer:${customerId}`).emit(SERVER_EVENTS.CART_PRICE_CHANGED, payload);
    } catch (err) {
      console.error(`[RealtimeService Error] emitCartPriceChanged failed for customer ${customerId}:`, err.message);
    }
  }

  /**
   * Emits stock level update to all clients viewing the product.
   * Multiple products in one operation should each call this individually.
   *
   * @param {Object} params
   * @param {string} params.productId - Product UUID
   * @param {number} params.stock - Latest real stock count
   * @param {string} params.reason - One of STOCK_UPDATE_REASONS
   */
  emitStockUpdated({ productId, stock, reason }) {
    try {
      const io = this._getIO();
      if (!io || !productId) return;

      const payload = buildStockUpdatedPayload({
        productId,
        stock,
        reason,
      });

      io.to(`product:${productId}`).emit(SERVER_EVENTS.PRODUCT_STOCK_UPDATED, payload);
    } catch (err) {
      console.error(`[RealtimeService Error] emitStockUpdated failed for product ${productId}:`, err.message);
    }
  }

  /**
   * Emits availability changes (enabled, disabled by admin, vendor toggled, soft deleted).
   *
   * @param {Object} params
   * @param {string} params.productId - Product UUID
   * @param {boolean} params.isVisible - Whether product is visible to customers
   */
  emitProductAvailabilityChanged({ productId, isVisible }) {
    try {
      const io = this._getIO();
      if (!io || !productId) return;

      const payload = buildAvailabilityChangedPayload({
        productId,
        isVisible,
      });

      io.to(`product:${productId}`).emit(SERVER_EVENTS.PRODUCT_AVAILABILITY_CHANGED, payload);
    } catch (err) {
      console.error(`[RealtimeService Error] emitProductAvailabilityChanged failed for product ${productId}:`, err.message);
    }
  }

  /**
   * Emits notification to a specific customer that a cart item's requested quantity
   * exceeds current available inventory, or the product has been disabled/deleted.
   *
   * @param {Object} params
   * @param {string} params.customerId - Customer UUID
   * @param {string} params.productId - Product UUID
   * @param {number} params.availableStock - Real remaining stock
   * @param {number} params.cartQuantity - Quantity currently in customer's cart
   * @param {string} params.reason - Reason from ITEM_UNAVAILABLE_REASONS
   */
  emitCartItemUnavailable({ customerId, productId, availableStock, cartQuantity, reason }) {
    try {
      const io = this._getIO();
      if (!io || !customerId || !productId) return;

      const payload = buildCartItemUnavailablePayload({
        productId,
        availableStock,
        cartQuantity,
        reason,
      });

      io.to(`customer:${customerId}`).emit(SERVER_EVENTS.CART_ITEM_UNAVAILABLE, payload);
    } catch (err) {
      console.error(`[RealtimeService Error] emitCartItemUnavailable failed for customer ${customerId}:`, err.message);
    }
  }

  /**
   * Immediately terminates all active socket connections for a blocked customer or vendor.
   *
   * @param {string} userId - User UUID
   * @param {string} [role] - User role ('customer' or 'vendor')
   */
  disconnectUser(userId, role) {
    try {
      const io = this._getIO();
      if (!io || !userId) return;

      // 1. Disconnect via personal room if role provided
      if (role === 'customer') {
        io.in(`customer:${userId}`).disconnectSockets(true);
      } else if (role === 'vendor') {
        io.in(`vendor:${userId}`).disconnectSockets(true);
      }

      // 2. Also disconnect directly via active sockets registry
      const socketIds = getUserSockets(userId);
      if (socketIds && socketIds.size > 0) {
        for (const sId of socketIds) {
          const socket = io.sockets.sockets.get(sId);
          if (socket) {
            socket.disconnect(true);
          }
        }
      }
    } catch (err) {
      console.error(`[RealtimeService Error] disconnectUser failed for user ${userId}:`, err.message);
    }
  }
}

module.exports = new RealtimeService();

