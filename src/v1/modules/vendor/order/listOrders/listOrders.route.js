const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const vendorGate = require('../../middlewares/vendorGate');
const listOrdersValidation = require('./listOrders.validation');
const listOrdersController = require('./listOrders.controller');

const router = express.Router();

router.get(
  '/',
  vendorGate('PROFILE_COMPLETE'),
  validate(listOrdersValidation),
  listOrdersController
);

module.exports = router;

