const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { placeOrder } = require('./placeOrder.service');

const placeOrderController = asyncHandler(async (req, res) => {
  const result = await placeOrder(req.user.id, req.body);
  const message =
    result.paymentMethod === 'ONLINE'
      ? 'Order placed successfully. Please complete payment using checkoutUrl.'
      : 'Order placed successfully (Cash on Delivery).';

  return successResponse(res, 201, message, result);
});

module.exports = placeOrderController;
