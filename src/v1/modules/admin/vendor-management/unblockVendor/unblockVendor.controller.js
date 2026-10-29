const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { unblockVendor } = require('./unblockVendor.service');

const unblockVendorController = asyncHandler(async (req, res) => {
  const vendor = await unblockVendor(req.params.vendorId);
  return successResponse(res, 200, 'Vendor unblocked successfully.', vendor);
});

module.exports = unblockVendorController;

