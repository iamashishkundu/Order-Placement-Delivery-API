const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const ERROR_CODES = require('../constants/errorCodes');
const ROLES = require('../constants/roles');
const { getModels } = require('../../config/database');

/**
 * Authentication middleware.
 * Verifies JWT token from Authorization header (Bearer token).
 * Re-checks account existence and status from DB on each request.
 * If customer is blocked, immediately denies access with ACCOUNT_BLOCKED.
 * If vendor is blocked or rejected, attaches latest status so vendorGate can permit only getStatus.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized(ERROR_CODES.UNAUTHORIZED, 'Authentication token is missing or malformed.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized(ERROR_CODES.UNAUTHORIZED, 'Authentication token is required.');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      throw ApiError.unauthorized(
        ERROR_CODES.UNAUTHORIZED,
        err.name === 'TokenExpiredError' ? 'Authentication token has expired.' : 'Invalid authentication token.'
      );
    }

    const { sub: userId, role } = decoded;
    if (!userId || !role) {
      throw ApiError.unauthorized(ERROR_CODES.UNAUTHORIZED, 'Malformed token payload.');
    }

    const models = getModels();

    if (role === ROLES.ADMIN) {
      if (models.Admin) {
        const admin = await models.Admin.findByPk(userId);
        if (!admin) {
          throw ApiError.unauthorized(ERROR_CODES.UNAUTHORIZED, 'Admin account not found.');
        }
        req.user = {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: ROLES.ADMIN,
        };
      } else {
        req.user = { id: userId, role: ROLES.ADMIN };
      }
    } else if (role === ROLES.VENDOR) {
      if (models.Vendor) {
        const vendor = await models.Vendor.findByPk(userId);
        if (!vendor) {
          throw ApiError.unauthorized(ERROR_CODES.UNAUTHORIZED, 'Vendor account not found.');
        }

        // Live check: status is freshly fetched from DB
        req.user = {
          id: vendor.id,
          email: vendor.email,
          phone: vendor.phone,
          status: vendor.status,
          rejectionReason: vendor.rejectionReason,
          isPhoneVerified: vendor.isPhoneVerified,
          isEmailVerified: vendor.isEmailVerified,
          profileCompleted: vendor.profileCompleted,
          shopName: vendor.shopName,
          ownerName: vendor.ownerName,
          role: ROLES.VENDOR,
        };
      } else {
        req.user = { id: userId, role: ROLES.VENDOR };
      }
    } else if (role === ROLES.CUSTOMER) {
      if (models.Customer) {
        const customer = await models.Customer.findByPk(userId);
        if (!customer) {
          throw ApiError.unauthorized(ERROR_CODES.UNAUTHORIZED, 'Customer account not found.');
        }

        // Re-check account status in DB: blocked customer token stops working immediately
        if (customer.status === 'blocked') {
          throw ApiError.forbidden(ERROR_CODES.ACCOUNT_BLOCKED, 'Your customer account has been blocked.');
        }

        req.user = {
          id: customer.id,
          phone: customer.phone,
          name: customer.name,
          email: customer.email,
          status: customer.status,
          isPhoneVerified: customer.isPhoneVerified,
          role: ROLES.CUSTOMER,
        };
      } else {
        req.user = { id: userId, role: ROLES.CUSTOMER };
      }
    } else {
      throw ApiError.unauthorized(ERROR_CODES.UNAUTHORIZED, 'Unrecognized user role in token.');
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = authenticate;

