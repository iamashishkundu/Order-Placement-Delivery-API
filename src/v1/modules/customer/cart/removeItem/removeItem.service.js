const CartItem = require('../../models/cartItem.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const removeItem = async (customerId, productId) => {
  const cartItem = await CartItem.findOne({
    where: { customerId, productId },
  });

  if (!cartItem) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, 'Item not found in cart.');
  }

  await cartItem.destroy();

  return { message: 'Item removed from cart successfully.' };
};

module.exports = {
  removeItem,
};

