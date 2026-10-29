const ApiError = require('../utils/ApiError');
const ERROR_CODES = require('../constants/errorCodes');

/**
 * Middleware to restrict access by user role.
 * @param {string|string[]} roles - Allowed role or array of roles
 */
const authorizeRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized(ERROR_CODES.UNAUTHORIZED, 'Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          ERROR_CODES.FORBIDDEN,
          `Access forbidden: role '${req.user.role}' is not authorized for this resource.`
        )
      );
    }

    return next();
  };
};

module.exports = authorizeRole;

