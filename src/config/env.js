const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const STATIC_OTP = process.env.STATIC_OTP ? process.env.STATIC_OTP.trim() : null;

// 1. The app must REFUSE TO BOOT if NODE_ENV=production and STATIC_OTP is set.
if (NODE_ENV === 'production' && STATIC_OTP) {
  const errorMsg = 'FATAL SECURITY CONFIGURATION: STATIC_OTP must NOT be set when NODE_ENV is "production". Server refuses to boot.';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

// 2. Refuse to boot if NODE_ENV is not production and STRIPE_SECRET_KEY does not start with sk_test_.
const rawStripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key';
if (NODE_ENV !== 'production' && !rawStripeSecretKey.startsWith('sk_test_')) {
  const errorMsg = 'FATAL SECURITY CONFIGURATION: When NODE_ENV is not "production", STRIPE_SECRET_KEY must start with "sk_test_". Server refuses to boot.';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

const env = Object.freeze({
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV,

  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
  DB_NAME: process.env.DB_NAME || 'order_delivery_db',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',

  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey_min_32_characters_long_for_security',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  STATIC_OTP,

  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@example.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'AdminPassword@123',

  STRIPE_SECRET_KEY: rawStripeSecretKey,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL || 'http://localhost:5000/api/v1/payments/success?session_id={CHECKOUT_SESSION_ID}',
  STRIPE_CANCEL_URL: process.env.STRIPE_CANCEL_URL || 'http://localhost:5000/api/v1/payments/cancel',
  CHECKOUT_EXPIRY_MINUTES: parseInt(process.env.CHECKOUT_EXPIRY_MINUTES, 10) || 30,
  CURRENCY: (process.env.CURRENCY || 'usd').toLowerCase(),
});

module.exports = env;
