const Vendor = require('../../models/vendor.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const updateProfile = async (vendorId, updates) => {
  const vendor = await Vendor.findByPk(vendorId);

  if (!vendor) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, 'Vendor account not found.');
  }

  const allowedFields = ['shopName', 'ownerName', 'addressLine', 'city', 'state', 'pincode'];
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      vendor[field] = updates[field].trim();
    }
  });

  await vendor.save();

  const result = vendor.toJSON();
  delete result.passwordHash;

  return result;
};

module.exports = {
  updateProfile,
};

