const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { login } = require('./login.service');

const loginController = asyncHandler(async (req, res) => {
  const result = await login(req.body);
  return successResponse(res, 200, 'Vendor logged in successfully.', result);
});

module.exports = loginController;

