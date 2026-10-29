const Product = require('../../models/product.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const deleteProduct = async (vendorId, productId) => {
  const product = await Product.findByPk(productId);

  if (!product) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Product not found with ID ${productId}.`);
  }

  if (product.vendorId !== vendorId) {
    throw ApiError.forbidden(
      ERROR_CODES.FORBIDDEN,
      'Access forbidden: You cannot delete another vendor’s product.'
    );
  }

  // Soft delete using Sequelize paranoid delete (sets deletedAt timestamp)
  await product.destroy();

  return { message: 'Product deleted successfully (soft delete).' };
};

module.exports = {
  deleteProduct,
};

