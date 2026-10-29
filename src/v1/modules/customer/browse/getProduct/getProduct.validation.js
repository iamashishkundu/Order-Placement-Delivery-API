const Joi = require('joi');

const getProductValidation = {
  params: Joi.object({
    productId: Joi.string().uuid().required().messages({
      'string.guid': 'Product ID must be a valid UUID',
      'any.required': 'Product ID is required',
    }),
  }),
};

module.exports = getProductValidation;

