const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { getOrder } = require('./getOrder.service');

const getOrderController = asyncHandler(async (req, res) => {
  const order = await getOrder(req.params.orderId);
  return successResponse(res, 200, 'Order details fetched successfully.', order);
});

module.exports = getOrderController;

