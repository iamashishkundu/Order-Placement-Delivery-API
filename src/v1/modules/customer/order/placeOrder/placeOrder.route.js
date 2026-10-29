const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const placeOrderValidation = require('./placeOrder.validation');
const placeOrderController = require('./placeOrder.controller');

const router = express.Router();

router.post('/', validate(placeOrderValidation), placeOrderController);

module.exports = router;

