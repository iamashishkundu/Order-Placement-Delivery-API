const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { rejectVendor } = require('./rejectVendor.service');

const rejectVendorController = asyncHandler(async (req, res) => {
  const vendor = await rejectVendor(req.params.vendorId, req.body);
  return successResponse(res, 200, 'Vendor rejected successfully.', vendor);
});

module.exports = rejectVendorController;

