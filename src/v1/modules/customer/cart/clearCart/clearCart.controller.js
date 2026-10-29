const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { clearCart } = require('./clearCart.service');

const clearCartController = asyncHandler(async (req, res) => {
  const result = await clearCart(req.user.id);
  return successResponse(res, 200, result.message);
});

module.exports = clearCartController;

