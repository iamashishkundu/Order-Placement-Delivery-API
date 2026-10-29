const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { verifyEmailOtp } = require('./verifyEmailOtp.service');

const verifyEmailOtpController = asyncHandler(async (req, res) => {
  const result = await verifyEmailOtp(req.body);
  return successResponse(res, 200, result.message, result);
});

module.exports = verifyEmailOtpController;

