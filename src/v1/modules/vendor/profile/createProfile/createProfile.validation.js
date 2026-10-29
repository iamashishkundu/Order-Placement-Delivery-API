const Joi = require('joi');

const createProfileValidation = {
  body: Joi.object({
    shopName: Joi.string().trim().min(2).max(150).required().messages({
      'any.required': 'Shop name is required',
    }),
    ownerName: Joi.string().trim().min(2).max(100).required().messages({
      'any.required': 'Owner name is required',
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
  }),
};

module.exports = createProfileValidation;

