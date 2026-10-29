const CartItem = require('../../models/cartItem.model');
const Product = require('../../../vendor/models/product.model');
const Vendor = require('../../../vendor/models/vendor.model');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');
const VENDOR_STATUS = require('../../../../../common/constants/vendorStatus');

const addItem = async (customerId, { productId, quantity = 1 }) => {
  const product = await Product.findOne({
    where: {
      id: productId,
      isAvailable: true,
      isDisabledByAdmin: false,
    },
    include: [
      {
        model: Vendor,
        as: 'vendor',
        where: {
          status: VENDOR_STATUS.APPROVED,
          profileCompleted: true,
        },
      },
    ],
  });

  if (!product) {
    throw ApiError.notFound(
      ERROR_CODES.NOT_FOUND,
      'Product not found or unavailable for purchase.'
    );
  }

  // Find existing cart item for customer + product
  const existingCartItem = await CartItem.findOne({
    where: { customerId, productId },
  });

  const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;
  const newTotalQuantity = currentCartQuantity + quantity;

  if (newTotalQuantity > product.stock) {
    throw ApiError.badRequest(
      ERROR_CODES.INSUFFICIENT_STOCK,
      `Insufficient stock. Available stock is ${product.stock}, but cart total would be ${newTotalQuantity}.`,
      { availableStock: product.stock, requestedTotal: newTotalQuantity }
    );
  }

  if (existingCartItem) {
    existingCartItem.quantity = newTotalQuantity;
    await existingCartItem.save();
    return existingCartItem;
  }

  const newCartItem = await CartItem.create({
    customerId,
    productId,
    quantity,
  });

  return newCartItem;
};

module.exports = {
  addItem,
};

