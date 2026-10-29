const Product = require('../../../vendor/models/product.model');
const Category = require('../../models/category.model');
const Vendor = require('../../../vendor/models/vendor.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const getProduct = async (productId) => {
  const product = await Product.findByPk(productId, {
    include: [
      {
        model: Vendor,
        as: 'vendor',
        attributes: ['id', 'shopName', 'ownerName', 'email', 'phone', 'status'],
      },
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

  return product;
};

module.exports = {
  getProduct,
};

