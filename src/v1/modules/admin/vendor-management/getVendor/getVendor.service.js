const Vendor = require('../../../vendor/models/vendor.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const getVendor = async (vendorId) => {
  const vendor = await Vendor.findByPk(vendorId, {
    attributes: { exclude: ['passwordHash'] },
  });

  if (!vendor) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Vendor not found with ID ${vendorId}.`);
  }

  return vendor;
};

module.exports = {
  getVendor,
};

