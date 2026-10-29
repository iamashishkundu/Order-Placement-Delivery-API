const Joi = require('joi');
const { ITEM_STATUS } = require('../../../../../common/constants/orderStatus');

const allowedVendorStatuses = [
  ITEM_STATUS.PLACED,
  ITEM_STATUS.PREPARING,
  ITEM_STATUS.OUT_FOR_DELIVERY,
  ITEM_STATUS.DELIVERED,
  ITEM_STATUS.CANCELLED,
];

const listOrdersValidation = {
  query: Joi.object({
    status: Joi.string()
      .valid(...allowedVendorStatuses)
      .optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = listOrdersValidation;
