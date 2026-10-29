const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const blockVendorValidation = require('./blockVendor.validation');
const blockVendorController = require('./blockVendor.controller');

const router = express.Router();

router.patch('/:vendorId/block', validate(blockVendorValidation), blockVendorController);

module.exports = router;

