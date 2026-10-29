const Joi = require('joi');

const setDefaultAddressValidation = {
  params: Joi.object({
    addressId: Joi.string().uuid().required().messages({
      'string.guid': 'Address ID must be a valid UUID',
      'any.required': 'Address ID is required',
    }),
  }),
};

module.exports = setDefaultAddressValidation;

