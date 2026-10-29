const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const blockCustomerValidation = require('./blockCustomer.validation');
const blockCustomerController = require('./blockCustomer.controller');

const router = express.Router();

router.patch('/:customerId/block', validate(blockCustomerValidation), blockCustomerController);

module.exports = router;

