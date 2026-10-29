const Vendor = require('../../models/vendor.model');
const VendorOtp = require('../../models/vendorOtp.model');
const {
  verifyOtpHash,
  validateOtpRecord,
  OTP_CONFIG,
} = require('../../../../../common/services/otp');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const verifyEmailOtp = async ({ email, otp }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const vendor = await Vendor.findOne({
    where: { email: normalizedEmail },
  });

  if (!vendor) {
    throw ApiError.notFound(
      ERROR_CODES.NOT_FOUND,
      `No vendor account found with email ${normalizedEmail}.`
    );
  }

  // Find most recent unconsumed OTP
  const otpRecord = await VendorOtp.findOne({
    where: {
      vendorId: vendor.id,
      channel: 'email',
      consumedAt: null,
    },
    order: [['createdAt', 'DESC']],
  });

  validateOtpRecord(otpRecord);

  const isValid = verifyOtpHash(otp, otpRecord.otpHash);
  if (!isValid) {
    otpRecord.attempts += 1;
    await otpRecord.save();

    if (otpRecord.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      throw ApiError.badRequest(
        ERROR_CODES.OTP_ATTEMPTS_EXCEEDED,
        'Maximum verification attempts exceeded. Please request a new OTP.'
      );
    }

    throw ApiError.badRequest(ERROR_CODES.OTP_INVALID, 'Invalid OTP.');
  }

  // Mark OTP consumed and update vendor verification
  otpRecord.consumedAt = new Date();
  await otpRecord.save();

  vendor.isEmailVerified = true;
  await vendor.save();

  return {
    message: 'Email address verified successfully.',
    isPhoneVerified: vendor.isPhoneVerified,
    isEmailVerified: true,
  };
};

module.exports = {
  verifyEmailOtp,
};

