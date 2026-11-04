/**
 * Real-time event name constants, reason enums, and sanitized payload builders.
 * All outgoing payloads carry absolute values and ISO 8601 updatedAt timestamps.
 * Payloads contain ONLY public product/cart data and NEVER expose customer details,
 * vendor private records, emails, phone numbers, or authentication secrets.
 */

const CLIENT_EVENTS = Object.freeze({
  PRODUCT_SUBSCRIBE: 'product:subscribe',
  PRODUCT_UNSUBSCRIBE: 'product:unsubscribe',
});

const SERVER_EVENTS = Object.freeze({
  PRODUCT_PRICE_UPDATED: 'product:priceUpdated',
  CART_PRICE_CHANGED: 'cart:priceChanged',
  PRODUCT_STOCK_UPDATED: 'product:stockUpdated',
  PRODUCT_AVAILABILITY_CHANGED: 'product:availabilityChanged',
  CART_ITEM_UNAVAILABLE: 'cart:itemUnavailable',
});

const STOCK_UPDATE_REASONS = Object.freeze({
  ORDER_PLACED: 'order_placed',
  ORDER_CANCELLED: 'order_cancelled',
  PAYMENT_EXPIRED: 'payment_expired',
  REFUND_RESTOCK: 'refund_restock',
  VENDOR_UPDATE: 'vendor_update',
  ORDER_ROLLBACK: 'order_rollback',
});

const ITEM_UNAVAILABLE_REASONS = Object.freeze({
  OUT_OF_STOCK: 'out_of_stock',
  INSUFFICIENT_STOCK: 'insufficient_stock',
  PRODUCT_DISABLED: 'product_disabled',
  PRODUCT_DELETED: 'product_deleted',
  PRODUCT_UNAVAILABLE: 'product_unavailable',
});

/**
 * Payload builder for product:priceUpdated
 * Sent to room product:<id>
 */
const buildPriceUpdatedPayload = ({ productId, oldPrice, newPrice, currency = 'USD' }) => {
  return {
    productId,
    oldPrice: Number(parseFloat(oldPrice).toFixed(2)),
    newPrice: Number(parseFloat(newPrice).toFixed(2)),
    currency,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Payload builder for cart:priceChanged
 * Sent to room customer:<id>
 */
const buildCartPriceChangedPayload = ({
  productId,
  oldPrice,
  newPrice,
  quantity,
  newLineTotal,
}) => {
  const parsedNewPrice = parseFloat(newPrice);
  const calculatedLineTotal =
    newLineTotal !== undefined
      ? Number(parseFloat(newLineTotal).toFixed(2))
      : Number((parsedNewPrice * quantity).toFixed(2));

  return {
    productId,
    oldPrice: Number(parseFloat(oldPrice).toFixed(2)),
    newPrice: Number(parsedNewPrice.toFixed(2)),
    quantity: Number(quantity),
    newLineTotal: calculatedLineTotal,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Payload builder for product:stockUpdated
 * Sent to room product:<id>
 */
const buildStockUpdatedPayload = ({ productId, stock, reason }) => {
  const stockNum = Math.max(0, parseInt(stock, 10) || 0);
  return {
    productId,
    stock: stockNum,
    inStock: stockNum > 0,
    reason,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Payload builder for product:availabilityChanged
 * Sent to room product:<id>
 */
const buildAvailabilityChangedPayload = ({ productId, isVisible }) => {
  return {
    productId,
    isVisible: Boolean(isVisible),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Payload builder for cart:itemUnavailable
 * Sent to room customer:<id>
 */
const buildCartItemUnavailablePayload = ({
  productId,
  availableStock = 0,
  cartQuantity,
  reason,
}) => {
  return {
    productId,
    availableStock: Math.max(0, parseInt(availableStock, 10) || 0),
    cartQuantity: Number(cartQuantity),
    reason,
    updatedAt: new Date().toISOString(),
  };
};

module.exports = {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  STOCK_UPDATE_REASONS,
  ITEM_UNAVAILABLE_REASONS,
  buildPriceUpdatedPayload,
  buildCartPriceChangedPayload,
  buildStockUpdatedPayload,
  buildAvailabilityChangedPayload,
  buildCartItemUnavailablePayload,
};

