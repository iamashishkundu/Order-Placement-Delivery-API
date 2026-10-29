const Joi = require('joi');

const updateCategoryValidation = {
  params: Joi.object({
    categoryId: Joi.string().uuid().required().messages({
      'string.guid': 'Category ID must be a valid UUID',
      'any.required': 'Category ID is required',
    }),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    isActive: Joi.boolean().optional(),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field (name or isActive) must be provided for update',
    }),
};

module.exports = updateCategoryValidation;

