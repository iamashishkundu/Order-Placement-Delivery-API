const Joi = require('joi');

const updateProfileValidation = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field (name or email) must be provided for update',
    }),
};

module.exports = updateProfileValidation;

