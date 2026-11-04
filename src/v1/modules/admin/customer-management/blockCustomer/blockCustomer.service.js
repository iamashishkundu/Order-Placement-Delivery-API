const Customer = require('../../../customer/models/customer.model');
const realtimeService = require('../../../../../common/services/realtime.service');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');
const CUSTOMER_STATUS = require('../../../../../common/constants/customerStatus');

const blockCustomer = async (customerId) => {
  const customer = await Customer.findByPk(customerId);

  if (!customer) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Customer not found with ID ${customerId}.`);
  }

  customer.status = CUSTOMER_STATUS.BLOCKED;
  await customer.save();

  // Immediately disconnect all active sockets for this blocked customer
  try {
    realtimeService.disconnectUser(customerId, 'customer');
  } catch (emitErr) {
    console.error('[BlockCustomer] Realtime disconnect error:', emitErr.message);
  }

  return customer;
};

module.exports = {
  blockCustomer,
};
