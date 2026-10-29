const Joi = require('joi');

const disableProductValidation = {
  params: Joi.object({
    productId: Joi.string().uuid().required().messages({
      'string.guid': 'Product ID must be a valid UUID',
      'any.required': 'Product ID is required',
    }),
  }),
};

module.exports = disableProductValidation;

