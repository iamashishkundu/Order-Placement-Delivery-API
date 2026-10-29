const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const disableProductValidation = require('./disableProduct.validation');
const disableProductController = require('./disableProduct.controller');

const router = express.Router();

router.patch('/:productId/disable', validate(disableProductValidation), disableProductController);

module.exports = router;

