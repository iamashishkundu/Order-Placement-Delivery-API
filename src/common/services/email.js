const env = require('../../config/env');
const { notifyAdmin } = require('./notifyAdmin.service');

/**
 * Clean no-op interface for Email sending.
 * Pluggable with real providers (e.g. SendGrid, AWS SES) in future.
 * Skips dispatch if STATIC_OTP is enabled.
 */
const sendEmail = async ({ to, subject, html, text, otp = null }) => {
  if (env.STATIC_OTP) {
    // Static OTP enabled: do not send email
    return { success: true, bypassed: true, reason: 'STATIC_OTP_ACTIVE' };
  }

  if (env.NODE_ENV !== 'production') {
    console.log(`[EMAIL SERVICE NO-OP] Destination: ${to} | Subject: ${subject} | OTP: ${otp || 'N/A'}`);
  }

  return {
    success: true,
    messageId: `mock-email-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  sendEmail,
  notifyAdmin,
};
