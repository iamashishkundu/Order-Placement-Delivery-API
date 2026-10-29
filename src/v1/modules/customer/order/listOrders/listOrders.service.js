const Order = require('../../models/order.model');
const OrderItem = require('../../models/orderItem.model');
const Vendor = require('../../../vendor/models/vendor.model');
const {
  computeDerivedOrderStatus,
  computePaymentStatus,
} = require('../../../../../common/services/orderStatus');

const listOrders = async (customerId, { status, page = 1, limit = 20 }) => {
  const orders = await Order.findAll({
    where: { customerId },
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Vendor,
            as: 'vendor',
            attributes: ['id', 'shopName', 'city', 'state'],
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  let processed = orders.map((order) => {
    const o = order.toJSON();
    const derivedStatus = computeDerivedOrderStatus(o.items);
    const paymentStatus = computePaymentStatus(o.items, o.paymentStatus);

    return {
      ...o,
      derivedStatus,
      paymentStatus,
    };
  });

  if (status) {
    processed = processed.filter((o) => o.derivedStatus === status);
  }

  const total = processed.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;
  const paginatedOrders = processed.slice(offset, offset + limit);

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

