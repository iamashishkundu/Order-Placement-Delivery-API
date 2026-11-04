const { Op } = require('sequelize');
const Product = require('../../models/product.model');
const CartItem = require('../../../customer/models/cartItem.model');
const realtimeService = require('../../../../../common/services/realtime.service');
const {
  STOCK_UPDATE_REASONS,
  ITEM_UNAVAILABLE_REASONS,
} = require('../../../../../realtime/events');
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

  const oldStock = product.stock;
  product.stock = stock;
  await product.save();

  // Real-time broadcasts AFTER database persistence
  try {
    realtimeService.emitStockUpdated({
      productId: product.id,
      stock: product.stock,
      reason: STOCK_UPDATE_REASONS.VENDOR_UPDATE,
    });

    if (parseInt(product.stock, 10) < parseInt(oldStock, 10)) {
      const affectedCarts = await CartItem.findAll({
        where: {
          productId: product.id,
          quantity: { [Op.gt]: product.stock },
        },
      });

      for (const ci of affectedCarts) {
        realtimeService.emitCartItemUnavailable({
          customerId: ci.customerId,
          productId: product.id,
          availableStock: product.stock,
          cartQuantity: ci.quantity,
          reason:
            product.stock <= 0
              ? ITEM_UNAVAILABLE_REASONS.OUT_OF_STOCK
              : ITEM_UNAVAILABLE_REASONS.INSUFFICIENT_STOCK,
        });
      }
    }
  } catch (emitErr) {
    console.error('[UpdateStock] Realtime emit error:', emitErr.message);
  }

  return product;
};

module.exports = {
  updateStock,
};
