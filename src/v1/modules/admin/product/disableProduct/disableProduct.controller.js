const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { disableProduct } = require('./disableProduct.service');

const disableProductController = asyncHandler(async (req, res) => {
  const product = await disableProduct(req.params.productId);
  return successResponse(res, 200, 'Product disabled successfully.', product);
});

module.exports = disableProductController;

