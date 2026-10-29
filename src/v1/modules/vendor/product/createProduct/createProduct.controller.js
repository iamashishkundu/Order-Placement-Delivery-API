const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { createProduct } = require('./createProduct.service');

const createProductController = asyncHandler(async (req, res) => {
  const product = await createProduct(req.user.id, req.body);
  return successResponse(res, 201, 'Product created successfully.', product);
});

module.exports = createProductController;

