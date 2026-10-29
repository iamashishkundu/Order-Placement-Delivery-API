const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const getProductValidation = require('./getProduct.validation');
const getProductController = require('./getProduct.controller');

const router = express.Router();

router.get('/products/:productId', validate(getProductValidation), getProductController);

module.exports = router;

