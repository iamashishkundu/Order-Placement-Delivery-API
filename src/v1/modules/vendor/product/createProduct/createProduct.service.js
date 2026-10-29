const Product = require('../../models/product.model');
const Category = require('../../../admin/models/category.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const createProduct = async (vendorId, { categoryId, name, description, price, stock = 0, isAvailable = true }) => {
  const category = await Category.findByPk(categoryId);
  if (!category || !category.isActive) {
    throw ApiError.badRequest(
      ERROR_CODES.NOT_FOUND,
      'Invalid category: Category does not exist or is inactive.'
    );
  }

  const product = await Product.create({
    vendorId,
    categoryId,
    name: name.trim(),
    description: description ? description.trim() : null,
    price,
    stock,
    isAvailable,
    isDisabledByAdmin: false,
  });

  return product;
};

module.exports = {
  createProduct,
};

