const Joi = require('joi');

const createProductValidation = {
  body: Joi.object({
    categoryId: Joi.string().uuid().required().messages({
      'string.guid': 'Category ID must be a valid UUID',
      'any.required': 'Category ID is required',
    }),
    name: Joi.string().trim().min(2).max(200).required().messages({
      'string.min': 'Product name must be at least 2 characters',
      'any.required': 'Product name is required',
    }),
    description: Joi.string().trim().allow('', null).optional(),
    price: Joi.number().positive().precision(2).required().messages({
      'number.positive': 'Price must be a positive number',
      'any.required': 'Price is required',
    }),
    stock: Joi.number().integer().min(0).default(0).messages({
      'number.min': 'Stock must be greater than or equal to 0',
    }),
    isAvailable: Joi.boolean().default(true),
  }),
};

module.exports = createProductValidation;

