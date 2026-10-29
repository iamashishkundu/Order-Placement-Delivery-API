const Admin = require('../../models/admin.model');
const { comparePassword } = require('../../../../../common/utils/password');
const { signToken } = require('../../../../../common/utils/jwt');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');
const ROLES = require('../../../../../common/constants/roles');

const login = async ({ email, password }) => {
  const admin = await Admin.findOne({
    where: { email: email.toLowerCase().trim() },
  });

  if (!admin) {
    throw ApiError.unauthorized(ERROR_CODES.UNAUTHORIZED, 'Invalid email or password.');
  }

  const isMatch = await comparePassword(password, admin.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized(ERROR_CODES.UNAUTHORIZED, 'Invalid email or password.');
  }

  const token = signToken({
    sub: admin.id,
    role: ROLES.ADMIN,
  });

  return {
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: ROLES.ADMIN,
    },
    token,
  };
};

module.exports = {
  login,
};

