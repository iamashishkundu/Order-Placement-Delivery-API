const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const vendorGate = require('../../middlewares/vendorGate');
const getOrderValidation = require('./getOrder.validation');
const getOrderController = require('./getOrder.controller');

const router = express.Router();

router.get(
  '/:orderId',
  vendorGate('PROFILE_COMPLETE'),
  validate(getOrderValidation),
  getOrderController
);

module.exports = router;

