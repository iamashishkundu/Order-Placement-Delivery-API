const { Op } = require('sequelize');
const Order = require('../../../customer/models/order.model');
const OrderItem = require('../../../customer/models/orderItem.model');
const Customer = require('../../../customer/models/customer.model');
const { ITEM_STATUS } = require('../../../../../common/constants/orderStatus');

const listOrders = async (vendorId, { status, page = 1, limit = 20 }) => {
  // Vendors NEVER see items in pending_payment
  const itemWhere = {
    vendorId,
    status: status || {
      [Op.ne]: ITEM_STATUS.PENDING_PAYMENT,
    },
  };

  // Find orders containing fulfilled/placed items for this vendor
  const orders = await Order.findAll({
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'phone'],
      },
      {
        model: OrderItem,
        as: 'items',
        where: itemWhere,
        required: true,
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  const total = orders.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;
  const paginatedOrders = orders.slice(offset, offset + limit).map((order) => {
    const o = order.toJSON();
    // Only return customer name, phone, and delivery address snapshot (never payments/disputes)
    return {
      id: o.id,
      createdAt: o.createdAt,
      customer: o.customer,
      deliveryAddress: o.addressSnapshot,
      items: o.items,
    };
  });

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
