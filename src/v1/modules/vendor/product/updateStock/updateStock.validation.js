const Joi = require('joi');

const updateStockValidation = {
  params: Joi.object({
    productId: Joi.string().uuid().required().messages({
      'string.guid': 'Product ID must be a valid UUID',
      'any.required': 'Product ID is required',
    }),
  }),
  body: Joi.object({
    stock: Joi.number().integer().min(0).required().messages({
      'number.min': 'Stock cannot be negative',
      'any.required': 'Stock is required',
    }),
  }),
};

module.exports = updateStockValidation;

