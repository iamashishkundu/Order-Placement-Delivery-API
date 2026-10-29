const Order = require('../../../customer/models/order.model');
const OrderItem = require('../../../customer/models/orderItem.model');
const {
  validateStatusTransition,
  computeDerivedOrderStatus,
  computePaymentStatus,
} = require('../../../../../common/services/orderStatus');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const updateItemStatus = async (vendorId, orderId, { status: targetStatus }) => {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: OrderItem,
        as: 'items',
      },
    ],
  });

  if (!order) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Order not found with ID ${orderId}.`);
  }

  // Filter vendor's items in this order
  const vendorItems = order.items.filter((item) => item.vendorId === vendorId);
  if (vendorItems.length === 0) {
    throw ApiError.forbidden(
      ERROR_CODES.FORBIDDEN,
      'Access forbidden: You have no items in this order.'
    );
  }

  // Check each item transition: must move exactly one step forward
  for (const item of vendorItems) {
    validateStatusTransition(item.status, targetStatus);
  }

  // Update all vendor items together
  for (const item of vendorItems) {
    item.status = targetStatus;
    await item.save();
  }

  // Reload all order items to recalculate payment status if necessary
  const allUpdatedItems = await OrderItem.findAll({
    where: { orderId },
  });

  const updatedPaymentStatus = computePaymentStatus(allUpdatedItems);
  if (order.paymentStatus !== updatedPaymentStatus) {
    order.paymentStatus = updatedPaymentStatus;
    await order.save();
  }

  const derivedOrderStatus = computeDerivedOrderStatus(allUpdatedItems);

  return {
    message: `Order items updated to '${targetStatus}'.`,
    items: vendorItems,
    orderDerivedStatus: derivedOrderStatus,
    paymentStatus: order.paymentStatus,
  };
};

module.exports = {
  updateItemStatus,
};

