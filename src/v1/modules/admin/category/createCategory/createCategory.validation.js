const Joi = require('joi');

const createCategoryValidation = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
      'string.min': 'Category name must be at least 2 characters',
      'any.required': 'Category name is required',
    }),
    isActive: Joi.boolean().default(true),
  }),
};

module.exports = createCategoryValidation;

