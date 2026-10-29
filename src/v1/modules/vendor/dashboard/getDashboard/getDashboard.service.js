const { Op } = require('sequelize');
const OrderItem = require('../../../customer/models/orderItem.model');
const { ITEM_STATUS } = require('../../../../../common/constants/orderStatus');

const getDashboard = async (vendorId) => {
  // Vendors NEVER see items in pending_payment
  const items = await OrderItem.findAll({
    where: {
      vendorId,
      status: {
        [Op.ne]: ITEM_STATUS.PENDING_PAYMENT,
      },
    },
    attributes: ['status', 'priceAtPurchase', 'quantity'],
  });

  const itemCounts = {
    [ITEM_STATUS.PLACED]: 0,
    [ITEM_STATUS.PREPARING]: 0,
    [ITEM_STATUS.OUT_FOR_DELIVERY]: 0,
    [ITEM_STATUS.DELIVERED]: 0,
    [ITEM_STATUS.CANCELLED]: 0,
    total: items.length,
  };

  let deliveredSalesTotal = 0;

  items.forEach((item) => {
    if (itemCounts[item.status] !== undefined) {
      itemCounts[item.status] += item.quantity;
    }

    if (item.status === ITEM_STATUS.DELIVERED) {
      deliveredSalesTotal += parseFloat(item.priceAtPurchase) * item.quantity;
    }
  });

  return {
    itemCounts,
    sales: {
      deliveredSalesTotal: parseFloat(deliveredSalesTotal.toFixed(2)),
      currency: 'USD',
    },
  };
};

module.exports = {
  getDashboard,
};
