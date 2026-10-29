const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const getCustomerValidation = require('./getCustomer.validation');
const getCustomerController = require('./getCustomer.controller');

const router = express.Router();

router.get('/:customerId', validate(getCustomerValidation), getCustomerController);

module.exports = router;

