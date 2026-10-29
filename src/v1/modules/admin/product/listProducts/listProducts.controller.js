const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { listProducts } = require('./listProducts.service');

const listProductsController = asyncHandler(async (req, res) => {
  const { products, meta } = await listProducts(req.query);
  return successResponse(res, 200, 'Products fetched successfully.', products, meta);
});

module.exports = listProductsController;

