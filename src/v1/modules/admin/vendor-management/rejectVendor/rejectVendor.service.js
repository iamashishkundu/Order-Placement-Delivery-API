const Vendor = require('../../../vendor/models/vendor.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');
const VENDOR_STATUS = require('../../../../../common/constants/vendorStatus');

const rejectVendor = async (vendorId, { reason }) => {
  const vendor = await Vendor.findByPk(vendorId);

  if (!vendor) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Vendor not found with ID ${vendorId}.`);
  }

  vendor.status = VENDOR_STATUS.REJECTED;
  vendor.rejectionReason = reason.trim();
  await vendor.save();

  const result = vendor.toJSON();
  delete result.passwordHash;

  return result;
};

module.exports = {
  rejectVendor,
};

