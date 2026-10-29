const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { getOrder } = require('./getOrder.service');

const getOrderController = asyncHandler(async (req, res) => {
  const order = await getOrder(req.user.id, req.params.orderId);
  return successResponse(res, 200, 'Vendor order fetched successfully.', order);
});

module.exports = getOrderController;

