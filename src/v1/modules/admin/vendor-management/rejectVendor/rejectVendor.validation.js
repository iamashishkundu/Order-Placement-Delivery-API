const Joi = require('joi');

const rejectVendorValidation = {
  params: Joi.object({
    vendorId: Joi.string().uuid().required().messages({
      'string.guid': 'Vendor ID must be a valid UUID',
      'any.required': 'Vendor ID is required',
    }),
  }),
  body: Joi.object({
    reason: Joi.string().trim().min(3).required().messages({
      'string.min': 'Rejection reason must be at least 3 characters',
      'any.required': 'Rejection reason is required',
    }),
  }),
};

module.exports = rejectVendorValidation;

