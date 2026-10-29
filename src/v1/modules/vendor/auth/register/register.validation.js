const Joi = require('joi');

const registerValidation = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'A valid email is required',
      'any.required': 'Email is required',
    }),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{7,14}$/)
      .required()
      .messages({
        'string.pattern.base': 'A valid phone number is required (E.164 format, 8-15 digits)',
        'any.required': 'Phone number is required',
      }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),
  }),
};

module.exports = registerValidation;

