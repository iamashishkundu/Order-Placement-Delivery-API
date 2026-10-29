const Joi = require('joi');

const verifyOtpValidation = {
  body: Joi.object({
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{7,14}$/)
      .required()
      .messages({
        'string.pattern.base': 'A valid phone number is required (E.164 format, 8-15 digits)',
        'any.required': 'Phone number is required',
      }),
    otp: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only digits',
      'any.required': 'OTP is required',
    }),
  }),
};

module.exports = verifyOtpValidation;

