const express = require('express');
const listCategoriesController = require('./listCategories.controller');

const router = express.Router();

router.get('/categories', listCategoriesController);

module.exports = router;

