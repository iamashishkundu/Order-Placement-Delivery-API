const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const getVendorValidation = require('./getVendor.validation');
const getVendorController = require('./getVendor.controller');

const router = express.Router();

router.get('/:vendorId', validate(getVendorValidation), getVendorController);

module.exports = router;

