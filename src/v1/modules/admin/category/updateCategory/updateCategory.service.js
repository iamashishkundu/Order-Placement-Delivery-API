const { Op } = require('sequelize');
const Category = require('../../models/category.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const updateCategory = async (categoryId, { name, isActive }) => {
  const category = await Category.findByPk(categoryId);

  if (!category) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Category not found with ID ${categoryId}.`);
  }

  if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
    const trimmedName = name.trim();
    const existing = await Category.findOne({
      where: {
        name: { [Op.iLike]: trimmedName },
        id: { [Op.ne]: categoryId },
      },
    });

    if (existing) {
      throw ApiError.conflict(
        ERROR_CODES.DUPLICATE_RESOURCE,
        `Category with name '${trimmedName}' already exists.`
      );
    }
    category.name = trimmedName;
  }

  if (typeof isActive === 'boolean') {
    category.isActive = isActive;
  }

  await category.save();

  return category;
};

module.exports = {
  updateCategory,
};

