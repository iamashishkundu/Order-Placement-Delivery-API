const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { approveVendor } = require('./approveVendor.service');

const approveVendorController = asyncHandler(async (req, res) => {
  const vendor = await approveVendor(req.params.vendorId);
  return successResponse(res, 200, 'Vendor approved successfully.', vendor);
});

module.exports = approveVendorController;

