const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { listOrders } = require('./listOrders.service');

const listOrdersController = asyncHandler(async (req, res) => {
  const { orders, meta } = await listOrders(req.query);
  return successResponse(res, 200, 'Orders fetched successfully.', orders, meta);
});

module.exports = listOrdersController;

