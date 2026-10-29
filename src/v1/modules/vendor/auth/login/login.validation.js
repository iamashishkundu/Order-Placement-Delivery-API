const Joi = require('joi');

const loginValidation = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'A valid email is required',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),
};

module.exports = loginValidation;

