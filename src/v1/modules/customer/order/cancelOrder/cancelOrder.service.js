const { sequelize } = require('../../../../../config/database');
const Order = require('../../models/order.model');
const OrderItem = require('../../models/orderItem.model');
const Payment = require('../../models/payment.model');
const Product = require('../../../vendor/models/product.model');
const stripeService = require('../../../../../common/services/stripe.service');
const {
  ITEM_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} = require('../../../../../common/constants/orderStatus');
const {
  isOrderCancellable,
  computeDerivedOrderStatus,
} = require('../../../../../common/services/orderStatus');
const ApiError = require('../../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../../common/constants/errorCodes');

const cancelOrder = async (customerId, orderId) => {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: OrderItem,
        as: 'items',
      },
    ],
  });

  if (!order) {
    throw ApiError.notFound(ERROR_CODES.NOT_FOUND, `Order not found with ID ${orderId}.`);
  }

  if (order.customerId !== customerId) {
    throw ApiError.forbidden(
      ERROR_CODES.FORBIDDEN,
      'Access forbidden: You cannot cancel another customer’s order.'
    );
  }

  // Allowed only if ALL items are 'placed' (or all are 'pending_payment'); otherwise 409
  if (!isOrderCancellable(order.items)) {
    throw ApiError.conflict(
      ERROR_CODES.ORDER_NOT_CANCELLABLE,
      'Order cannot be cancelled because one or more items are already being prepared, out for delivery, delivered, or cancelled.'
    );
  }

  const allPendingPayment = order.items.every(
    (item) => item.status === ITEM_STATUS.PENDING_PAYMENT
  );

  // --- ONLINE ORDER HANDLING ---
  if (order.paymentMethod === PAYMENT_METHOD.ONLINE) {
    const payment = await Payment.findOne({ where: { orderId: order.id } });

    // Case 1: ONLINE order still pending_payment
    if (allPendingPayment) {
      if (payment && payment.providerSessionId) {
        try {
          await stripeService.expireSession(payment.providerSessionId);
        } catch (expireErr) {
          console.warn(
            `[CancelOrder] Could not expire Stripe session ${payment.providerSessionId}:`,
            expireErr.message
          );
        }
      }

      const transaction = await sequelize.transaction();
      try {
        const lockedOrder = await Order.findByPk(order.id, {
          lock: transaction.LOCK.UPDATE,
          transaction,
        });

        lockedOrder.paymentStatus = PAYMENT_STATUS.FAILED;
        await lockedOrder.save({ transaction });

        if (payment) {
          payment.status = PAYMENT_STATUS.FAILED;
          await payment.save({ transaction });
        }

        const sortedItems = [...order.items].sort((a, b) =>
          String(a.productId).localeCompare(String(b.productId))
        );

        for (const item of sortedItems) {
          item.status = ITEM_STATUS.CANCELLED;
          await item.save({ transaction });

          const product = await Product.findByPk(item.productId, {
            lock: transaction.LOCK.UPDATE,
            transaction,
          });

          if (product) {
            product.stock += item.quantity;
            await product.save({ transaction });
          }
        }

        await transaction.commit();

        const derivedStatus = computeDerivedOrderStatus(order.items);
        return {
          message: 'Pending payment order cancelled, session expired, and stock restored.',
          orderId: order.id,
          derivedStatus,
          paymentStatus: PAYMENT_STATUS.FAILED,
          items: order.items,
        };
      } catch (err) {
        if (!transaction.finished) await transaction.rollback();
        throw err;
      }
    }

    // Case 2: ONLINE order paid -> create a full Stripe refund
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      if (!payment || !payment.providerPaymentIntentId) {
        throw ApiError.badGateway(
          ERROR_CODES.PAYMENT_PROVIDER_ERROR,
          'Payment details missing for paid order refund.'
        );
      }

      // External network call BEFORE DB mutation. If this fails, nothing in DB changes.
      const refund = await stripeService.createRefund({
        paymentIntentId: payment.providerPaymentIntentId,
        idempotencyKey: `refund-${order.id}`,
      });

      const transaction = await sequelize.transaction();
      try {
        const lockedOrder = await Order.findByPk(order.id, {
          lock: transaction.LOCK.UPDATE,
          transaction,
        });

        lockedOrder.paymentStatus = PAYMENT_STATUS.REFUNDED;
        await lockedOrder.save({ transaction });

        payment.status = PAYMENT_STATUS.REFUNDED;
        payment.refundId = refund.id;
        payment.refundedAmount = parseFloat(order.totalAmount);
        await payment.save({ transaction });

        const sortedItems = [...order.items].sort((a, b) =>
          String(a.productId).localeCompare(String(b.productId))
        );

        for (const item of sortedItems) {
          item.status = ITEM_STATUS.CANCELLED;
          await item.save({ transaction });

          const product = await Product.findByPk(item.productId, {
            lock: transaction.LOCK.UPDATE,
            transaction,
          });

          if (product) {
            product.stock += item.quantity;
            await product.save({ transaction });
          }
        }

        await transaction.commit();

        const derivedStatus = computeDerivedOrderStatus(order.items);
        return {
          message: 'Paid order cancelled, full refund issued, and stock restored.',
          orderId: order.id,
          derivedStatus,
          paymentStatus: PAYMENT_STATUS.REFUNDED,
          refundId: refund.id,
          items: order.items,
        };
      } catch (err) {
        if (!transaction.finished) await transaction.rollback();
        throw err;
      }
    }
  }

  // --- COD ORDER HANDLING ---
  const transaction = await sequelize.transaction();
  try {
    const sortedItems = [...order.items].sort((a, b) =>
      String(a.productId).localeCompare(String(b.productId))
    );

    for (const item of sortedItems) {
      item.status = ITEM_STATUS.CANCELLED;
      await item.save({ transaction });

      const product = await Product.findByPk(item.productId, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (product) {
        product.stock += item.quantity;
        await product.save({ transaction });
      }
    }

    await transaction.commit();

    const derivedStatus = computeDerivedOrderStatus(order.items);
    return {
      message: 'Order cancelled successfully and product stock restored.',
      orderId: order.id,
      derivedStatus,
      items: order.items,
    };
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
};

module.exports = {
  cancelOrder,
};
