const Order = require('../../models/order.model');
const OrderItem = require('../../models/orderItem.model');
const Vendor = require('../../../vendor/models/vendor.model');
const {
  computeDerivedOrderStatus,
  computePaymentStatus,
} = require('../../../../../common/services/orderStatus');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const getOrder = async (customerId, orderId) => {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Vendor,
            as: 'vendor',
            attributes: ['id', 'shopName', 'ownerName', 'city', 'state'],
          },
        ],
      },
    ],
  });

  if (!order) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Order not found with ID ${orderId}.`);
  }

  if (order.customerId !== customerId) {
    throw ApiError.forbidden(
      ERROR_CODES.FORBIDDEN,
      'Access forbidden: You cannot access another customer’s order.'
    );
  }

  const o = order.toJSON();
  const derivedStatus = computeDerivedOrderStatus(o.items);
  const paymentStatus = computePaymentStatus(o.items, o.paymentStatus);

  // Group items by vendor
  const vendorGroups = {};
  (o.items || []).forEach((item) => {
    const vId = item.vendorId;
    if (!vendorGroups[vId]) {
      vendorGroups[vId] = {
        vendor: item.vendor,
        items: [],
      };
    }
    vendorGroups[vId].items.push(item);
  });

  const vendorSplit = Object.values(vendorGroups);

  return {
    ...o,
    derivedStatus,
    paymentStatus,
    vendors: vendorSplit,
  };
};

module.exports = {
  getOrder,
};

