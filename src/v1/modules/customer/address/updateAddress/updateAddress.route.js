const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const updateAddressValidation = require('./updateAddress.validation');
const updateAddressController = require('./updateAddress.controller');

const router = express.Router();

router.patch('/:addressId', validate(updateAddressValidation), updateAddressController);

module.exports = router;

