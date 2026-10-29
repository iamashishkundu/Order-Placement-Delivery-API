const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const setDefaultAddressValidation = require('./setDefaultAddress.validation');
const setDefaultAddressController = require('./setDefaultAddress.controller');

const router = express.Router();

router.patch('/:addressId/default', validate(setDefaultAddressValidation), setDefaultAddressController);

module.exports = router;

