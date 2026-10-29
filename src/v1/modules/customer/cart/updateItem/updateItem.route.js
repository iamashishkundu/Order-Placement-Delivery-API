const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const updateItemValidation = require('./updateItem.validation');
const updateItemController = require('./updateItem.controller');

const router = express.Router();

router.patch('/items/:productId', validate(updateItemValidation), updateItemController);

module.exports = router;

