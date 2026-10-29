const Customer = require('../../models/customer.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const getProfile = async (customerId) => {
  const customer = await Customer.findByPk(customerId);

  if (!customer) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, 'Customer profile not found.');
  }

  return customer;
};

module.exports = {
  getProfile,
};

