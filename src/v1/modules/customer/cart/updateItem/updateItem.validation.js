const Joi = require('joi');

const updateItemValidation = {
  params: Joi.object({
    productId: Joi.string().uuid().required().messages({
      'string.guid': 'Product ID must be a valid UUID',
      'any.required': 'Product ID is required',
    }),
  }),
  body: Joi.object({
    quantity: Joi.number().integer().min(1).required().messages({
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required',
    }),
  }),
};

module.exports = updateItemValidation;

