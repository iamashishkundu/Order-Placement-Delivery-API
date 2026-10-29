const Product = require('../../models/product.model');
const Category = require('../../../admin/models/category.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const getProduct = async (vendorId, productId) => {
  const product = await Product.findByPk(productId, {
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'isActive'],
      },
    ],
  });

  if (!product) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Product not found with ID ${productId}.`);
  }

  if (product.vendorId !== vendorId) {
    throw ApiError.forbidden(
      ERROR_CODES.FORBIDDEN,
      'Access forbidden: You do not have permission to access another vendor’s product.'
    );
  }

  return product;
};

module.exports = {
  getProduct,
};

