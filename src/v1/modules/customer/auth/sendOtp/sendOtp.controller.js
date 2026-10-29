const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { sendOtp } = require('./sendOtp.service');

const sendOtpController = asyncHandler(async (req, res) => {
  const result = await sendOtp(req.body);
  return successResponse(res, 200, result.message);
});

module.exports = sendOtpController;

