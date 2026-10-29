const Joi = require('joi');

const listProductsValidation = {
  query: Joi.object({
    categoryId: Joi.string().uuid().optional(),
    vendorId: Joi.string().uuid().optional(),
    isAvailable: Joi.boolean().optional(),
    isDisabledByAdmin: Joi.boolean().optional(),
    search: Joi.string().trim().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = listProductsValidation;

