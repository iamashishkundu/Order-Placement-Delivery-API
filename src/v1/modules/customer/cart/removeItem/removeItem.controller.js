const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { removeItem } = require('./removeItem.service');

const removeItemController = asyncHandler(async (req, res) => {
  const result = await removeItem(req.user.id, req.params.productId);
  return successResponse(res, 200, result.message);
});

module.exports = removeItemController;

