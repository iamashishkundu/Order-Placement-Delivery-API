const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { updateProduct } = require('./updateProduct.service');

const updateProductController = asyncHandler(async (req, res) => {
  const product = await updateProduct(req.user.id, req.params.productId, req.body);
  return successResponse(res, 200, 'Product updated successfully.', product);
});

module.exports = updateProductController;

