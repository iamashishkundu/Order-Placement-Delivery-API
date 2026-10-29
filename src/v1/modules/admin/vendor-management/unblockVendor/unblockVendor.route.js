const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const unblockVendorValidation = require('./unblockVendor.validation');
const unblockVendorController = require('./unblockVendor.controller');

const router = express.Router();

router.patch('/:vendorId/unblock', validate(unblockVendorValidation), unblockVendorController);

module.exports = router;

