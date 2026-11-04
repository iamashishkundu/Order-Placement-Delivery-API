const Product = require('../../models/product.model');
const CartItem = require('../../../customer/models/cartItem.model');
const realtimeService = require('../../../../../common/services/realtime.service');
const { ITEM_UNAVAILABLE_REASONS } = require('../../../../../realtime/events');
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

  // Real-time broadcasts AFTER database persistence
  try {
    realtimeService.emitProductAvailabilityChanged({
      productId: product.id,
      isVisible: false,
    });

    const affectedCarts = await CartItem.findAll({ where: { productId: product.id } });
    for (const ci of affectedCarts) {
      realtimeService.emitCartItemUnavailable({
        customerId: ci.customerId,
        productId: product.id,
        availableStock: 0,
        cartQuantity: ci.quantity,
        reason: ITEM_UNAVAILABLE_REASONS.PRODUCT_DELETED,
      });
    }
  } catch (emitErr) {
    console.error('[DeleteProduct] Realtime emit error:', emitErr.message);
  }

  return { message: 'Product deleted successfully (soft delete).' };
};

module.exports = {
  deleteProduct,
};
