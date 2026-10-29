const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { getStatus } = require('./getStatus.service');

const getStatusController = asyncHandler(async (req, res) => {
  const statusData = await getStatus(req.user.id);
  return successResponse(res, 200, 'Vendor status fetched successfully.', statusData);
});

module.exports = getStatusController;

