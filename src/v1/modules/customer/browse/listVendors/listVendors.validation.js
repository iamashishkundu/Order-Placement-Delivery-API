const Joi = require('joi');

const listVendorsValidation = {
  query: Joi.object({
    search: Joi.string().trim().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = listVendorsValidation;

