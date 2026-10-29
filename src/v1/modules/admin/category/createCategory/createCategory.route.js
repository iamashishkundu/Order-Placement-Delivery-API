const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const createCategoryValidation = require('./createCategory.validation');
const createCategoryController = require('./createCategory.controller');

const router = express.Router();

router.post('/', validate(createCategoryValidation), createCategoryController);

module.exports = router;

