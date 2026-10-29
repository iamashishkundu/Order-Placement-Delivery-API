const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { listOrders } = require('./listOrders.service');

const listOrdersController = asyncHandler(async (req, res) => {
  const { orders, meta } = await listOrders(req.user.id, req.query);
  return successResponse(res, 200, 'Vendor orders fetched successfully.', orders, meta);
});

module.exports = listOrdersController;

