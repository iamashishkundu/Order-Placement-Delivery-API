const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { updateItemStatus } = require('./updateItemStatus.service');

const updateItemStatusController = asyncHandler(async (req, res) => {
  const result = await updateItemStatus(req.user.id, req.params.orderId, req.body);
  return successResponse(res, 200, result.message, result);
});

module.exports = updateItemStatusController;

