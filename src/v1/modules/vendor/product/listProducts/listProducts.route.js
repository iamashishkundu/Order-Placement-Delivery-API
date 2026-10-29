const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const vendorGate = require('../../middlewares/vendorGate');
const listProductsValidation = require('./listProducts.validation');
const listProductsController = require('./listProducts.controller');

const router = express.Router();

router.get(
  '/',
  vendorGate('PROFILE_COMPLETE'),
  validate(listProductsValidation),
  listProductsController
);

module.exports = router;

