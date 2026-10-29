const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { updateItem } = require('./updateItem.service');

const updateItemController = asyncHandler(async (req, res) => {
  const item = await updateItem(req.user.id, req.params.productId, req.body.quantity);
  return successResponse(res, 200, 'Cart item quantity updated successfully.', item);
});

module.exports = updateItemController;

