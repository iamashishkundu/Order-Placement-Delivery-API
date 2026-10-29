const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const addItemValidation = require('./addItem.validation');
const addItemController = require('./addItem.controller');

const router = express.Router();

router.post('/items', validate(addItemValidation), addItemController);

module.exports = router;

