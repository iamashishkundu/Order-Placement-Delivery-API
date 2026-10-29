const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const vendorGate = require('../../middlewares/vendorGate');
const toggleAvailabilityValidation = require('./toggleAvailability.validation');
const toggleAvailabilityController = require('./toggleAvailability.controller');

const router = express.Router();

router.patch(
  '/:productId/availability',
  vendorGate('PROFILE_COMPLETE'),
  validate(toggleAvailabilityValidation),
  toggleAvailabilityController
);

module.exports = router;

