const ITEM_STATUS = Object.freeze({
  PENDING_PAYMENT: 'pending_payment',
  PLACED: 'placed',
  PREPARING: 'preparing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

const ITEM_STATUS_FLOW = Object.freeze([
  ITEM_STATUS.PENDING_PAYMENT,
  ITEM_STATUS.PLACED,
  ITEM_STATUS.PREPARING,
  ITEM_STATUS.OUT_FOR_DELIVERY,
  ITEM_STATUS.DELIVERED,
]);

const NEXT_ITEM_STATUS = Object.freeze({
  [ITEM_STATUS.PENDING_PAYMENT]: ITEM_STATUS.PLACED,
  [ITEM_STATUS.PLACED]: ITEM_STATUS.PREPARING,
  [ITEM_STATUS.PREPARING]: ITEM_STATUS.OUT_FOR_DELIVERY,
  [ITEM_STATUS.OUT_FOR_DELIVERY]: ITEM_STATUS.DELIVERED,
});

const DERIVED_ORDER_STATUS = Object.freeze({
  PENDING_PAYMENT: 'pending_payment',
  PLACED: 'placed',
  IN_PROGRESS: 'in_progress',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

const PAYMENT_METHOD = Object.freeze({
  COD: 'COD',
  ONLINE: 'ONLINE',
});

module.exports = {
  ITEM_STATUS,
  ITEM_STATUS_FLOW,
  NEXT_ITEM_STATUS,
  DERIVED_ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
};
