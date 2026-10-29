const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const listCategoriesValidation = require('./listCategories.validation');
const listCategoriesController = require('./listCategories.controller');

const router = express.Router();

router.get('/', validate(listCategoriesValidation), listCategoriesController);

module.exports = router;

