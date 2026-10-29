const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const unblockCustomerValidation = require('./unblockCustomer.validation');
const unblockCustomerController = require('./unblockCustomer.controller');

const router = express.Router();

router.patch('/:customerId/unblock', validate(unblockCustomerValidation), unblockCustomerController);

module.exports = router;

