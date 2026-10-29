const express = require('express');
const validate = require('../../../../../common/middlewares/validate');
const sendEmailOtpValidation = require('./sendEmailOtp.validation');
const sendEmailOtpController = require('./sendEmailOtp.controller');

const router = express.Router();

router.post('/send-email-otp', validate(sendEmailOtpValidation), sendEmailOtpController);

module.exports = router;

