const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { getProfile } = require('./getProfile.service');

const getProfileController = asyncHandler(async (req, res) => {
  const profile = await getProfile(req.user.id);
  return successResponse(res, 200, 'Admin profile fetched successfully.', profile);
});

module.exports = getProfileController;

