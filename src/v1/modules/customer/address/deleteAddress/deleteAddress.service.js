const Address = require('../../models/address.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const deleteAddress = async (customerId, addressId) => {
  const address = await Address.findByPk(addressId);

  if (!address) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Address not found with ID ${addressId}.`);
  }

  if (address.customerId !== customerId) {
    throw ApiError.forbidden(
      ERROR_CODES.FORBIDDEN,
      'Access forbidden: You cannot delete another customer’s address.'
    );
  }

  const wasDefault = address.isDefault;
  await address.destroy();

  // If deleted address was default, promote another address if one exists
  if (wasDefault) {
    const nextAddress = await Address.findOne({
      where: { customerId },
      order: [['createdAt', 'DESC']],
    });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  return { message: 'Address deleted successfully.' };
};

module.exports = {
  deleteAddress,
};

