const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const listOrdersValidation = require('./listOrders.validation');
const listOrdersController = require('./listOrders.controller');

const router = express.Router();

router.get('/', validate(listOrdersValidation), listOrdersController);

module.exports = router;

