const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { getVendor } = require('./getVendor.service');

const getVendorController = asyncHandler(async (req, res) => {
  const vendor = await getVendor(req.params.vendorId);
  return successResponse(res, 200, 'Vendor details fetched successfully.', vendor);
});

module.exports = getVendorController;

