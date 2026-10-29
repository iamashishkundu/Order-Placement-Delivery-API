const { Op } = require('sequelize');
const Vendor = require('../../models/vendor.model');
const { hashPassword } = require('../../../../../common/utils/password');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');
const VENDOR_STATUS = require('../../../../../common/constants/vendorStatus');

const register = async ({ email, phone, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = phone.trim();

  // Check unique constraints for email and phone
  const existingVendor = await Vendor.findOne({
    where: {
      [Op.or]: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    },
  });

  if (existingVendor) {
    if (existingVendor.email === normalizedEmail) {
      throw ApiError.conflict(ERROR_CODES.DUPLICATE_RESOURCE, 'Vendor email is already registered.');
    }
    if (existingVendor.phone === normalizedPhone) {
      throw ApiError.conflict(ERROR_CODES.DUPLICATE_RESOURCE, 'Vendor phone is already registered.');
    }
  }

  const passwordHash = await hashPassword(password);

  const vendor = await Vendor.create({
    email: normalizedEmail,
    phone: normalizedPhone,
    passwordHash,
    status: VENDOR_STATUS.PENDING,
    isPhoneVerified: false,
    isEmailVerified: false,
    profileCompleted: false,
  });

  const result = vendor.toJSON();
  delete result.passwordHash;

  return result;
};

module.exports = {
  register,
};

