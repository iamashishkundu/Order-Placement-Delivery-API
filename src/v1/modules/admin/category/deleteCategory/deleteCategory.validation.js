const Joi = require('joi');

const deleteCategoryValidation = {
  params: Joi.object({
    categoryId: Joi.string().uuid().required().messages({
      'string.guid': 'Category ID must be a valid UUID',
      'any.required': 'Category ID is required',
    }),
  }),
};

module.exports = deleteCategoryValidation;

