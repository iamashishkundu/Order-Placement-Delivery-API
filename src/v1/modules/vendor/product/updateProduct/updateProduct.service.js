const { Op } = require('sequelize');
const Product = require('../../models/product.model');
const Category = require('../../../admin/models/category.model');
const CartItem = require('../../../customer/models/cartItem.model');
const realtimeService = require('../../../../../common/services/realtime.service');
const {
  STOCK_UPDATE_REASONS,
  ITEM_UNAVAILABLE_REASONS,
} = require('../../../../../realtime/events');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const updateProduct = async (vendorId, productId, updates) => {
  const product = await Product.findByPk(productId);

  if (!product) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Product not found with ID ${productId}.`);
  }

  if (product.vendorId !== vendorId) {
    throw ApiError.forbidden(
      ERROR_CODES.FORBIDDEN,
      'Access forbidden: You cannot modify another vendor’s product.'
    );
  }

  if (updates.categoryId && updates.categoryId !== product.categoryId) {
    const category = await Category.findByPk(updates.categoryId);
    if (!category || !category.isActive) {
      throw ApiError.badRequest(
        ERROR_CODES.NOT_FOUND,
        'Invalid category: Category does not exist or is inactive.'
      );
    }
    product.categoryId = updates.categoryId;
  }

  const oldPrice = product.price;
  const oldStock = product.stock;
  const oldIsAvailable = product.isAvailable;

  if (updates.name !== undefined) product.name = updates.name.trim();
  if (updates.description !== undefined) product.description = updates.description ? updates.description.trim() : null;
  if (updates.price !== undefined) product.price = updates.price;
  if (updates.stock !== undefined) product.stock = updates.stock;
  if (updates.isAvailable !== undefined) product.isAvailable = updates.isAvailable;

  await product.save();

  // Real-time broadcasts AFTER database persistence
  try {
    // 1. Price change
    const priceChanged =
      updates.price !== undefined && parseFloat(updates.price) !== parseFloat(oldPrice);
    if (priceChanged) {
      realtimeService.emitPriceUpdated({
        productId: product.id,
        oldPrice,
        newPrice: product.price,
      });

      const cartItems = await CartItem.findAll({ where: { productId: product.id } });
      for (const ci of cartItems) {
        const newLineTotal = parseFloat((Number(ci.quantity) * Number(product.price)).toFixed(2));
        realtimeService.emitCartPriceChanged({
          customerId: ci.customerId,
          productId: product.id,
          oldPrice,
          newPrice: product.price,
          quantity: ci.quantity,
          newLineTotal,
        });
      }
    }

    // 2. Stock change
    const stockChanged =
      updates.stock !== undefined && parseInt(updates.stock, 10) !== parseInt(oldStock, 10);
    if (stockChanged) {
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
    }

    // 3. Availability change
    const availabilityChanged =
      updates.isAvailable !== undefined && updates.isAvailable !== oldIsAvailable;
    if (availabilityChanged) {
      realtimeService.emitProductAvailabilityChanged({
        productId: product.id,
        isVisible: product.isAvailable,
      });

      if (!product.isAvailable) {
        const affectedCarts = await CartItem.findAll({ where: { productId: product.id } });
        for (const ci of affectedCarts) {
          realtimeService.emitCartItemUnavailable({
            customerId: ci.customerId,
            productId: product.id,
            availableStock: 0,
            cartQuantity: ci.quantity,
            reason: ITEM_UNAVAILABLE_REASONS.PRODUCT_UNAVAILABLE,
          });
        }
      }
    }
  } catch (emitErr) {
    console.error('[UpdateProduct] Realtime emit error:', emitErr.message);
  }

  return product;
};

module.exports = {
  updateProduct,
};
