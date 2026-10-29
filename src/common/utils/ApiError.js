const ERROR_CODES = require('../constants/errorCodes');

class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || ERROR_CODES.INTERNAL_SERVER_ERROR;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(code, message, details = null) {
    return new ApiError(400, code || ERROR_CODES.VALIDATION_ERROR, message, details);
  }

  static unauthorized(code, message = 'Unauthorized', details = null) {
    return new ApiError(401, code || ERROR_CODES.UNAUTHORIZED, message, details);
  }

  static forbidden(code, message = 'Forbidden', details = null) {
    return new ApiError(403, code || ERROR_CODES.FORBIDDEN, message, details);
  }

  static notFound(code, message = 'Resource not found', details = null) {
    return new ApiError(404, code || ERROR_CODES.NOT_FOUND, message, details);
  }

  static conflict(code, message = 'Conflict', details = null) {
    return new ApiError(409, code || ERROR_CODES.DUPLICATE_RESOURCE, message, details);
  }

  static badGateway(code, message = 'Bad Gateway', details = null) {
    return new ApiError(502, code || ERROR_CODES.PAYMENT_PROVIDER_ERROR, message, details);
  }

  static internal(message = 'Internal server error', details = null) {
    return new ApiError(500, ERROR_CODES.INTERNAL_SERVER_ERROR, message, details);
  }
}

module.exports = ApiError;
