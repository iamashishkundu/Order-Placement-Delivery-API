const Product = require('../../models/product.model');
const Category = require('../../../admin/models/category.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const updateProduct = async (vendorId, productId, updates) => {
  const product = await Product.findByPk(productId);

  if (!product) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Product not found with ID ${productId}.`);
  }

  if (product.vendorId !== vendorId) {
    throw ApiError.forbidden(
      ERROR_CODES.FORBIDDEN,
      'Access forbidden: You cannot modify another vendor’s product.'
    );
  }

  if (updates.categoryId && updates.categoryId !== product.categoryId) {
    const category = await Category.findByPk(updates.categoryId);
    if (!category || !category.isActive) {
      throw ApiError.badRequest(
        ERROR_CODES.NOT_FOUND,
        'Invalid category: Category does not exist or is inactive.'
      );
    }
    product.categoryId = updates.categoryId;
  }

  if (updates.name !== undefined) product.name = updates.name.trim();
  if (updates.description !== undefined) product.description = updates.description ? updates.description.trim() : null;
  if (updates.price !== undefined) product.price = updates.price;
  if (updates.stock !== undefined) product.stock = updates.stock;
  if (updates.isAvailable !== undefined) product.isAvailable = updates.isAvailable;

  await product.save();

  return product;
};

module.exports = {
  updateProduct,
};

