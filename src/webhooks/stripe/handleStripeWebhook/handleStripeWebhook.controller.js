const { handleStripeWebhook } = require('./handleStripeWebhook.service');

const handleStripeWebhookController = async (req, res) => {
  try {
    const rawPayload = req.body;
    const signature = req.headers['stripe-signature'];

    const result = await handleStripeWebhook(rawPayload, signature);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Stripe Webhook Controller Error]:', error);

    // If signature verification failed, return 400 with WEBHOOK_SIGNATURE_INVALID
    if (error.statusCode === 400 || error.code === 'WEBHOOK_SIGNATURE_INVALID') {
      return res.status(400).json({
        success: false,
        error: {
          code: error.code || 'WEBHOOK_SIGNATURE_INVALID',
          message: error.message,
        },
      });
    }

    // Unexpected errors return 500 so Stripe retries
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error while processing webhook. Stripe will retry.',
      },
    });
  }
};

module.exports = handleStripeWebhookController;

