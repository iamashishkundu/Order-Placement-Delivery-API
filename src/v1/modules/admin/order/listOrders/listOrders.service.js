const { Op } = require('sequelize');
const Order = require('../../../customer/models/order.model');
const OrderItem = require('../../../customer/models/orderItem.model');
const Customer = require('../../../customer/models/customer.model');
const Vendor = require('../../../vendor/models/vendor.model');
const Payment = require('../../../customer/models/payment.model');
const {
  computeDerivedOrderStatus,
  computePaymentStatus,
} = require('../../../../../common/services/orderStatus');

const listOrders = async ({
  status,
  paymentMethod,
  paymentStatus,
  disputed,
  vendorId,
  customerId,
  from,
  to,
  page = 1,
  limit = 20,
}) => {
  const where = {};

  if (customerId) {
    where.customerId = customerId;
  }

  if (paymentMethod) {
    where.paymentMethod = paymentMethod;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) {
      where.createdAt[Op.gte] = new Date(from);
    }
    if (to) {
      where.createdAt[Op.lte] = new Date(to);
    }
  }

  const itemWhere = {};
  if (vendorId) {
    itemWhere.vendorId = vendorId;
  }

  // Fetch orders with customer, payment, and items
  const orders = await Order.findAll({
    where,
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
        where: Object.keys(itemWhere).length > 0 ? itemWhere : undefined,
        required: Object.keys(itemWhere).length > 0,
        include: [
          {
            model: Vendor,
            as: 'vendor',
            attributes: ['id', 'shopName', 'ownerName', 'email', 'phone'],
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  // Calculate derived status and payment status for each order
  let processedOrders = orders.map((order) => {
    const orderJson = order.toJSON();
    const derivedStatus = computeDerivedOrderStatus(orderJson.items);
    const calculatedPaymentStatus = computePaymentStatus(
      orderJson.items,
      order.paymentStatus
    );
    const isDisputed = Boolean(orderJson.payment && orderJson.payment.disputeId);

    return {
      ...orderJson,
      derivedStatus,
      paymentStatus: calculatedPaymentStatus,
      isDisputed,
      disputeDetails: isDisputed
        ? {
            disputeId: orderJson.payment.disputeId,
            disputeStatus: orderJson.payment.disputeStatus,
            disputeReason: orderJson.payment.disputeReason,
            disputeAmount: orderJson.payment.disputeAmount,
            disputeDueBy: orderJson.payment.disputeDueBy,
          }
        : null,
    };
  });

  // Filter by derived status if specified
  if (status) {
    processedOrders = processedOrders.filter((o) => o.derivedStatus === status);
  }

  // Filter by paymentStatus if specified
  if (paymentStatus) {
    processedOrders = processedOrders.filter((o) => o.paymentStatus === paymentStatus);
  }

  // Filter by disputed if specified
  if (disputed !== undefined) {
    const isDisputedBool = disputed === true || disputed === 'true';
    processedOrders = processedOrders.filter((o) => o.isDisputed === isDisputedBool);
  }

  const total = processedOrders.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;
  const paginatedOrders = processedOrders.slice(offset, offset + limit);

  return {
    orders: paginatedOrders,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
    },
  };
};

module.exports = {
  listOrders,
};
