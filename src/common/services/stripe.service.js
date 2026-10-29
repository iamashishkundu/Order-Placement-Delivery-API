const Stripe = require('stripe');
const env = require('../../config/env');
const ApiError = require('../utils/ApiError');
const ERROR_CODES = require('../constants/errorCodes');

// Initialize the Stripe SDK instance exclusively here
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

/**
 * Creates a Stripe Checkout Session in payment mode.
 * Line items convert priceAtPurchase to cents with Math.round(price * 100).
 */
const createCheckoutSession = async ({
  orderId,
  items,
  customerEmail = null,
  successUrl = null,
  cancelUrl = null,
  expiresAtInSeconds = null,
}) => {
  try {
    const lineItems = items.map((item) => ({
      price_data: {
        currency: env.CURRENCY,
        product_data: {
          name: item.productName,
        },
        unit_amount: Math.round(parseFloat(item.priceAtPurchase) * 100),
      },
      quantity: item.quantity,
    }));

    // Minimum expiry is 30 minutes in future per Stripe rules
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const expiryTimestamp =
      expiresAtInSeconds || nowInSeconds + env.CHECKOUT_EXPIRY_MINUTES * 60;

    const sessionParams = {
      mode: 'payment',
      line_items: lineItems,
      client_reference_id: String(orderId),
      metadata: {
        orderId: String(orderId),
      },
      expires_at: expiryTimestamp,
      success_url: successUrl || env.STRIPE_SUCCESS_URL,
      cancel_url: cancelUrl || env.STRIPE_CANCEL_URL,
    };

    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return session;
  } catch (error) {
    console.error('[Stripe Service - createCheckoutSession Error]:', error.message);
    throw ApiError.badGateway(
      ERROR_CODES.PAYMENT_PROVIDER_ERROR,
      `Failed to create payment checkout session: ${error.message}`
    );
  }
};

/**
 * Expires an open Stripe Checkout Session via API.
 */
const expireSession = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.expire(sessionId);
    return session;
  } catch (error) {
    // If already expired, return null / ignore
    if (error.message && error.message.includes('already expired')) {
      return null;
    }
    console.error(`[Stripe Service - expireSession Error (${sessionId})]:`, error.message);
    throw ApiError.badGateway(
      ERROR_CODES.PAYMENT_PROVIDER_ERROR,
      `Failed to expire checkout session: ${error.message}`
    );
  }
};

/**
 * Retrieves a checkout session from Stripe.
 */
const retrieveSession = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error(`[Stripe Service - retrieveSession Error (${sessionId})]:`, error.message);
    throw ApiError.badGateway(
      ERROR_CODES.PAYMENT_PROVIDER_ERROR,
      `Failed to retrieve checkout session: ${error.message}`
    );
  }
};

/**
 * Creates a Stripe Refund with an optional idempotency key.
 */
const createRefund = async ({
  paymentIntentId,
  amountInCents = null,
  reason = null,
  idempotencyKey = null,
}) => {
  try {
    const params = {
      payment_intent: paymentIntentId,
    };
    if (amountInCents != null) {
      params.amount = amountInCents;
    }
    if (reason) {
      params.reason = reason;
    }

    const requestOptions = idempotencyKey ? { idempotencyKey } : {};
    const refund = await stripe.refunds.create(params, requestOptions);
    return refund;
  } catch (error) {
    console.error(`[Stripe Service - createRefund Error (${paymentIntentId})]:`, error.message);
    throw ApiError.badGateway(
      ERROR_CODES.PAYMENT_PROVIDER_ERROR,
      `Failed to process refund: ${error.message}`
    );
  }
};

/**
 * Constructs and verifies a Stripe Webhook Event from raw body buffer.
 */
const constructWebhookEvent = (rawPayload, signatureHeader, webhookSecret = null) => {
  try {
    const secret = webhookSecret || env.STRIPE_WEBHOOK_SECRET;
    return stripe.webhooks.constructEvent(rawPayload, signatureHeader, secret);
  } catch (error) {
    throw ApiError.badRequest(
      ERROR_CODES.WEBHOOK_SIGNATURE_INVALID,
      `Webhook signature verification failed: ${error.message}`
    );
  }
};

module.exports = {
  createCheckoutSession,
  expireSession,
  retrieveSession,
  createRefund,
  constructWebhookEvent,
};

