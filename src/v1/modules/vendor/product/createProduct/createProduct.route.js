const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const vendorGate = require('../../middlewares/vendorGate');
const createProductValidation = require('./createProduct.validation');
const createProductController = require('./createProduct.controller');

const router = express.Router();

router.post(
  '/',
  vendorGate('PROFILE_COMPLETE'),
  validate(createProductValidation),
  createProductController
);

module.exports = router;

