const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { getDashboard } = require('./getDashboard.service');

const getDashboardController = asyncHandler(async (req, res) => {
  const data = await getDashboard(req.user.id);
  return successResponse(res, 200, 'Vendor dashboard statistics fetched successfully.', data);
});

module.exports = getDashboardController;

