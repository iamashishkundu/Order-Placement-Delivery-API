const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { cancelOrder } = require('./cancelOrder.service');

const cancelOrderController = asyncHandler(async (req, res) => {
  const result = await cancelOrder(req.user.id, req.params.orderId);
  return successResponse(res, 200, result.message, result);
});

module.exports = cancelOrderController;

