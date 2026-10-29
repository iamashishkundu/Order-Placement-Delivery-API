const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { sendEmailOtp } = require('./sendEmailOtp.service');

const sendEmailOtpController = asyncHandler(async (req, res) => {
  const result = await sendEmailOtp(req.body);
  return successResponse(res, 200, result.message);
});

module.exports = sendEmailOtpController;

