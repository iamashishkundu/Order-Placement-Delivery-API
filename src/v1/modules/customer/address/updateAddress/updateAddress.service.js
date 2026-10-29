const Address = require('../../models/address.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const updateAddress = async (customerId, addressId, updates) => {
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

  if (updates.isDefault === true && !address.isDefault) {
    await Address.update(
      { isDefault: false },
      { where: { customerId, isDefault: true } }
    );
    address.isDefault = true;
  } else if (updates.isDefault === false && address.isDefault) {
    address.isDefault = false;
  }

  const fields = ['label', 'addressLine', 'city', 'state', 'pincode'];
  fields.forEach((f) => {
    if (updates[f] !== undefined) {
      address[f] = updates[f].trim();
    }
  });

  await address.save();

  return address;
};

module.exports = {
  updateAddress,
};

