const Vendor = require('../../../vendor/models/vendor.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');
const VENDOR_STATUS = require('../../../../../common/constants/vendorStatus');

const approveVendor = async (vendorId) => {
  const vendor = await Vendor.findByPk(vendorId);

  if (!vendor) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Vendor not found with ID ${vendorId}.`);
  }

  // Pending or rejected -> approved
  if (vendor.status !== VENDOR_STATUS.PENDING && vendor.status !== VENDOR_STATUS.REJECTED) {
    throw ApiError.badRequest(
      ERROR_CODES.INVALID_STATUS_TRANSITION,
      `Cannot approve vendor in '${vendor.status}' status. Only pending or rejected vendors can be approved.`
    );
  }

  vendor.status = VENDOR_STATUS.APPROVED;
  vendor.rejectionReason = null;
  await vendor.save();

  const result = vendor.toJSON();
  delete result.passwordHash;

  return result;
};

module.exports = {
  approveVendor,
};

