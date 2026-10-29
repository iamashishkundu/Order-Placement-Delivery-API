const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { toggleAvailability } = require('./toggleAvailability.service');

const toggleAvailabilityController = asyncHandler(async (req, res) => {
  const product = await toggleAvailability(
    req.user.id,
    req.params.productId,
    req.body.isAvailable
  );
  return successResponse(res, 200, 'Product availability updated successfully.', product);
});

module.exports = toggleAvailabilityController;

