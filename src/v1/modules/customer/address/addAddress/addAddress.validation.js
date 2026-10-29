const Joi = require('joi');

const addAddressValidation = {
  body: Joi.object({
    label: Joi.string().trim().min(2).max(50).required().messages({
      'any.required': 'Address label is required (e.g. Home, Work)',
    }),
    addressLine: Joi.string().trim().min(5).max(255).required().messages({
      'any.required': 'Address line is required',
    }),
    city: Joi.string().trim().min(2).max(100).required().messages({
      'any.required': 'City is required',
    }),
    state: Joi.string().trim().min(2).max(100).required().messages({
      'any.required': 'State is required',
    }),
    pincode: Joi.string().trim().pattern(/^\d{4,10}$/).required().messages({
      'string.pattern.base': 'Pincode must be between 4 and 10 digits',
      'any.required': 'Pincode is required',
    }),
    isDefault: Joi.boolean().default(false),
  }),
};

module.exports = addAddressValidation;

