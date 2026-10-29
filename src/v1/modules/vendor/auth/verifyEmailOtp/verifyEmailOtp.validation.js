const Joi = require('joi');

const verifyEmailOtpValidation = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'A valid email is required',
      'any.required': 'Email is required',
    }),
    otp: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only digits',
      'any.required': 'OTP is required',
    }),
  }),
};

module.exports = verifyEmailOtpValidation;

