const Joi = require('joi');

const updateProductValidation = {
  params: Joi.object({
    productId: Joi.string().uuid().required().messages({
      'string.guid': 'Product ID must be a valid UUID',
      'any.required': 'Product ID is required',
    }),
  }),
  body: Joi.object({
    categoryId: Joi.string().uuid().optional(),
    name: Joi.string().trim().min(2).max(200).optional(),
    description: Joi.string().trim().allow('', null).optional(),
    price: Joi.number().positive().precision(2).optional(),
    stock: Joi.number().integer().min(0).optional(),
    isAvailable: Joi.boolean().optional(),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field must be provided for update',
    }),
};

module.exports = updateProductValidation;

