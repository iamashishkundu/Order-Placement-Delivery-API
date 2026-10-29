const { Op } = require('sequelize');
const Category = require('../../models/category.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const createCategory = async ({ name, isActive = true }) => {
  const trimmedName = name.trim();

  const existing = await Category.findOne({
    where: {
      name: { [Op.iLike]: trimmedName },
    },
  });

  if (existing) {
    throw ApiError.conflict(
      ERROR_CODES.DUPLICATE_RESOURCE,
      `Category with name '${trimmedName}' already exists.`
    );
  }

  const category = await Category.create({
    name: trimmedName,
    isActive,
  });

  return category;
};

module.exports = {
  createCategory,
};

