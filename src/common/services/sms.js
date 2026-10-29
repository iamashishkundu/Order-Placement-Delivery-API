const env = require('../../config/env');

/**
 * Clean no-op interface for SMS sending.
 * Pluggable with real providers (e.g. Twilio, AWS SNS) in future.
 * Skips dispatch if STATIC_OTP is enabled.
 */
const sendSms = async ({ to, message, otp = null }) => {
  if (env.STATIC_OTP) {
    // Static OTP enabled: do not send SMS
    return { success: true, bypassed: true, reason: 'STATIC_OTP_ACTIVE' };
  }

  if (env.NODE_ENV !== 'production') {
    console.log(`[SMS SERVICE NO-OP] Destination: ${to} | Content: ${message} | OTP: ${otp || 'N/A'}`);
  }

  return {
    success: true,
    messageId: `mock-sms-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  sendSms,
};

