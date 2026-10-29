const Admin = require('../../models/admin.model');
const { comparePassword, hashPassword } = require('../../../../../common/utils/password');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const changePassword = async (adminId, { currentPassword, newPassword }) => {
  const admin = await Admin.findByPk(adminId);
  if (!admin) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, 'Admin account not found.');
  }

  const isMatch = await comparePassword(currentPassword, admin.passwordHash);
  if (!isMatch) {
    throw ApiError.badRequest(ERROR_CODES.VALIDATION_ERROR, 'Current password does not match.');
  }

  if (currentPassword === newPassword) {
    throw ApiError.badRequest(
      ERROR_CODES.VALIDATION_ERROR,
      'New password cannot be the same as the current password.'
    );
  }

  admin.passwordHash = await hashPassword(newPassword);
  await admin.save();

  return { message: 'Password changed successfully.' };
};

module.exports = {
  changePassword,
};

