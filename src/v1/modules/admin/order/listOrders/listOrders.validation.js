const Joi = require('joi');
const {
  DERIVED_ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} = require('../../../../../common/constants/orderStatus');

const listOrdersValidation = {
  query: Joi.object({
    status: Joi.string()
      .valid(...Object.values(DERIVED_ORDER_STATUS))
      .optional(),
    paymentMethod: Joi.string()
      .valid(...Object.values(PAYMENT_METHOD))
      .optional(),
    paymentStatus: Joi.string()
      .valid(...Object.values(PAYMENT_STATUS))
      .optional(),
    disputed: Joi.boolean().optional(),
    vendorId: Joi.string().uuid().optional(),
    customerId: Joi.string().uuid().optional(),
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = listOrdersValidation;
