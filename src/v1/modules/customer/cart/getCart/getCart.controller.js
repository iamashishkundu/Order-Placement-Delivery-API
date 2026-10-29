const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { getCart } = require('./getCart.service');

const getCartController = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user.id);
  return successResponse(res, 200, 'Cart fetched successfully.', cart);
});

module.exports = getCartController;

