const Joi = require('joi');
const { ITEM_STATUS } = require('../../../../../common/constants/orderStatus');

const updateItemStatusValidation = {
  params: Joi.object({
    orderId: Joi.string().uuid().required().messages({
      'string.guid': 'Order ID must be a valid UUID',
      'any.required': 'Order ID is required',
    }),
  }),
  body: Joi.object({
    status: Joi.string()
      .valid(ITEM_STATUS.PREPARING, ITEM_STATUS.OUT_FOR_DELIVERY, ITEM_STATUS.DELIVERED)
      .required()
      .messages({
        'any.only': 'Status must be one of: preparing, out_for_delivery, delivered',
        'any.required': 'Target status is required',
      }),
  }),
};

module.exports = updateItemStatusValidation;

