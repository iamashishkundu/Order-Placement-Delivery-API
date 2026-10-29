const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const addAddressValidation = require('./addAddress.validation');
const addAddressController = require('./addAddress.controller');

const router = express.Router();

router.post('/', validate(addAddressValidation), addAddressController);

module.exports = router;

