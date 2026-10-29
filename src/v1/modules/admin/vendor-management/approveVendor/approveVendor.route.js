const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const approveVendorValidation = require('./approveVendor.validation');
const approveVendorController = require('./approveVendor.controller');

const router = express.Router();

router.patch('/:vendorId/approve', validate(approveVendorValidation), approveVendorController);

module.exports = router;

