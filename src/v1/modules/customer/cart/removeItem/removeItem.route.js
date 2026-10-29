const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const removeItemValidation = require('./removeItem.validation');
const removeItemController = require('./removeItem.controller');

const router = express.Router();

router.delete('/items/:productId', validate(removeItemValidation), removeItemController);

module.exports = router;

