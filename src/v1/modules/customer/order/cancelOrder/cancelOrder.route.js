const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const cancelOrderValidation = require('./cancelOrder.validation');
const cancelOrderController = require('./cancelOrder.controller');

const router = express.Router();

router.patch('/:orderId/cancel', validate(cancelOrderValidation), cancelOrderController);

module.exports = router;

