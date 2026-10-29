const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const sendPhoneOtpValidation = require('./sendPhoneOtp.validation');
const sendPhoneOtpController = require('./sendPhoneOtp.controller');

const router = express.Router();

router.post('/send-phone-otp', validate(sendPhoneOtpValidation), sendPhoneOtpController);

module.exports = router;

