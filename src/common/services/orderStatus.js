const {
  ITEM_STATUS,
  ITEM_STATUS_FLOW,
  NEXT_ITEM_STATUS,
  DERIVED_ORDER_STATUS,
  PAYMENT_STATUS,
} = require('../constants/orderStatus');
const ApiError = require('../utils/ApiError');
const ERROR_CODES = require('../constants/errorCodes');

/**
 * Returns the next status in the sequential lifecycle flow.
 * Returns null if status cannot advance (e.g. already delivered or cancelled).
 */
const getNextStatus = (currentStatus) => {
  return NEXT_ITEM_STATUS[currentStatus] || null;
};

/**
 * Validates whether transition from currentStatus to targetStatus is allowed.
 * Must move exactly one step forward:
 * pending_payment -> placed -> preparing -> out_for_delivery -> delivered.
 * No skipping, no going backward, nothing after delivered or cancelled.
 */
const validateStatusTransition = (currentStatus, targetStatus) => {
  const allowedNext = getNextStatus(currentStatus);
  if (!allowedNext || allowedNext !== targetStatus) {
    throw ApiError.badRequest(
      ERROR_CODES.INVALID_STATUS_TRANSITION,
      `Invalid item status transition from '${currentStatus}' to '${targetStatus}'. Next allowed status is '${allowedNext || 'none'}'.`
    );
  }
};

/**
 * Computes derived order status on read based on all items in the order:
 * - 'pending_payment' if all items are pending_payment
 * - 'placed' if all items are placed
 * - 'delivered' if all items are delivered
 * - 'cancelled' if all items are cancelled
 * - 'in_progress' otherwise
 */
const computeDerivedOrderStatus = (items = []) => {
  if (!items || items.length === 0) {
    return DERIVED_ORDER_STATUS.PLACED;
  }

  const allPendingPayment = items.every((item) => item.status === ITEM_STATUS.PENDING_PAYMENT);
  if (allPendingPayment) {
    return DERIVED_ORDER_STATUS.PENDING_PAYMENT;
  }

  const allPlaced = items.every((item) => item.status === ITEM_STATUS.PLACED);
  if (allPlaced) {
    return DERIVED_ORDER_STATUS.PLACED;
  }

  const allDelivered = items.every((item) => item.status === ITEM_STATUS.DELIVERED);
  if (allDelivered) {
    return DERIVED_ORDER_STATUS.DELIVERED;
  }

  const allCancelled = items.every((item) => item.status === ITEM_STATUS.CANCELLED);
  if (allCancelled) {
    return DERIVED_ORDER_STATUS.CANCELLED;
  }

  return DERIVED_ORDER_STATUS.IN_PROGRESS;
};

/**
 * Computes payment status:
 * If order has stored payment status (paid, refunded, failed), preserve it.
 * For COD orders (pending), becomes 'paid' when all non-cancelled items are delivered.
 */
const computePaymentStatus = (items = [], currentOrderPaymentStatus = null) => {
  if (currentOrderPaymentStatus === PAYMENT_STATUS.REFUNDED) {
    return PAYMENT_STATUS.REFUNDED;
  }
  if (currentOrderPaymentStatus === PAYMENT_STATUS.FAILED) {
    return PAYMENT_STATUS.FAILED;
  }
  if (currentOrderPaymentStatus === PAYMENT_STATUS.PAID) {
    return PAYMENT_STATUS.PAID;
  }
  if (!items || items.length === 0) {
    return currentOrderPaymentStatus || PAYMENT_STATUS.PENDING;
  }

  const nonCancelledItems = items.filter((item) => item.status !== ITEM_STATUS.CANCELLED);
  if (nonCancelledItems.length === 0) {
    return currentOrderPaymentStatus || PAYMENT_STATUS.PENDING;
  }

  const allDelivered = nonCancelledItems.every((item) => item.status === ITEM_STATUS.DELIVERED);
  return allDelivered ? PAYMENT_STATUS.PAID : (currentOrderPaymentStatus || PAYMENT_STATUS.PENDING);
};

/**
 * Checks whether an order is cancellable:
 * Cancel is allowed only if ALL items are 'placed' (or all are 'pending_payment');
 * otherwise false.
 */
const isOrderCancellable = (items = []) => {
  if (!items || items.length === 0) return false;
  const allPlaced = items.every((item) => item.status === ITEM_STATUS.PLACED);
  const allPendingPayment = items.every((item) => item.status === ITEM_STATUS.PENDING_PAYMENT);
  return allPlaced || allPendingPayment;
};

module.exports = {
  ITEM_STATUS,
  ITEM_STATUS_FLOW,
  NEXT_ITEM_STATUS,
  DERIVED_ORDER_STATUS,
  PAYMENT_STATUS,
  getNextStatus,
  validateStatusTransition,
  computeDerivedOrderStatus,
  computePaymentStatus,
  isOrderCancellable,
};
