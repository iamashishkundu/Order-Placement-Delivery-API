const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const updateCategoryValidation = require('./updateCategory.validation');
const updateCategoryController = require('./updateCategory.controller');

const router = express.Router();

router.patch('/:categoryId', validate(updateCategoryValidation), updateCategoryController);

module.exports = router;

