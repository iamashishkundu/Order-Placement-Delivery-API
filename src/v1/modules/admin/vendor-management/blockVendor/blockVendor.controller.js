const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { blockVendor } = require('./blockVendor.service');

const blockVendorController = asyncHandler(async (req, res) => {
  const vendor = await blockVendor(req.params.vendorId);
  return successResponse(res, 200, 'Vendor blocked successfully.', vendor);
});

module.exports = blockVendorController;

