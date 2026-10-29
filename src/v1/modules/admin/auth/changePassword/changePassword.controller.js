const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { changePassword } = require('./changePassword.service');

const changePasswordController = asyncHandler(async (req, res) => {
  const result = await changePassword(req.user.id, req.body);
  return successResponse(res, 200, result.message);
});

module.exports = changePasswordController;

