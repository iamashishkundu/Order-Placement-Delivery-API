const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const registerValidation = require('./register.validation');
const registerController = require('./register.controller');

const router = express.Router();

router.post('/register', validate(registerValidation), registerController);

module.exports = router;

