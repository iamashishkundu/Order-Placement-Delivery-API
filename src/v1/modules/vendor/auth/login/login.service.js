const Vendor = require('../../models/vendor.model');
const { comparePassword } = require('../../../../../common/utils/password');
const { signToken } = require('../../../../../common/utils/jwt');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');
const ROLES = require('../../../../../common/constants/roles');

const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const vendor = await Vendor.findOne({
    where: { email: normalizedEmail },
  });

  if (!vendor) {
    throw ApiError.unauthorized(ERROR_CODES.UNAUTHORIZED, 'Invalid email or password.');
  }

  const isMatch = await comparePassword(password, vendor.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized(ERROR_CODES.UNAUTHORIZED, 'Invalid email or password.');
  }

  // Verification check: Login is blocked until both phone and email are verified
  if (!vendor.isPhoneVerified || !vendor.isEmailVerified) {
    const missing = [];
    if (!vendor.isPhoneVerified) missing.push('phone');
    if (!vendor.isEmailVerified) missing.push('email');

    throw ApiError.forbidden(
      ERROR_CODES.VERIFICATION_REQUIRED,
      `Verification required: ${missing.join(' and ')} not verified.`,
      { unverified: missing }
    );
  }

  const token = signToken({
    sub: vendor.id,
    role: ROLES.VENDOR,
  });

  const vendorJson = vendor.toJSON();
  delete vendorJson.passwordHash;

  return {
    vendor: vendorJson,
    token,
  };
};

module.exports = {
  login,
};

