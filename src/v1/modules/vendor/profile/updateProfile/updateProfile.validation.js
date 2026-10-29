const Joi = require('joi');

const updateProfileValidation = {
  body: Joi.object({
    shopName: Joi.string().trim().min(2).max(150).optional(),
    ownerName: Joi.string().trim().min(2).max(100).optional(),
    addressLine: Joi.string().trim().min(5).max(255).optional(),
    city: Joi.string().trim().min(2).max(100).optional(),
    state: Joi.string().trim().min(2).max(100).optional(),
    pincode: Joi.string().trim().pattern(/^\d{4,10}$/).optional(),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field must be provided for update',
    }),
};

module.exports = updateProfileValidation;

