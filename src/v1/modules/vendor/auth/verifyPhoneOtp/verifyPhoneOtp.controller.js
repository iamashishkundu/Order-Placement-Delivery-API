const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { verifyPhoneOtp } = require('./verifyPhoneOtp.service');

const verifyPhoneOtpController = asyncHandler(async (req, res) => {
  const result = await verifyPhoneOtp(req.body);
  return successResponse(res, 200, result.message, result);
});

module.exports = verifyPhoneOtpController;

