const Category = require('../../models/category.model');
const Product = require('../../../vendor/models/product.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const deleteCategory = async (categoryId) => {
  const category = await Category.findByPk(categoryId);

  if (!category) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Category not found with ID ${categoryId}.`);
  }

  // Check if category is used by any products
  const productCount = await Product.count({
    where: { categoryId },
    paranoid: false,
  });

  if (productCount > 0) {
    throw ApiError.conflict(
      ERROR_CODES.CATEGORY_IN_USE,
      'Cannot delete category: it is currently referenced by one or more products.'
    );
  }

  await category.destroy();

  return { message: 'Category deleted successfully.' };
};

module.exports = {
  deleteCategory,
};

