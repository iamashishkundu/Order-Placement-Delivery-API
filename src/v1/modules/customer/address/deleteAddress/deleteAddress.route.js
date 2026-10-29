const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const deleteAddressValidation = require('./deleteAddress.validation');
const deleteAddressController = require('./deleteAddress.controller');

const router = express.Router();

router.delete('/:addressId', validate(deleteAddressValidation), deleteAddressController);

module.exports = router;

