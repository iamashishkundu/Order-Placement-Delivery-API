const { Op } = require('sequelize');
const CustomerOtp = require('../../models/customerOtp.model');
const Customer = require('../../models/customer.model');
const {
  generateOtp,
  hashOtp,
  checkResendCooldown,
  checkHourlySendLimit,
  OTP_CONFIG,
} = require('../../../../../common/services/otp');
const { sendSms } = require('../../../../../common/services/sms');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');
const CUSTOMER_STATUS = require('../../../../../common/constants/customerStatus');

const sendOtp = async ({ phone }) => {
  const normalizedPhone = phone.trim();

  // If customer exists and is blocked, deny immediately
  const existingCustomer = await Customer.findOne({
    where: { phone: normalizedPhone },
  });

  if (existingCustomer && existingCustomer.status === CUSTOMER_STATUS.BLOCKED) {
    throw ApiError.forbidden(
      ERROR_CODES.ACCOUNT_BLOCKED,
      'Your account has been blocked. Please contact support.'
    );
  }

  // Check cooldown on the latest OTP for this phone
  const latestOtp = await CustomerOtp.findOne({
    where: { phone: normalizedPhone },
    order: [['createdAt', 'DESC']],
  });

  if (latestOtp) {
    checkResendCooldown(latestOtp.lastSentAt);
  }

  // Check hourly rate limit
  const oneHourAgo = new Date(Date.now() - OTP_CONFIG.HOURLY_WINDOW_MS);
  const hourlyCount = await CustomerOtp.count({
    where: {
      phone: normalizedPhone,
      createdAt: { [Op.gte]: oneHourAgo },
    },
  });

  checkHourlySendLimit(hourlyCount);

  // Generate and hash OTP
  const rawOtp = generateOtp();
  const hashedOtp = hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MS);
  const now = new Date();

  await CustomerOtp.create({
    phone: normalizedPhone,
    otpHash: hashedOtp,
    expiresAt,
    attempts: 0,
    lastSentAt: now,
  });

  await sendSms({
    to: normalizedPhone,
    message: `Your login OTP is ${rawOtp}. Valid for 5 minutes.`,
    otp: rawOtp,
  });

  return { message: 'OTP sent to phone successfully.' };
};

module.exports = {
  sendOtp,
};

