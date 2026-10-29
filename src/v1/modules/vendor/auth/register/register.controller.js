const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { register } = require('./register.service');

const registerController = asyncHandler(async (req, res) => {
  const vendor = await register(req.body);
  return successResponse(
    res,
    201,
    'Vendor registered successfully. Please verify your phone and email.',
    vendor
  );
});

module.exports = registerController;

