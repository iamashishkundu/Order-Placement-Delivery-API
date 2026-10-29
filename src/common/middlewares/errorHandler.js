const ApiError = require('../utils/ApiError');
const ERROR_CODES = require('../constants/errorCodes');
const env = require('../../config/env');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let code = ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';
  let details = null;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    code = ERROR_CODES.DUPLICATE_RESOURCE;
    message = err.errors && err.errors[0] ? err.errors[0].message : 'Duplicate record already exists.';
    details = err.errors ? err.errors.map((e) => ({ field: e.path, message: e.message })) : null;
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Invalid reference: referenced entity does not exist.';
    details = { table: err.table, detail: err.detail };
  } else if (err.name === 'SequelizeDatabaseError') {
    statusCode = 500;
    code = ERROR_CODES.INTERNAL_SERVER_ERROR;
    message = 'Database error occurred.';
    if (env.NODE_ENV !== 'production') {
      details = { message: err.message, stack: err.stack };
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = ERROR_CODES.UNAUTHORIZED;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = ERROR_CODES.UNAUTHORIZED;
    message = 'Authentication token has expired.';
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Malformed JSON in request body.';
  } else if (err.isJoi) {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = err.details ? err.details.map((d) => d.message).join(', ') : err.message;
    details = err.details ? err.details.map((d) => ({ field: d.path.join('.'), message: d.message })) : null;
  } else {
    message = err.message || 'Internal server error';
    if (env.NODE_ENV !== 'production' && err.stack) {
      details = { stack: err.stack };
    }
  }

  const responsePayload = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details !== null && details !== undefined) {
    responsePayload.error.details = details;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;

