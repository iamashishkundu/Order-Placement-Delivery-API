const { verifyToken } = require('../common/utils/jwt');
const ROLES = require('../common/constants/roles');
const VENDOR_STATUS = require('../common/constants/vendorStatus');
const CUSTOMER_STATUS = require('../common/constants/customerStatus');
const ERROR_CODES = require('../common/constants/errorCodes');
const env = require('../config/env');
const Customer = require('../v1/modules/customer/models/customer.model');
const Vendor = require('../v1/modules/vendor/models/vendor.model');
const Admin = require('../v1/modules/admin/models/admin.model');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// In-memory registry tracking active socket IDs per user: Map<userId, Set<socketId>>
const userSocketsMap = new Map();

/**
 * Returns active socket IDs for a given user ID.
 */
const getUserSockets = (userId) => {
  return userSocketsMap.get(userId) || new Set();
};

/**
 * Registers an active socket for a user.
 */
const registerUserSocket = (userId, socketId) => {
  if (!userSocketsMap.has(userId)) {
    userSocketsMap.set(userId, new Set());
  }
  userSocketsMap.get(userId).add(socketId);
};

/**
 * Deregisters a disconnected socket for a user.
 */
const removeUserSocket = (userId, socketId) => {
  const sockets = userSocketsMap.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      userSocketsMap.delete(userId);
    }
  }
};

/**
 * Socket.IO handshake authentication middleware.
 * Verifies JWT token from socket.handshake.auth.token or Authorization header.
 * Performs real-time account status re-validation against database.
 * Enforces per-user concurrent connection limits.
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    // 1. Extract token from handshake auth or headers
    let token = socket.handshake.auth?.token;
    if (!token && socket.handshake.headers?.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      const err = new Error('Authentication token is missing or malformed.');
      err.data = { code: ERROR_CODES.UNAUTHORIZED };
      return next(err);
    }

    // 2. Decode and verify JWT
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtErr) {
      const message =
        jwtErr.name === 'TokenExpiredError'
          ? 'Authentication token has expired.'
          : 'Invalid authentication token.';
      const err = new Error(message);
      err.data = { code: ERROR_CODES.UNAUTHORIZED };
      return next(err);
    }

    const { sub: userId, role } = decoded;
    if (!userId || !role || typeof userId !== 'string' || !UUID_REGEX.test(userId)) {
      const err = new Error('Malformed token payload.');
      err.data = { code: ERROR_CODES.UNAUTHORIZED };
      return next(err);
    }

    // 3. Re-verify account in PostgreSQL database
    let dbUser = null;

    if (role === ROLES.ADMIN) {
      dbUser = await Admin.findByPk(userId);
      if (!dbUser) {
        const err = new Error('Admin account not found.');
        err.data = { code: ERROR_CODES.UNAUTHORIZED };
        return next(err);
      }
    } else if (role === ROLES.VENDOR) {
      dbUser = await Vendor.findByPk(userId);
      if (!dbUser) {
        const err = new Error('Vendor account not found.');
        err.data = { code: ERROR_CODES.UNAUTHORIZED };
        return next(err);
      }

      // Rejection rule: blocked or rejected vendors are rejected
      if (dbUser.status === VENDOR_STATUS.BLOCKED) {
        const err = new Error('Your vendor account has been blocked.');
        err.data = { code: ERROR_CODES.VENDOR_BLOCKED };
        return next(err);
      }

      if (dbUser.status === VENDOR_STATUS.REJECTED) {
        const err = new Error('Your vendor account application was rejected.');
        err.data = { code: ERROR_CODES.VENDOR_REJECTED };
        return next(err);
      }

      if (dbUser.status !== VENDOR_STATUS.APPROVED) {
        const err = new Error('Vendor account is not approved.');
        err.data = { code: ERROR_CODES.APPROVAL_PENDING };
        return next(err);
      }
    } else if (role === ROLES.CUSTOMER) {
      dbUser = await Customer.findByPk(userId);
      if (!dbUser) {
        const err = new Error('Customer account not found.');
        err.data = { code: ERROR_CODES.UNAUTHORIZED };
        return next(err);
      }

      // Rejection rule: blocked customer token stops working immediately
      if (dbUser.status === CUSTOMER_STATUS.BLOCKED) {
        const err = new Error('Your customer account has been blocked.');
        err.data = { code: ERROR_CODES.ACCOUNT_BLOCKED };
        return next(err);
      }
    } else {
      const err = new Error('Unrecognized user role in token.');
      err.data = { code: ERROR_CODES.UNAUTHORIZED };
      return next(err);
    }

    // 4. Enforce max concurrent connections per user
    const existingSockets = getUserSockets(userId);
    if (existingSockets.size >= env.SOCKET_MAX_CONNECTIONS_PER_USER) {
      const err = new Error(
        `Connection limit exceeded: Maximum ${env.SOCKET_MAX_CONNECTIONS_PER_USER} concurrent connections allowed.`
      );
      err.data = { code: 'MAX_CONNECTIONS_EXCEEDED' };
      return next(err);
    }

    // Attach validated user information to socket
    socket.user = {
      id: userId,
      role,
      email: dbUser.email || null,
    };

    return next();
  } catch (err) {
    const error = new Error(err.message || 'Authentication error.');
    error.data = { code: err.code || ERROR_CODES.UNAUTHORIZED };
    return next(error);
  }
};

module.exports = {
  socketAuthMiddleware,
  getUserSockets,
  registerUserSocket,
  removeUserSocket,
  userSocketsMap,
};
