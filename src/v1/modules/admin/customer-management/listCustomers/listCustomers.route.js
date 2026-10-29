const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const listCustomersValidation = require('./listCustomers.validation');
const listCustomersController = require('./listCustomers.controller');

const router = express.Router();

router.get('/', validate(listCustomersValidation), listCustomersController);

module.exports = router;

