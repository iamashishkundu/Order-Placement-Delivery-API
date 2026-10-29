const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const deleteCategoryValidation = require('./deleteCategory.validation');
const deleteCategoryController = require('./deleteCategory.controller');

const router = express.Router();

router.delete('/:categoryId', validate(deleteCategoryValidation), deleteCategoryController);

module.exports = router;

