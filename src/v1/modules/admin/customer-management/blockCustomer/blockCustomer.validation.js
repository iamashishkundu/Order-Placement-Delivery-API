const Joi = require('joi');

const blockCustomerValidation = {
  params: Joi.object({
    customerId: Joi.string().uuid().required().messages({
      'string.guid': 'Customer ID must be a valid UUID',
      'any.required': 'Customer ID is required',
    }),
  }),
};

module.exports = blockCustomerValidation;

