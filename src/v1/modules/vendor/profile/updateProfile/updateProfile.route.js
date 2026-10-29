const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const vendorGate = require('../../middlewares/vendorGate');
const updateProfileValidation = require('./updateProfile.validation');
const updateProfileController = require('./updateProfile.controller');

const router = express.Router();

router.patch(
  '/',
  vendorGate('APPROVED'),
  validate(updateProfileValidation),
  updateProfileController
);

module.exports = router;

