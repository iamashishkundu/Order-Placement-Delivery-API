const cron = require('node-cron');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const env = require('../config/env');
const Order = require('../v1/modules/customer/models/order.model');
const OrderItem = require('../v1/modules/customer/models/orderItem.model');
const Payment = require('../v1/modules/customer/models/payment.model');
const Product = require('../v1/modules/vendor/models/product.model');
const stripeService = require('../common/services/stripe.service');
const {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  ITEM_STATUS,
} = require('../common/constants/orderStatus');

/**
 * Expire stale online payments or reconcile missed webhooks.
 * Queries Stripe for session status:
 * - If session IS paid: reconciles order to paid, sets items to placed, records payment intent.
 * - If session is NOT paid: cancels the order, restores stock, sets paymentStatus = failed.
 *
 * @param {Object} [options] - Optional override parameters.
 * @param {boolean} [options.forceAll=false] - If true, checks all pending orders without waiting for 35 min cutoff.
 */
const expireStalePayments = async (options = {}) => {
  const expiryThresholdMinutes = (env.CHECKOUT_EXPIRY_MINUTES || 30) + 5;
  const cutoffTime = new Date(Date.now() - expiryThresholdMinutes * 60 * 1000);

  const whereClause = {
    paymentMethod: PAYMENT_METHOD.ONLINE,
    paymentStatus: PAYMENT_STATUS.PENDING,
  };

  if (!options.forceAll) {
    whereClause.createdAt = {
      [Op.lte]: cutoffTime,
    };
  }

  try {
    const staleOrders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: Payment,
          as: 'payment',
        },
      ],
    });

    if (staleOrders.length === 0) {
      console.log('[StalePaymentsJob] No pending stale orders found.');
      return;
    }

    console.log(`[StalePaymentsJob] Found ${staleOrders.length} candidate pending orders for verification/reconciliation.`);

    for (const order of staleOrders) {
      try {
        const payment = order.payment;
        let isPaidInStripe = false;
        let session = null;

        if (payment && payment.providerSessionId) {
          try {
            session = await stripeService.retrieveSession(payment.providerSessionId);
            if (session && session.payment_status === 'paid') {
              isPaidInStripe = true;
            }
          } catch (stripeErr) {
            console.warn(`[StalePaymentsJob] Could not retrieve Stripe session ${payment.providerSessionId} for order ${order.id}:`, stripeErr.message);
          }
        }

        if (isPaidInStripe) {
          console.log(`[StalePaymentsJob] Order ${order.id} is marked paid in Stripe; reconciling missed webhook.`);
          await sequelize.transaction(async (t) => {
            const lockedOrder = await Order.findByPk(order.id, {
              lock: t.LOCK.UPDATE,
              transaction: t,
            });

            if (lockedOrder && lockedOrder.paymentStatus === PAYMENT_STATUS.PENDING) {
              await lockedOrder.update(
                { paymentStatus: PAYMENT_STATUS.PAID },
                { transaction: t }
              );

              await OrderItem.update(
                { status: ITEM_STATUS.PLACED },
                {
                  where: { orderId: order.id, status: ITEM_STATUS.PENDING_PAYMENT },
                  transaction: t,
                }
              );

              await Payment.update(
                {
                  status: PAYMENT_STATUS.PAID,
                  providerPaymentIntentId: session?.payment_intent || payment.providerPaymentIntentId,
                },
                {
                  where: { orderId: order.id },
                  transaction: t,
                }
              );

              console.log(`[StalePaymentsJob] Reconciled missed webhook for order ${order.id}: status=paid, items=placed.`);
            }
          });
          continue;
        }

        // Cancel order and restore stock in a safe transaction with row locking
        await sequelize.transaction(async (t) => {
          // 1. Lock order row
          const lockedOrder = await Order.findByPk(order.id, {
            lock: t.LOCK.UPDATE,
            transaction: t,
          });

          if (!lockedOrder || lockedOrder.paymentStatus !== PAYMENT_STATUS.PENDING) {
            // Already handled concurrently
            return;
          }

          // 2. Fetch order items
          const items = await OrderItem.findAll({
            where: { orderId: order.id },
            transaction: t,
          });

          // Check if items are in pending_payment status
          const cancellableItems = items.filter((i) => i.status === ITEM_STATUS.PENDING_PAYMENT);

          // 3. Restore inventory for pending_payment items
          for (const item of cancellableItems) {
            const product = await Product.findByPk(item.productId, {
              lock: t.LOCK.UPDATE,
              transaction: t,
            });
            if (product) {
              product.stock += item.quantity;
              await product.save({ transaction: t });
            }
          }

          // 4. Update item status to CANCELLED
          await OrderItem.update(
            { status: ITEM_STATUS.CANCELLED },
            {
              where: { orderId: order.id, status: ITEM_STATUS.PENDING_PAYMENT },
              transaction: t,
            }
          );

          // 5. Update Order status to failed
          await lockedOrder.update(
            { paymentStatus: PAYMENT_STATUS.FAILED },
            { transaction: t }
          );

          // 6. Update Payment status to failed
          await Payment.update(
            { status: PAYMENT_STATUS.FAILED },
            {
              where: { orderId: order.id },
              transaction: t,
            }
          );

          console.log(`[StalePaymentsJob] Expired stale order ${order.id}. Restored stock and marked failed.`);
        });
      } catch (err) {
        console.error(`[StalePaymentsJob] Error expiring order ${order.id}:`, err);
      }
    }
  } catch (outerErr) {
    console.error('[StalePaymentsJob] Error in expireStalePayments job run:', outerErr);
  }
};

let jobSchedule = null;

const startExpireStalePaymentsJob = () => {
  jobSchedule = cron.schedule('*/5 * * * *', async () => {
    console.log('[StalePaymentsJob] Running periodic stale payments expiration check...');
    await expireStalePayments();
  });
  console.log('[StalePaymentsJob] Stale payments expiration job scheduled (every 5 minutes).');
  return jobSchedule;
};

const stopExpireStalePaymentsJob = () => {
  if (jobSchedule) {
    jobSchedule.stop();
    jobSchedule = null;
  }
};

module.exports = {
  expireStalePayments,
  startExpireStalePaymentsJob,
  stopExpireStalePaymentsJob,
};
