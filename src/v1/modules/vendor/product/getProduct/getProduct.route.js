const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const vendorGate = require('../../middlewares/vendorGate');
const getProductValidation = require('./getProduct.validation');
const getProductController = require('./getProduct.controller');

const router = express.Router();

router.get(
  '/:productId',
  vendorGate('PROFILE_COMPLETE'),
  validate(getProductValidation),
  getProductController
);

module.exports = router;

