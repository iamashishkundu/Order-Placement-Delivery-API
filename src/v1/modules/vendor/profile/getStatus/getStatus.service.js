const Vendor = require('../../models/vendor.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const getStatus = async (vendorId) => {
  const vendor = await Vendor.findByPk(vendorId, {
    attributes: [
      'id',
      'email',
      'phone',
      'status',
      'rejectionReason',
      'isPhoneVerified',
      'isEmailVerified',
      'profileCompleted',
      'shopName',
      'ownerName',
      'createdAt',
      'updatedAt',
    ],
  });

  if (!vendor) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, 'Vendor account not found.');
  }

  return vendor;
};

module.exports = {
  getStatus,
};

