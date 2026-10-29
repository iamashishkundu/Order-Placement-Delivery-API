const Joi = require('joi');

const toggleAvailabilityValidation = {
  params: Joi.object({
    productId: Joi.string().uuid().required().messages({
      'string.guid': 'Product ID must be a valid UUID',
      'any.required': 'Product ID is required',
    }),
  }),
  body: Joi.object({
    isAvailable: Joi.boolean().required().messages({
      'any.required': 'isAvailable is required',
    }),
  }),
};

module.exports = toggleAvailabilityValidation;

