const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { createProfile } = require('./createProfile.service');

const createProfileController = asyncHandler(async (req, res) => {
  const profile = await createProfile(req.user.id, req.body);
  return successResponse(res, 201, 'Vendor profile created successfully.', profile);
});

module.exports = createProfileController;

