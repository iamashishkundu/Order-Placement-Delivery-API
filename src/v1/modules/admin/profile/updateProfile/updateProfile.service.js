const { Op } = require('sequelize');
const Admin = require('../../models/admin.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const updateProfile = async (adminId, { name, email }) => {
  const admin = await Admin.findByPk(adminId);
  if (!admin) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, 'Admin account not found.');
  }

  if (email && email.toLowerCase().trim() !== admin.email) {
    const existing = await Admin.findOne({
      where: {
        email: email.toLowerCase().trim(),
        id: { [Op.ne]: adminId },
      },
    });

    if (existing) {
      throw ApiError.conflict(ERROR_CODES.DUPLICATE_RESOURCE, 'Email already in use by another admin.');
    }
    admin.email = email.toLowerCase().trim();
  }

  if (name) {
    admin.name = name.trim();
  }

  await admin.save();

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    updatedAt: admin.updatedAt,
  };
};

module.exports = {
  updateProfile,
};

