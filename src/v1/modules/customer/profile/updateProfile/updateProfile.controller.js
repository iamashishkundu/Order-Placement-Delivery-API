const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { updateProfile } = require('./updateProfile.service');

const updateProfileController = asyncHandler(async (req, res) => {
  const updated = await updateProfile(req.user.id, req.body);
  return successResponse(res, 200, 'Customer profile updated successfully.', updated);
});

module.exports = updateProfileController;

