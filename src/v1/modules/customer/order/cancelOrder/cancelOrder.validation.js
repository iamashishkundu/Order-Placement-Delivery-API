const Joi = require('joi');

const cancelOrderValidation = {
  params: Joi.object({
    orderId: Joi.string().uuid().required().messages({
      'string.guid': 'Order ID must be a valid UUID',
      'any.required': 'Order ID is required',
    }),
  }),
};

module.exports = cancelOrderValidation;

