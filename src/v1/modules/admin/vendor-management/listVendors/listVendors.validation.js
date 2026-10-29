const Joi = require('joi');
const VENDOR_STATUS = require('../../../../../common/constants/vendorStatus');

const listVendorsValidation = {
  query: Joi.object({
    status: Joi.string()
      .valid(...Object.values(VENDOR_STATUS))
      .optional(),
    search: Joi.string().trim().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = listVendorsValidation;

