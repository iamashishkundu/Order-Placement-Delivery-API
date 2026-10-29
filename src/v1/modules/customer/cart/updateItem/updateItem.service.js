const CartItem = require('../../models/cartItem.model');
const Product = require('../../../vendor/models/product.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const updateItem = async (customerId, productId, quantity) => {
  const cartItem = await CartItem.findOne({
    where: { customerId, productId },
  });

  if (!cartItem) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, 'Item not found in cart.');
  }

  const product = await Product.findByPk(productId);
  if (!product || !product.isAvailable || product.isDisabledByAdmin) {
    throw ApiError.badRequest(
      ERROR_CODES.NOT_FOUND,
      'Product is no longer available.'
    );
  }

  if (quantity > product.stock) {
    throw ApiError.badRequest(
      ERROR_CODES.INSUFFICIENT_STOCK,
      `Insufficient stock. Available stock is ${product.stock}, but requested quantity is ${quantity}.`,
      { availableStock: product.stock, requestedQuantity: quantity }
    );
  }

  cartItem.quantity = quantity;
  await cartItem.save();

  return cartItem;
};

module.exports = {
  updateItem,
};

