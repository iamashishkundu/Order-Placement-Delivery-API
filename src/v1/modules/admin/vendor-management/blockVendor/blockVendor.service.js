const Vendor = require('../../../vendor/models/vendor.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');
const VENDOR_STATUS = require('../../../../../common/constants/vendorStatus');

const blockVendor = async (vendorId) => {
  const vendor = await Vendor.findByPk(vendorId);

  if (!vendor) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Vendor not found with ID ${vendorId}.`);
  }

  // Approved -> blocked
  if (vendor.status !== VENDOR_STATUS.APPROVED) {
    throw ApiError.badRequest(
      ERROR_CODES.INVALID_STATUS_TRANSITION,
      `Cannot block vendor in '${vendor.status}' status. Only approved vendors can be blocked.`
    );
  }

  vendor.status = VENDOR_STATUS.BLOCKED;
  await vendor.save();

  const result = vendor.toJSON();
  delete result.passwordHash;

  return result;
};

module.exports = {
  blockVendor,
};

