const Address = require('../../models/address.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const setDefaultAddress = async (customerId, addressId) => {
  const address = await Address.findByPk(addressId);

  if (!address) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Address not found with ID ${addressId}.`);
  }

  if (address.customerId !== customerId) {
    throw ApiError.forbidden(
      ERROR_CODES.FORBIDDEN,
      'Access forbidden: You cannot modify another customer’s address.'
    );
  }

  // Unset all other default addresses for this customer
  await Address.update(
    { isDefault: false },
    { where: { customerId } }
  );

  address.isDefault = true;
  await address.save();

  return address;
};

module.exports = {
  setDefaultAddress,
};

