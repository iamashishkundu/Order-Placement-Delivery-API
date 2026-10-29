const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const verifyOtpValidation = require('./verifyOtp.validation');
const verifyOtpController = require('./verifyOtp.controller');

const router = express.Router();

router.post('/verify-otp', validate(verifyOtpValidation), verifyOtpController);

module.exports = router;

