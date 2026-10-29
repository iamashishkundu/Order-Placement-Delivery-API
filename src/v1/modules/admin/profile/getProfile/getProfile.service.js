const Admin = require('../../models/admin.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const getProfile = async (adminId) => {
  const admin = await Admin.findByPk(adminId, {
    attributes: ['id', 'email', 'name', 'createdAt', 'updatedAt'],
  });

  if (!admin) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, 'Admin profile not found.');
  }

  return admin;
};

module.exports = {
  getProfile,
};

