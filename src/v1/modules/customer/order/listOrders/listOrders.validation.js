const Joi = require('joi');
const { DERIVED_ORDER_STATUS } = require('../../../../../common/constants/orderStatus');

const listOrdersValidation = {
  query: Joi.object({
    status: Joi.string()
      .valid(...Object.values(DERIVED_ORDER_STATUS))
      .optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = listOrdersValidation;

