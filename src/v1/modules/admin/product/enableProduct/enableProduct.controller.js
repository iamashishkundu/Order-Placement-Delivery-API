const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { enableProduct } = require('./enableProduct.service');

const enableProductController = asyncHandler(async (req, res) => {
  const product = await enableProduct(req.params.productId);
  return successResponse(res, 200, 'Product enabled successfully.', product);
});

module.exports = enableProductController;

