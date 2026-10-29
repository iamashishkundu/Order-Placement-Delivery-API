const { Op } = require('sequelize');
const Vendor = require('../../models/vendor.model');
const VendorOtp = require('../../models/vendorOtp.model');
const {
  generateOtp,
  hashOtp,
  checkResendCooldown,
  checkHourlySendLimit,
  OTP_CONFIG,
} = require('../../../../../common/services/otp');
const { sendEmail } = require('../../../../../common/services/email');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const sendEmailOtp = async ({ email }) => {
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

  // Check cooldown on the most recent OTP sent to this vendor for email channel
  const latestOtp = await VendorOtp.findOne({
    where: {
      vendorId: vendor.id,
      channel: 'email',
    },
    order: [['createdAt', 'DESC']],
  });

  if (latestOtp) {
    checkResendCooldown(latestOtp.lastSentAt);
  }

  // Check hourly rate limit
  const oneHourAgo = new Date(Date.now() - OTP_CONFIG.HOURLY_WINDOW_MS);
  const hourlyCount = await VendorOtp.count({
    where: {
      vendorId: vendor.id,
      channel: 'email',
      createdAt: { [Op.gte]: oneHourAgo },
    },
  });

  checkHourlySendLimit(hourlyCount);

  // Generate and hash OTP
  const rawOtp = generateOtp();
  const hashedOtp = hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MS);
  const now = new Date();

  await VendorOtp.create({
    vendorId: vendor.id,
    channel: 'email',
    otpHash: hashedOtp,
    expiresAt,
    attempts: 0,
    lastSentAt: now,
  });

  await sendEmail({
    to: normalizedEmail,
    subject: 'Vendor Email Verification',
    text: `Your email verification OTP is ${rawOtp}. Valid for 5 minutes.`,
    otp: rawOtp,
  });

  return { message: 'Email verification OTP sent successfully.' };
};

module.exports = {
  sendEmailOtp,
};

