const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { updateStock } = require('./updateStock.service');

const updateStockController = asyncHandler(async (req, res) => {
  const product = await updateStock(req.user.id, req.params.productId, req.body.stock);
  return successResponse(res, 200, 'Product stock updated successfully.', product);
});

module.exports = updateStockController;

