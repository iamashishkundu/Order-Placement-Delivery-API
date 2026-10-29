const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const enableProductValidation = require('./enableProduct.validation');
const enableProductController = require('./enableProduct.controller');

const router = express.Router();

router.patch('/:productId/enable', validate(enableProductValidation), enableProductController);

module.exports = router;

