const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { sendPhoneOtp } = require('./sendPhoneOtp.service');

const sendPhoneOtpController = asyncHandler(async (req, res) => {
  const result = await sendPhoneOtp(req.body);
  return successResponse(res, 200, result.message);
});

module.exports = sendPhoneOtpController;

