const Order = require('../../../customer/models/order.model');
const OrderItem = require('../../../customer/models/orderItem.model');
const Customer = require('../../../customer/models/customer.model');
const Vendor = require('../../../vendor/models/vendor.model');
const Payment = require('../../../customer/models/payment.model');
const {
  computeDerivedOrderStatus,
  computePaymentStatus,
} = require('../../../../../common/services/orderStatus');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const getOrder = async (orderId) => {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'phone', 'email'],
      },
      {
        model: Payment,
        as: 'payment',
      },
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Vendor,
            as: 'vendor',
            attributes: ['id', 'shopName', 'ownerName', 'email', 'phone', 'status'],
          },
        ],
      },
    ],
  });

  if (!order) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Order not found with ID ${orderId}.`);
  }

  const orderJson = order.toJSON();
  const derivedStatus = computeDerivedOrderStatus(orderJson.items);
  const paymentStatus = computePaymentStatus(orderJson.items, order.paymentStatus);
  const isDisputed = Boolean(orderJson.payment && orderJson.payment.disputeId);

  // Group items by vendor with per-vendor status summary
  const vendorGroups = {};
  (orderJson.items || []).forEach((item) => {
    const vId = item.vendorId;
    if (!vendorGroups[vId]) {
      vendorGroups[vId] = {
        vendor: item.vendor,
        items: [],
        itemStatuses: new Set(),
      };
    }
    vendorGroups[vId].items.push(item);
    vendorGroups[vId].itemStatuses.add(item.status);
  });

  const vendorsSummary = Object.keys(vendorGroups).map((vId) => ({
    vendor: vendorGroups[vId].vendor,
    itemStatuses: Array.from(vendorGroups[vId].itemStatuses),
    items: vendorGroups[vId].items,
  }));

  const paymentDetails = orderJson.payment
    ? {
        id: orderJson.payment.id,
        provider: orderJson.payment.provider,
        status: orderJson.payment.status,
        amount: orderJson.payment.amount,
        currency: orderJson.payment.currency,
        refundId: orderJson.payment.refundId,
        refundedAmount: orderJson.payment.refundedAmount,
        providerSessionId: orderJson.payment.providerSessionId,
        providerPaymentIntentId: orderJson.payment.providerPaymentIntentId,
        dispute: orderJson.payment.disputeId
          ? {
              disputeId: orderJson.payment.disputeId,
              disputeStatus: orderJson.payment.disputeStatus,
              disputeReason: orderJson.payment.disputeReason,
              disputeAmount: orderJson.payment.disputeAmount,
              disputeDueBy: orderJson.payment.disputeDueBy,
              disputeOpenedAt: orderJson.payment.disputeOpenedAt,
              disputeClosedAt: orderJson.payment.disputeClosedAt,
            }
          : null,
      }
    : null;

  const disputeDetails =
    orderJson.payment && orderJson.payment.disputeId
      ? {
          disputeId: orderJson.payment.disputeId,
          disputeStatus: orderJson.payment.disputeStatus,
          disputeReason: orderJson.payment.disputeReason,
          disputeAmount: orderJson.payment.disputeAmount,
          disputeDueBy: orderJson.payment.disputeDueBy,
          disputeOpenedAt: orderJson.payment.disputeOpenedAt,
          disputeClosedAt: orderJson.payment.disputeClosedAt,
        }
      : null;

  return {
    ...orderJson,
    derivedStatus,
    paymentStatus,
    isDisputed,
    payment: paymentDetails,
    disputeDetails,
    vendorsSummary,
  };
};

module.exports = {
  getOrder,
};
