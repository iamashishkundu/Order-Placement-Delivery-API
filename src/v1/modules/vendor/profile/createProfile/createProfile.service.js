const Vendor = require('../../models/vendor.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const createProfile = async (vendorId, profileData) => {
  const vendor = await Vendor.findByPk(vendorId);

  if (!vendor) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, 'Vendor account not found.');
  }

  vendor.shopName = profileData.shopName.trim();
  vendor.ownerName = profileData.ownerName.trim();
  vendor.addressLine = profileData.addressLine.trim();
  vendor.city = profileData.city.trim();
  vendor.state = profileData.state.trim();
  vendor.pincode = profileData.pincode.trim();
  vendor.profileCompleted = true;

  await vendor.save();

  const result = vendor.toJSON();
  delete result.passwordHash;

  return result;
};

module.exports = {
  createProfile,
};

