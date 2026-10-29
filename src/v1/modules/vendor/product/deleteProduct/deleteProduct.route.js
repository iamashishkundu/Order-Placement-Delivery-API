const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const vendorGate = require('../../middlewares/vendorGate');
const deleteProductValidation = require('./deleteProduct.validation');
const deleteProductController = require('./deleteProduct.controller');

const router = express.Router();

router.delete(
  '/:productId',
  vendorGate('PROFILE_COMPLETE'),
  validate(deleteProductValidation),
  deleteProductController
);

module.exports = router;

