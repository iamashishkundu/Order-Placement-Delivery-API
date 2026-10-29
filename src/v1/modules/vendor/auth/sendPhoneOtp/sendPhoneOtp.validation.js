const Joi = require('joi');

const sendPhoneOtpValidation = {
  body: Joi.object({
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{7,14}$/)
      .required()
      .messages({
        'string.pattern.base': 'A valid phone number is required (E.164 format, 8-15 digits)',
        'any.required': 'Phone number is required',
      }),
  }),
};

module.exports = sendPhoneOtpValidation;

