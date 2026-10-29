const { sequelize } = require('../../../../../config/database');
const Order = require('../../models/order.model');
const OrderItem = require('../../models/orderItem.model');
const CartItem = require('../../models/cartItem.model');
const Address = require('../../models/address.model');
const Payment = require('../../models/payment.model');
const Customer = require('../../models/customer.model');
const Product = require('../../../vendor/models/product.model');
const Vendor = require('../../../vendor/models/vendor.model');
const stripeService = require('../../../../../common/services/stripe.service');
const {
  ITEM_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} = require('../../../../../common/constants/orderStatus');
const VENDOR_STATUS = require('../../../../../common/constants/vendorStatus');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const placeOrder = async (customerId, { addressId, paymentMethod }) => {
  // Validate paymentMethod: 'COD' | 'ONLINE' (anything else -> 400 INVALID_PAYMENT_METHOD)
  const selectedPaymentMethod = paymentMethod ? String(paymentMethod).toUpperCase() : PAYMENT_METHOD.COD;

  if (
    selectedPaymentMethod !== PAYMENT_METHOD.COD &&
    selectedPaymentMethod !== PAYMENT_METHOD.ONLINE
  ) {
    throw ApiError.badRequest(
      ERROR_CODES.INVALID_PAYMENT_METHOD,
      `Invalid payment method '${paymentMethod}'. Allowed payment methods are COD or ONLINE.`
    );
  }

  // 1. Verify address belongs to customer
  const address = await Address.findOne({
    where: { id: addressId, customerId },
  });

  if (!address) {
    throw ApiError.notFound(
      ERROR_CODES.NOT_FOUND,
      `Delivery address not found with ID ${addressId}.`
    );
  }

  const addressSnapshot = {
    addressId: address.id,
    label: address.label,
    addressLine: address.addressLine,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
  };

  // 2. Fetch customer cart items
  const cartItems = await CartItem.findAll({
    where: { customerId },
    order: [['productId', 'ASC']],
  });

  if (!cartItems || cartItems.length === 0) {
    throw ApiError.badRequest(
      ERROR_CODES.VALIDATION_ERROR,
      'Your cart is empty. Please add items before placing an order.'
    );
  }

  // 3. Execute in DB Transaction: lock rows, validate availability/stock, decrement stock, create order + payment
  const transaction = await sequelize.transaction();
  let createdOrderId = null;
  let orderItemsToCreate = [];
  let totalAmount = 0;
  let paymentRecord = null;

  try {
    const productIds = cartItems.map((ci) => ci.productId).sort();

    // Lock product rows: SELECT ... FOR UPDATE ordered by id (without outer join to avoid Postgres lock restriction)
    const lockedProducts = await Product.findAll({
      where: { id: productIds },
      order: [['id', 'ASC']],
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    const vendorIds = [...new Set(lockedProducts.map((p) => p.vendorId))];
    const vendors = await Vendor.findAll({
      where: { id: vendorIds },
      attributes: ['id', 'status', 'profileCompleted'],
      transaction,
    });
    const vendorMap = new Map();
    vendors.forEach((v) => vendorMap.set(v.id, v));

    const productMap = new Map();
    lockedProducts.forEach((p) => productMap.set(p.id, p));

    const offendingItems = [];

    for (const item of cartItems) {
      const product = productMap.get(item.productId);

      if (!product) {
        offendingItems.push({
          productId: item.productId,
          reason: 'PRODUCT_NOT_FOUND',
          message: 'Product no longer exists.',
        });
        continue;
      }

      const vendor = vendorMap.get(product.vendorId);
      const isVendorValid =
        vendor &&
        vendor.status === VENDOR_STATUS.APPROVED &&
        vendor.profileCompleted === true;

      const isProductAvailable = product.isAvailable && !product.isDisabledByAdmin;

      if (!isVendorValid || !isProductAvailable) {
        offendingItems.push({
          productId: product.id,
          productName: product.name,
          reason: 'PRODUCT_UNAVAILABLE',
          message: 'Product is no longer available from the vendor.',
        });
        continue;
      }

      if (product.stock < item.quantity) {
        offendingItems.push({
          productId: product.id,
          productName: product.name,
          availableStock: product.stock,
          requestedQuantity: item.quantity,
          reason: 'INSUFFICIENT_STOCK',
          message: `Only ${product.stock} units available, but ${item.quantity} requested.`,
        });
      }
    }

    if (offendingItems.length > 0) {
      await transaction.rollback();
      throw ApiError.conflict(
        ERROR_CODES.INSUFFICIENT_STOCK,
        'One or more items in your cart cannot be fulfilled due to availability or insufficient stock.',
        offendingItems
      );
    }

    // Decrement stock and calculate total
    const itemStatus =
      selectedPaymentMethod === PAYMENT_METHOD.ONLINE
        ? ITEM_STATUS.PENDING_PAYMENT
        : ITEM_STATUS.PLACED;

    for (const item of cartItems) {
      const product = productMap.get(item.productId);
      product.stock -= item.quantity;
      await product.save({ transaction });

      const priceAtPurchase = parseFloat(product.price);
      totalAmount += priceAtPurchase * item.quantity;

      orderItemsToCreate.push({
        vendorId: product.vendorId,
        productId: product.id,
        productName: product.name,
        priceAtPurchase,
        quantity: item.quantity,
        status: itemStatus,
      });
    }

    // Create the order
    const order = await Order.create(
      {
        customerId,
        addressSnapshot,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        currency: 'USD',
        paymentMethod: selectedPaymentMethod,
        paymentStatus: PAYMENT_STATUS.PENDING,
      },
      { transaction }
    );
    createdOrderId = order.id;

    // Create order items
    for (const itemData of orderItemsToCreate) {
      itemData.orderId = order.id;
      await OrderItem.create(itemData, { transaction });
    }

    // If ONLINE: create payments row (pending)
    if (selectedPaymentMethod === PAYMENT_METHOD.ONLINE) {
      paymentRecord = await Payment.create(
        {
          orderId: order.id,
          provider: 'stripe',
          amount: parseFloat(totalAmount.toFixed(2)),
          currency: 'USD',
          status: PAYMENT_STATUS.PENDING,
          refundedAmount: 0.0,
        },
        { transaction }
      );
    }

    // Clear cart
    await CartItem.destroy({
      where: { customerId },
      transaction,
    });

    // Commit stock locking transaction
    await transaction.commit();
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }

  // 4. AFTER COMMIT for ONLINE: create Stripe Checkout Session
  if (selectedPaymentMethod === PAYMENT_METHOD.ONLINE) {
    let checkoutSession;
    try {
      const customer = await Customer.findByPk(customerId, {
        attributes: ['email'],
      });

      checkoutSession = await stripeService.createCheckoutSession({
        orderId: createdOrderId,
        items: orderItemsToCreate,
        customerEmail: customer?.email || null,
      });

      // Save providerSessionId on payment
      if (paymentRecord && checkoutSession.id) {
        paymentRecord.providerSessionId = checkoutSession.id;
        await paymentRecord.save();
      }
    } catch (stripeErr) {
      // If session creation fails: in a new transaction cancel the order and restore stock, return 502
      console.error(
        `[PlaceOrder Error] Stripe session creation failed for order ${createdOrderId}. Compensating...`,
        stripeErr.message
      );

      const compTx = await sequelize.transaction();
      try {
        const orderToCancel = await Order.findByPk(createdOrderId, {
          lock: compTx.LOCK.UPDATE,
          transaction: compTx,
        });

        if (orderToCancel) {
          orderToCancel.paymentStatus = PAYMENT_STATUS.FAILED;
          await orderToCancel.save({ transaction: compTx });

          const itemsToCancel = await OrderItem.findAll({
            where: { orderId: createdOrderId },
            transaction: compTx,
          });

          for (const item of itemsToCancel) {
            item.status = ITEM_STATUS.CANCELLED;
            await item.save({ transaction: compTx });

            const product = await Product.findByPk(item.productId, {
              lock: compTx.LOCK.UPDATE,
              transaction: compTx,
            });
            if (product) {
              product.stock += item.quantity;
              await product.save({ transaction: compTx });
            }
          }

          if (paymentRecord) {
            const p = await Payment.findByPk(paymentRecord.id, {
              lock: compTx.LOCK.UPDATE,
              transaction: compTx,
            });
            if (p) {
              p.status = PAYMENT_STATUS.FAILED;
              await p.save({ transaction: compTx });
            }
          }
        }

        await compTx.commit();
      } catch (rollbackErr) {
        if (!compTx.finished) await compTx.rollback();
        console.error('[PlaceOrder Error] Compensation transaction failed:', rollbackErr.message);
      }

      throw ApiError.badGateway(
        ERROR_CODES.PAYMENT_PROVIDER_ERROR,
        `Payment provider error while creating checkout session: ${stripeErr.message}`
      );
    }

    // Return the created order plus checkoutUrl
    const createdOrder = await Order.findByPk(createdOrderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
      ],
    });

    const orderJson = createdOrder.toJSON();
    return {
      ...orderJson,
      checkoutUrl: checkoutSession.url,
    };
  }

  // 5. Return created COD order
  const createdOrder = await Order.findByPk(createdOrderId, {
    include: [
      {
        model: OrderItem,
        as: 'items',
      },
    ],
  });

  return createdOrder;
};

module.exports = {
  placeOrder,
};
