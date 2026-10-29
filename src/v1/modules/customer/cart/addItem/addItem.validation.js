const Joi = require('joi');

const addItemValidation = {
  body: Joi.object({
    productId: Joi.string().uuid().required().messages({
      'string.guid': 'Product ID must be a valid UUID',
      'any.required': 'Product ID is required',
    }),
    quantity: Joi.number().integer().min(1).default(1).messages({
      'number.min': 'Quantity must be at least 1',
    }),
  }),
};

module.exports = addItemValidation;

