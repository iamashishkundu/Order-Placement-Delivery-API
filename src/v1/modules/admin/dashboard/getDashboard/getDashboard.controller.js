const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { getDashboard } = require('./getDashboard.service');

const getDashboardController = asyncHandler(async (req, res) => {
  const dashboardData = await getDashboard();
  return successResponse(res, 200, 'Admin dashboard statistics fetched successfully.', dashboardData);
});

module.exports = getDashboardController;

