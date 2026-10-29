const { sequelize } = require('../../../config/database');
const Order = require('../../../v1/modules/customer/models/order.model');
const OrderItem = require('../../../v1/modules/customer/models/orderItem.model');
const Payment = require('../../../v1/modules/customer/models/payment.model');
const StripeEvent = require('../../../v1/modules/customer/models/stripeEvent.model');
const Product = require('../../../v1/modules/vendor/models/product.model');
const stripeService = require('../../../common/services/stripe.service');
const { notifyAdmin } = require('../../../common/services/notifyAdmin.service');
const {
  ITEM_STATUS,
  PAYMENT_STATUS,
} = require('../../../common/constants/orderStatus');

/**
 * Handles incoming Stripe Webhooks:
 * - checkout.session.completed
 * - checkout.session.expired
 * - charge.refunded
 * - charge.dispute.created
 * - charge.dispute.closed
 * Any other event returns 200 and is ignored.
 */
const handleStripeWebhook = async (rawPayload, signatureHeader) => {
  // 1. Verify cryptographic signature via Stripe service (constructEvent)
  const event = stripeService.constructWebhookEvent(rawPayload, signatureHeader);

  // 2. Atomic idempotency insertion into stripe_events
  try {
    await StripeEvent.create({
      eventId: event.id,
      type: event.type,
      processedAt: new Date(),
    });
  } catch (dupError) {
    // Unique constraint violation: already processed
    console.log(`[Stripe Webhook] Event ${event.id} already processed. Returning 200 (idempotent).`);
    return { received: true, idempotent: true, message: 'Event already processed.' };
  }

  const object = event.data?.object || {};

  // 3. Process events via switch statement
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = object;
      const orderId = session.metadata?.orderId || session.client_reference_id;

      if (!orderId) {
        console.warn(`[Stripe Webhook] checkout.session.completed missing orderId in metadata. Event ID: ${event.id}`);
        return { received: true, message: 'Missing orderId metadata.' };
      }

      const transaction = await sequelize.transaction();
      try {
        // Lock the order row directly (avoid outer join lock for Postgres compatibility)
        const order = await Order.findByPk(orderId, {
          lock: transaction.LOCK.UPDATE,
          transaction,
        });

        if (!order) {
          await transaction.rollback();
          console.warn(`[Stripe Webhook] Order ${orderId} not found for session ${session.id}. Returning 200.`);
          return { received: true, message: 'Order not found.' };
        }

        const items = await OrderItem.findAll({
          where: { orderId: order.id },
          transaction,
        });
        order.items = items;

        // Verify session parameters
        const orderTotalCents = Math.round(parseFloat(order.totalAmount) * 100);
        const isPaid = session.payment_status === 'paid';
        const amountMatches = Number(session.amount_total) === orderTotalCents;
        const currencyMatches =
          (session.currency || '').toLowerCase() === (order.currency || 'USD').toLowerCase();

        if (!isPaid || !amountMatches || !currencyMatches) {
          await transaction.rollback();
          console.warn(
            `[Stripe Webhook] Session verification mismatch for order ${order.id}: paid=${isPaid}, amountMatches=${amountMatches}, currencyMatches=${currencyMatches}`
          );
          return { received: true, message: 'Session verification mismatch.' };
        }

        // Check race condition: If order was already cancelled or failed
        const isCancelledOrFailed =
          order.paymentStatus === PAYMENT_STATUS.FAILED ||
          order.paymentStatus === PAYMENT_STATUS.REFUNDED ||
          (items && items.length > 0 && items.every((i) => i.status === ITEM_STATUS.CANCELLED));

        if (isCancelledOrFailed) {
          await transaction.commit();
          console.warn(`[Stripe Webhook] Order ${order.id} was already cancelled/failed. Issuing automatic full refund.`);

          if (session.payment_intent) {
            await stripeService.createRefund({
              paymentIntentId: session.payment_intent,
              reason: 'duplicate',
              idempotencyKey: `refund-auto-${order.id}`,
            });
          }
          return { received: true, message: 'Order was already cancelled; automatic refund issued.' };
        }

        // Commit state: payments.status = paid, orders.paymentStatus = paid, items pending_payment -> placed
        order.paymentStatus = PAYMENT_STATUS.PAID;
        await order.save({ transaction });

        for (const item of items) {
          if (item.status === ITEM_STATUS.PENDING_PAYMENT) {
            item.status = ITEM_STATUS.PLACED;
            await item.save({ transaction });
          }
        }

        const payment = await Payment.findOne({
          where: { orderId: order.id },
          lock: transaction.LOCK.UPDATE,
          transaction,
        });

        if (payment) {
          payment.status = PAYMENT_STATUS.PAID;
          if (session.payment_intent) {
            payment.providerPaymentIntentId = session.payment_intent;
          }
          await payment.save({ transaction });
        }

        await transaction.commit();
        console.log(`[Stripe Webhook] checkout.session.completed handled: Order ${order.id} is now paid.`);
        return { received: true, message: 'Order payment confirmed and items placed.' };
      } catch (err) {
        if (!transaction.finished) await transaction.rollback();
        throw err;
      }
    }

    case 'checkout.session.expired': {
      const session = object;
      const orderId = session.metadata?.orderId || session.client_reference_id;

      const transaction = await sequelize.transaction();
      try {
        let order;
        if (orderId) {
          order = await Order.findByPk(orderId, {
            lock: transaction.LOCK.UPDATE,
            transaction,
          });
        } else {
          const payment = await Payment.findOne({
            where: { providerSessionId: session.id },
            transaction,
          });
          if (payment) {
            order = await Order.findByPk(payment.orderId, {
              lock: transaction.LOCK.UPDATE,
              transaction,
            });
          }
        }

        if (!order) {
          await transaction.rollback();
          console.warn(`[Stripe Webhook] Order not found for expired session ${session.id}. Returning 200.`);
          return { received: true, message: 'Order not found.' };
        }

        const items = await OrderItem.findAll({
          where: { orderId: order.id },
          transaction,
        });

        // If order is still pending_payment, cancel items, restore stock, set failed
        const isStillPending =
          items &&
          items.length > 0 &&
          items.every((i) => i.status === ITEM_STATUS.PENDING_PAYMENT);

        if (isStillPending && order.paymentStatus === PAYMENT_STATUS.PENDING) {
          order.paymentStatus = PAYMENT_STATUS.FAILED;
          await order.save({ transaction });

          const sortedItems = [...items].sort((a, b) =>
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

          const payment = await Payment.findOne({
            where: { orderId: order.id },
            lock: transaction.LOCK.UPDATE,
            transaction,
          });

          if (payment) {
            payment.status = PAYMENT_STATUS.FAILED;
            await payment.save({ transaction });
          }

          await transaction.commit();
          console.log(`[Stripe Webhook] checkout.session.expired handled: Order ${order.id} cancelled & stock restored.`);
          return { received: true, message: 'Order session expired, cancelled, and stock restored.' };
        }

        await transaction.commit();
        return { received: true, message: 'Order was not pending_payment; no changes made.' };
      } catch (err) {
        if (!transaction.finished) await transaction.rollback();
        throw err;
      }
    }

    case 'charge.refunded': {
      const charge = object;
      const paymentIntentId = charge.payment_intent;

      if (!paymentIntentId) {
        console.warn(`[Stripe Webhook] charge.refunded missing payment_intent. Charge ID: ${charge.id}`);
        return { received: true, message: 'Missing payment_intent.' };
      }

      const payment = await Payment.findOne({
        where: { providerPaymentIntentId: paymentIntentId },
      });

      if (!payment) {
        console.warn(`[Stripe Webhook] Payment not found for providerPaymentIntentId: ${paymentIntentId}. Returning 200.`);
        return { received: true, message: 'Payment not found, ignored.' };
      }

      // If already refunded, do nothing and return 200
      if (payment.status === PAYMENT_STATUS.REFUNDED) {
        console.log(`[Stripe Webhook] Payment ${payment.id} already marked refunded.`);
        return { received: true, message: 'Payment already refunded.' };
      }

      const amountTotal = charge.amount || 0;
      const amountRefunded = charge.amount_refunded || 0;
      const refundedDecimal = parseFloat((amountRefunded / 100).toFixed(2));
      const isFullRefund = amountRefunded >= amountTotal && amountTotal > 0;

      if (!isFullRefund) {
        // Partial refund: update payments.refundedAmount only; leave paymentStatus as 'paid'
        payment.refundedAmount = refundedDecimal;
        await payment.save();
        console.log(`[Stripe Webhook] Partial refund of $${refundedDecimal} recorded for payment ${payment.id}.`);
        return { received: true, message: 'Partial refund recorded.' };
      }

      // Full refund: payments.status = refunded, orders.paymentStatus = refunded, refundedAmount = full
      const transaction = await sequelize.transaction();
      try {
        payment.status = PAYMENT_STATUS.REFUNDED;
        payment.refundedAmount = refundedDecimal;
        await payment.save({ transaction });

        const order = await Order.findByPk(payment.orderId, {
          lock: transaction.LOCK.UPDATE,
          transaction,
        });

        if (order) {
          order.paymentStatus = PAYMENT_STATUS.REFUNDED;
          await order.save({ transaction });

          const items = await OrderItem.findAll({
            where: { orderId: order.id },
            transaction,
          });

          // If EVERY item is still 'placed': cancel items and restore stock
          const everyItemPlaced =
            items &&
            items.length > 0 &&
            items.every((i) => i.status === ITEM_STATUS.PLACED);

          if (everyItemPlaced) {
            const sortedItems = [...items].sort((a, b) =>
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
            console.log(`[Stripe Webhook] Full refund: Order ${order.id} items cancelled and stock restored.`);
          } else {
            console.log(`[Stripe Webhook] Full refund during fulfillment: Order ${order.id} items and stock untouched.`);
          }
        }

        await transaction.commit();
        return { received: true, message: 'Full refund recorded.' };
      } catch (err) {
        if (!transaction.finished) await transaction.rollback();
        throw err;
      }
    }

    case 'charge.dispute.created': {
      const dispute = object;
      const paymentIntentId = dispute.payment_intent;

      const payment = await Payment.findOne({
        where: { providerPaymentIntentId: paymentIntentId },
      });

      if (!payment) {
        console.warn(`[Stripe Webhook] Payment not found for dispute payment_intent: ${paymentIntentId}. Returning 200.`);
        return { received: true, message: 'Payment not found for dispute.' };
      }

      const disputeId = dispute.id;
      const disputeStatus = dispute.status;
      const disputeReason = dispute.reason;
      const disputeAmount = dispute.amount != null ? parseFloat((dispute.amount / 100).toFixed(2)) : null;
      const disputeDueBy =
        dispute.evidence_details && dispute.evidence_details.due_by
          ? new Date(dispute.evidence_details.due_by * 1000)
          : null;
      const disputeOpenedAt = dispute.created ? new Date(dispute.created * 1000) : new Date();

      payment.disputeId = disputeId;
      payment.disputeStatus = disputeStatus;
      payment.disputeReason = disputeReason;
      payment.disputeAmount = disputeAmount;
      payment.disputeDueBy = disputeDueBy;
      payment.disputeOpenedAt = disputeOpenedAt;
      await payment.save();

      // Log warning & alert admin
      await notifyAdmin({
        type: 'DISPUTE_CREATED',
        orderId: payment.orderId,
        disputeId,
        disputeDueBy,
        amount: disputeAmount,
        reason: disputeReason,
      });

      return { received: true, message: 'Dispute created and recorded.' };
    }

    case 'charge.dispute.closed': {
      const dispute = object;
      const paymentIntentId = dispute.payment_intent;

      let payment = null;
      if (paymentIntentId) {
        payment = await Payment.findOne({
          where: { providerPaymentIntentId: paymentIntentId },
        });
      }

      if (!payment && dispute.id) {
        payment = await Payment.findOne({
          where: { disputeId: dispute.id },
        });
      }

      if (!payment) {
        console.warn(`[Stripe Webhook] Payment not found for closed dispute: ${dispute.id}. Returning 200.`);
        return { received: true, message: 'Payment not found for dispute closed.' };
      }

      payment.disputeStatus = dispute.status;
      payment.disputeClosedAt = new Date();
      await payment.save();

      console.log(`[Stripe Webhook] Dispute ${dispute.id} closed with status '${dispute.status}' for order ${payment.orderId}.`);
      return { received: true, message: 'Dispute closed recorded.' };
    }

    default:
      // Any other event type returns 200 and is ignored
      return { received: true, ignored: true, type: event.type };
  }
};

module.exports = {
  handleStripeWebhook,
};
