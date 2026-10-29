const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { updateProfile } = require('./updateProfile.service');

const updateProfileController = asyncHandler(async (req, res) => {
  const profile = await updateProfile(req.user.id, req.body);
  return successResponse(res, 200, 'Vendor profile updated successfully.', profile);
});

module.exports = updateProfileController;

