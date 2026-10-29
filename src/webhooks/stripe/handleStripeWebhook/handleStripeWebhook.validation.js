const ApiError = require('../../../common/utils/ApiError');
const ERROR_CODES = require('../../../common/constants/errorCodes');

/**
 * Validates Stripe webhook request:
 * - Ensures Stripe-Signature header is present
 * - Ensures raw payload body exists
 */
const validateWebhookRequest = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return next(
      ApiError.badRequest(
        ERROR_CODES.WEBHOOK_SIGNATURE_INVALID,
        'Missing Stripe-Signature header.'
      )
    );
  }

  const rawBody = req.body;
  if (!rawBody || (Buffer.isBuffer(rawBody) && rawBody.length === 0)) {
    return next(
      ApiError.badRequest(
        ERROR_CODES.WEBHOOK_SIGNATURE_INVALID,
        'Empty or missing raw webhook body payload.'
      )
    );
  }

  next();
};

module.exports = {
  validateWebhookRequest,
};
