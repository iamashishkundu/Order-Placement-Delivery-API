const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { addItem } = require('./addItem.service');

const addItemController = asyncHandler(async (req, res) => {
  const item = await addItem(req.user.id, req.body);
  return successResponse(res, 201, 'Item added to cart successfully.', item);
});

module.exports = addItemController;

