const Vendor = require('../../models/vendor.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const getProfile = async (vendorId) => {
  const vendor = await Vendor.findByPk(vendorId, {
    attributes: { exclude: ['passwordHash'] },
  });

  if (!vendor) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, 'Vendor profile not found.');
  }

  return vendor;
};

module.exports = {
  getProfile,
};

