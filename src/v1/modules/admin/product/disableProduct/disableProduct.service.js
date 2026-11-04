const Product = require('../../../vendor/models/product.model');
const CartItem = require('../../../customer/models/cartItem.model');
const realtimeService = require('../../../../../common/services/realtime.service');
const { ITEM_UNAVAILABLE_REASONS } = require('../../../../../realtime/events');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const disableProduct = async (productId) => {
  const product = await Product.findByPk(productId);

  if (!product) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Product not found with ID ${productId}.`);
  }

  product.isDisabledByAdmin = true;
  await product.save();

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
        reason: ITEM_UNAVAILABLE_REASONS.PRODUCT_DISABLED,
      });
    }
  } catch (emitErr) {
    console.error('[DisableProduct] Realtime emit error:', emitErr.message);
  }

  return product;
};

module.exports = {
  disableProduct,
};
