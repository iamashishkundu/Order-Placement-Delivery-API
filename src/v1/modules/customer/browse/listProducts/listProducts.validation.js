const Joi = require('joi');

const listProductsValidation = {
  query: Joi.object({
    search: Joi.string().trim().optional(),
    categoryId: Joi.string().uuid().optional(),
    vendorId: Joi.string().uuid().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = listProductsValidation;

