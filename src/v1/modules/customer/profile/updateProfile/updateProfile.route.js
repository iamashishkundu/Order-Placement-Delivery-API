const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const updateProfileValidation = require('./updateProfile.validation');
const updateProfileController = require('./updateProfile.controller');

const router = express.Router();

router.patch('/', validate(updateProfileValidation), updateProfileController);

module.exports = router;

