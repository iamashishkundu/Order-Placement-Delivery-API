const { Op } = require('sequelize');
const Order = require('../../../customer/models/order.model');
const OrderItem = require('../../../customer/models/orderItem.model');
const Customer = require('../../../customer/models/customer.model');
const { ITEM_STATUS } = require('../../../../../common/constants/orderStatus');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const getOrder = async (vendorId, orderId) => {
  // Vendors NEVER see items in pending_payment
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'phone'],
      },
      {
        model: OrderItem,
        as: 'items',
        where: {
          vendorId,
          status: {
            [Op.ne]: ITEM_STATUS.PENDING_PAYMENT,
          },
        },
        required: true,
      },
    ],
  });

  if (!order) {
    throw ApiError.notFound(
      ERROR_CODES.NOT_FOUND,
      `Order not found with ID ${orderId} or contains no visible items for this vendor.`
    );
  }

  const o = order.toJSON();
  // Vendors never see payment or dispute details
  return {
    id: o.id,
    createdAt: o.createdAt,
    customer: o.customer,
    deliveryAddress: o.addressSnapshot,
    items: o.items,
  };
};

module.exports = {
  getOrder,
};
