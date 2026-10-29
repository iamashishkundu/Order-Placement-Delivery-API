const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { deleteProduct } = require('./deleteProduct.service');

const deleteProductController = asyncHandler(async (req, res) => {
  const result = await deleteProduct(req.user.id, req.params.productId);
  return successResponse(res, 200, result.message);
});

module.exports = deleteProductController;

