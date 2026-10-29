const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { getProduct } = require('./getProduct.service');

const getProductController = asyncHandler(async (req, res) => {
  const product = await getProduct(req.user.id, req.params.productId);
  return successResponse(res, 200, 'Product details fetched successfully.', product);
});

module.exports = getProductController;

