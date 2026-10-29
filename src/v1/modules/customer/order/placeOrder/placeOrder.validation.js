const Joi = require('joi');

const placeOrderValidation = {
  body: Joi.object({
    addressId: Joi.string().uuid().required().messages({
      'string.guid': 'Address ID must be a valid UUID',
      'any.required': 'Address ID is required',
    }),
    paymentMethod: Joi.string().optional(),
  }),
};

module.exports = placeOrderValidation;
