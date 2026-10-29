const Joi = require('joi');
const CUSTOMER_STATUS = require('../../../../../common/constants/customerStatus');

const listCustomersValidation = {
  query: Joi.object({
    status: Joi.string()
      .valid(...Object.values(CUSTOMER_STATUS))
      .optional(),
    search: Joi.string().trim().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = listCustomersValidation;

