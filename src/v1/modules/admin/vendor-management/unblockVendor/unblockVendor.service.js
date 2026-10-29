const Vendor = require('../../../vendor/models/vendor.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');
const VENDOR_STATUS = require('../../../../../common/constants/vendorStatus');

const unblockVendor = async (vendorId) => {
  const vendor = await Vendor.findByPk(vendorId);

  if (!vendor) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Vendor not found with ID ${vendorId}.`);
  }

  // Blocked -> approved
  if (vendor.status !== VENDOR_STATUS.BLOCKED) {
    throw ApiError.badRequest(
      ERROR_CODES.INVALID_STATUS_TRANSITION,
      `Cannot unblock vendor in '${vendor.status}' status. Only blocked vendors can be unblocked.`
    );
  }

  vendor.status = VENDOR_STATUS.APPROVED;
  await vendor.save();

  const result = vendor.toJSON();
  delete result.passwordHash;

  return result;
};

module.exports = {
  unblockVendor,
};

