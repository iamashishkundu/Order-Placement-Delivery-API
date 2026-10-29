const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const vendorGate = require('../../middlewares/vendorGate');
const updateItemStatusValidation = require('./updateItemStatus.validation');
const updateItemStatusController = require('./updateItemStatus.controller');

const router = express.Router();

router.patch(
  '/:orderId/status',
  vendorGate('PROFILE_COMPLETE'),
  validate(updateItemStatusValidation),
  updateItemStatusController
);

module.exports = router;

