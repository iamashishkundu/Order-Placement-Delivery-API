const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const vendorGate = require('../../middlewares/vendorGate');
const updateStockValidation = require('./updateStock.validation');
const updateStockController = require('./updateStock.controller');

const router = express.Router();

router.patch(
  '/:productId/stock',
  vendorGate('PROFILE_COMPLETE'),
  validate(updateStockValidation),
  updateStockController
);

module.exports = router;

