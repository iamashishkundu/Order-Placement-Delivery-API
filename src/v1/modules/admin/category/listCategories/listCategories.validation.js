const Joi = require('joi');

const listCategoriesValidation = {
  query: Joi.object({
    isActive: Joi.boolean().optional(),
    search: Joi.string().trim().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = listCategoriesValidation;

