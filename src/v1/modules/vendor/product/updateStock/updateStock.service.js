const Product = require('../../models/product.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const updateStock = async (vendorId, productId, stock) => {
  const product = await Product.findByPk(productId);

  if (!product) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Product not found with ID ${productId}.`);
  }

  if (product.vendorId !== vendorId) {
    throw ApiError.forbidden(
      ERROR_CODES.FORBIDDEN,
      'Access forbidden: You cannot modify another vendor’s product stock.'
    );
  }

  product.stock = stock;
  await product.save();

  return product;
};

module.exports = {
  updateStock,
};

