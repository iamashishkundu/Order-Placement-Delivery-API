const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { listProducts } = require('./listProducts.service');

const listProductsController = asyncHandler(async (req, res) => {
  const { products, meta } = await listProducts(req.user.id, req.query);
  return successResponse(res, 200, 'Vendor products fetched successfully.', products, meta);
});

module.exports = listProductsController;

