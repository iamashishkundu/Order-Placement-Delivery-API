const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const getOrderValidation = require('./getOrder.validation');
const getOrderController = require('./getOrder.controller');

const router = express.Router();

router.get('/:orderId', validate(getOrderValidation), getOrderController);

module.exports = router;

