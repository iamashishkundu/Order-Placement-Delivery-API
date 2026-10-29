const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const vendorGate = require('../../middlewares/vendorGate');
const updateProductValidation = require('./updateProduct.validation');
const updateProductController = require('./updateProduct.controller');

const router = express.Router();

router.patch(
  '/:productId',
  vendorGate('PROFILE_COMPLETE'),
  validate(updateProductValidation),
  updateProductController
);

module.exports = router;

