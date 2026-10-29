const ApiError = require('../utils/ApiError');
const ERROR_CODES = require('../constants/errorCodes');

/**
 * Validation middleware using Joi schemas.
 * Accepts a schema object containing any of: body, query, params, headers.
 * Extracts all errors and returns standardized 400 VALIDATION_ERROR.
 */
const validate = (schema) => (req, res, next) => {
  if (!schema) return next();

  const toValidate = {};
  if (schema.body) toValidate.body = req.body;
  if (schema.query) toValidate.query = req.query;
  if (schema.params) toValidate.params = req.params;
  if (schema.headers) toValidate.headers = req.headers;

  const validationOptions = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  };

  const keys = Object.keys(toValidate);
  for (const key of keys) {
    if (schema[key]) {
      const { error, value } = schema[key].validate(toValidate[key], validationOptions);
      if (error) {
        const details = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/['"]/g, ''),
        }));

        const primaryMessage = details.map((d) => d.message).join('; ');

        return next(
          ApiError.badRequest(ERROR_CODES.VALIDATION_ERROR, primaryMessage, details)
        );
      }
      // Re-assign sanitized and casted values
      req[key] = value;
    }
  }

  return next();
};

module.exports = validate;

