const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const sendOtpValidation = require('./sendOtp.validation');
const sendOtpController = require('./sendOtp.controller');

const router = express.Router();

router.post('/send-otp', validate(sendOtpValidation), sendOtpController);

module.exports = router;

