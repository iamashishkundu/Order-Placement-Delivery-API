const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const verifyEmailOtpValidation = require('./verifyEmailOtp.validation');
const verifyEmailOtpController = require('./verifyEmailOtp.controller');

const router = express.Router();

router.post('/verify-email-otp', validate(verifyEmailOtpValidation), verifyEmailOtpController);

module.exports = router;

