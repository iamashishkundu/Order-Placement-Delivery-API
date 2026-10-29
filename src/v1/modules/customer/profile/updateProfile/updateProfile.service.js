const Customer = require('../../models/customer.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const updateProfile = async (customerId, { name, email }) => {
  const customer = await Customer.findByPk(customerId);

  if (!customer) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, 'Customer profile not found.');
  }

  if (name !== undefined) customer.name = name.trim();
  if (email !== undefined) customer.email = email.toLowerCase().trim();

  await customer.save();

  return customer;
};

module.exports = {
  updateProfile,
};

