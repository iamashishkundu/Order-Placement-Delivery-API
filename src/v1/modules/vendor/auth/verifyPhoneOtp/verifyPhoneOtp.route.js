const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const verifyPhoneOtpValidation = require('./verifyPhoneOtp.validation');
const verifyPhoneOtpController = require('./verifyPhoneOtp.controller');

const router = express.Router();

router.post('/verify-phone-otp', validate(verifyPhoneOtpValidation), verifyPhoneOtpController);

module.exports = router;

