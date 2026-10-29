const crypto = require('crypto');
const env = require('../../config/env');
const ApiError = require('../utils/ApiError');
const ERROR_CODES = require('../constants/errorCodes');

const OTP_CONFIG = Object.freeze({
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  EXPIRY_MS: 5 * 60 * 1000,
  MAX_ATTEMPTS: 5,
  RESEND_COOLDOWN_SECONDS: 30,
  RESEND_COOLDOWN_MS: 30 * 1000,
  MAX_SENDS_PER_HOUR: 5,
  HOURLY_WINDOW_MS: 60 * 60 * 1000,
});

/**
 * Generates a 6-digit OTP string.
 * Returns STATIC_OTP if configured, otherwise a cryptographically secure 6-digit random number.
 */
const generateOtp = () => {
  if (env.STATIC_OTP) {
    return env.STATIC_OTP;
  }
  const randomNumber = crypto.randomInt(100000, 1000000);
  return randomNumber.toString();
};

/**
 * Creates a SHA-256 hash of the OTP for secure DB storage.
 */
const hashOtp = (otp) => {
  if (!otp) return null;
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
};

/**
 * Verifies if plain OTP matches the stored hash.
 */
const verifyOtpHash = (otp, hashedOtp) => {
  if (!otp || !hashedOtp) return false;
  const computedHash = hashOtp(otp);
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hashedOtp));
};

/**
 * Checks resend cooldown (30 seconds) on the most recently sent OTP.
 */
const checkResendCooldown = (lastSentAt) => {
  if (!lastSentAt) return;
  const timeSinceLastSent = Date.now() - new Date(lastSentAt).getTime();
  if (timeSinceLastSent < OTP_CONFIG.RESEND_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((OTP_CONFIG.RESEND_COOLDOWN_MS - timeSinceLastSent) / 1000);
    throw ApiError.badRequest(
      ERROR_CODES.OTP_COOLDOWN,
      `Please wait ${remainingSeconds} seconds before requesting a new OTP.`
    );
  }
};

/**
 * Checks hourly send limit (max 5 sends per hour).
 */
const checkHourlySendLimit = (sendsInLastHourCount) => {
  if (sendsInLastHourCount >= OTP_CONFIG.MAX_SENDS_PER_HOUR) {
    throw ApiError.badRequest(
      ERROR_CODES.OTP_COOLDOWN,
      'Maximum OTP requests for this hour exceeded. Please try again later.'
    );
  }
};

/**
 * Validates OTP record state (expiration, max attempts, consumption).
 */
const validateOtpRecord = (otpRecord) => {
  if (!otpRecord) {
    throw ApiError.badRequest(ERROR_CODES.OTP_INVALID, 'Invalid or expired OTP.');
  }

  if (otpRecord.consumedAt) {
    throw ApiError.badRequest(ERROR_CODES.OTP_INVALID, 'This OTP has already been used.');
  }

  if (new Date() > new Date(otpRecord.expiresAt)) {
    throw ApiError.badRequest(ERROR_CODES.OTP_EXPIRED, 'OTP has expired. Please request a new one.');
  }

  if (otpRecord.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    throw ApiError.badRequest(
      ERROR_CODES.OTP_ATTEMPTS_EXCEEDED,
      'Maximum verification attempts exceeded. Please request a new OTP.'
    );
  }
};

module.exports = {
  OTP_CONFIG,
  generateOtp,
  hashOtp,
  verifyOtpHash,
  checkResendCooldown,
  checkHourlySendLimit,
  validateOtpRecord,
};

