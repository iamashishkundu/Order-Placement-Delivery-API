const Customer = require('../../models/customer.model');
const CustomerOtp = require('../../models/customerOtp.model');
const {
  verifyOtpHash,
  validateOtpRecord,
  OTP_CONFIG,
} = require('../../../../../common/services/otp');
const { signToken } = require('../../../../../common/utils/jwt');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');
const CUSTOMER_STATUS = require('../../../../../common/constants/customerStatus');
const ROLES = require('../../../../../common/constants/roles');

const verifyOtp = async ({ phone, otp }) => {
  const normalizedPhone = phone.trim();

  // Find most recent unconsumed OTP for this phone
  const otpRecord = await CustomerOtp.findOne({
    where: {
      phone: normalizedPhone,
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

  // Consume OTP
  otpRecord.consumedAt = new Date();
  await otpRecord.save();

  // Find or create customer
  let customer = await Customer.findOne({
    where: { phone: normalizedPhone },
  });

  if (customer) {
    if (customer.status === CUSTOMER_STATUS.BLOCKED) {
      throw ApiError.forbidden(
        ERROR_CODES.ACCOUNT_BLOCKED,
        'Your customer account has been blocked.'
      );
    }
    customer.isPhoneVerified = true;
    await customer.save();
  } else {
    customer = await Customer.create({
      phone: normalizedPhone,
      status: CUSTOMER_STATUS.ACTIVE,
      isPhoneVerified: true,
    });
  }

  const token = signToken({
    sub: customer.id,
    role: ROLES.CUSTOMER,
  });

  return {
    customer,
    token,
  };
};

module.exports = {
  verifyOtp,
};

