const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const vendorGate = require('../../middlewares/vendorGate');
const createProfileValidation = require('./createProfile.validation');
const createProfileController = require('./createProfile.controller');

const router = express.Router();

router.post(
  '/',
  vendorGate('APPROVED'),
  validate(createProfileValidation),
  createProfileController
);

module.exports = router;

