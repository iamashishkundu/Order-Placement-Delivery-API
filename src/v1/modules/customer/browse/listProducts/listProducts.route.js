const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const listProductsValidation = require('./listProducts.validation');
const listProductsController = require('./listProducts.controller');

const router = express.Router();

router.get('/products', validate(listProductsValidation), listProductsController);

module.exports = router;

