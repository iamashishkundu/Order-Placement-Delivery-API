const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const rejectVendorValidation = require('./rejectVendor.validation');
const rejectVendorController = require('./rejectVendor.controller');

const router = express.Router();

router.patch('/:vendorId/reject', validate(rejectVendorValidation), rejectVendorController);

module.exports = router;

