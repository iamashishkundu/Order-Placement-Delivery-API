const express = require('express');
const { validateWebhookRequest } = require('./handleStripeWebhook.validation');
const handleStripeWebhookController = require('./handleStripeWebhook.controller');

const router = express.Router();

router.post('/', validateWebhookRequest, handleStripeWebhookController);

module.exports = router;

