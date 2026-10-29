const Customer = require('../../../customer/models/customer.model');
const Order = require('../../../customer/models/order.model');
const OrderItem = require('../../../customer/models/orderItem.model');
const { computeDerivedOrderStatus } = require('../../../../../common/services/orderStatus');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const getCustomer = async (customerId) => {
  const customer = await Customer.findByPk(customerId, {
    include: [
      {
        model: Order,
        as: 'orders',
        include: [
          {
            model: OrderItem,
            as: 'items',
          },
        ],
      },
    ],
    order: [[{ model: Order, as: 'orders' }, 'createdAt', 'DESC']],
  });

  if (!customer) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Customer not found with ID ${customerId}.`);
  }

  const customerJson = customer.toJSON();
  if (customerJson.orders) {
    customerJson.orders = customerJson.orders.map((order) => ({
      ...order,
      derivedStatus: computeDerivedOrderStatus(order.items),
    }));
  }

  return customerJson;
};

module.exports = {
  getCustomer,
};

