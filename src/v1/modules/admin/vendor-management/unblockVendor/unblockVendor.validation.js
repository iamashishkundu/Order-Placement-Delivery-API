const Joi = require('joi');

const unblockVendorValidation = {
  params: Joi.object({
    vendorId: Joi.string().uuid().required().messages({
      'string.guid': 'Vendor ID must be a valid UUID',
      'any.required': 'Vendor ID is required',
    }),
  }),
};

module.exports = unblockVendorValidation;

