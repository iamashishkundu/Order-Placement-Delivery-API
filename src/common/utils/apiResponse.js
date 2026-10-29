const successResponse = (res, statusCode, message, data = null, meta = null) => {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta !== null && meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

const errorResponse = (res, statusCode, code, message, details = null) => {
  const payload = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details !== null && details !== undefined) {
    payload.error.details = details;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  successResponse,
  errorResponse,
};

