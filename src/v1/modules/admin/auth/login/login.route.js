const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const loginValidation = require('./login.validation');
const loginController = require('./login.controller');

const router = express.Router();

router.post('/login', validate(loginValidation), loginController);

module.exports = router;

