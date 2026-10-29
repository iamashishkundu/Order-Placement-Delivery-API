/**
 * Central admin notification service.
 * Currently logs clear warning lines containing orderId and disputeDueBy,
 * allowing real alerts (email, SMS, Slack, webhook) to be plugged in later.
 */
const notifyAdmin = async ({
  type = 'DISPUTE_CREATED',
  orderId,
  disputeId = null,
  disputeDueBy = null,
  amount = null,
  reason = null,
  message = '',
}) => {
  const dueInfo = disputeDueBy ? new Date(disputeDueBy).toISOString() : 'N/A';
  const warningText = `[ADMIN ALERT - DISPUTE WARNING] Order ID: ${orderId} | Dispute ID: ${disputeId || 'N/A'} | Due By: ${dueInfo} | Amount: ${amount != null ? amount : 'N/A'} | Reason: ${reason || 'N/A'} | ${message}`;
  console.warn(warningText);

  return {
    success: true,
    logged: true,
    warningText,
  };
};

module.exports = {
  notifyAdmin,
};

