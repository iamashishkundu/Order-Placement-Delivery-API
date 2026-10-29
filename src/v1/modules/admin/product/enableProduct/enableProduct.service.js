const Product = require('../../../vendor/models/product.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const enableProduct = async (productId) => {
  const product = await Product.findByPk(productId);

  if (!product) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Product not found with ID ${productId}.`);
  }

  product.isDisabledByAdmin = false;
  await product.save();

  return product;
};

module.exports = {
  enableProduct,
};

