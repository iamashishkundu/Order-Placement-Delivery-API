const Joi = require('joi');

const updateAddressValidation = {
  params: Joi.object({
    addressId: Joi.string().uuid().required().messages({
      'string.guid': 'Address ID must be a valid UUID',
      'any.required': 'Address ID is required',
    }),
  }),
  body: Joi.object({
    label: Joi.string().trim().min(2).max(50).optional(),
    addressLine: Joi.string().trim().min(5).max(255).optional(),
    city: Joi.string().trim().min(2).max(100).optional(),
    state: Joi.string().trim().min(2).max(100).optional(),
    pincode: Joi.string().trim().pattern(/^\d{4,10}$/).optional(),
    isDefault: Joi.boolean().optional(),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field must be provided for update',
    }),
};

module.exports = updateAddressValidation;

