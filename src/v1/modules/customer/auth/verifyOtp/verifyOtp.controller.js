const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { verifyOtp } = require('./verifyOtp.service');

const verifyOtpController = asyncHandler(async (req, res) => {
  const result = await verifyOtp(req.body);
  return successResponse(res, 200, 'OTP verified successfully.', result);
});

module.exports = verifyOtpController;

