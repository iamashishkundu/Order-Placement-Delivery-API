const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { listVendors } = require('./listVendors.service');

const listVendorsController = asyncHandler(async (req, res) => {
  const { vendors, meta } = await listVendors(req.query);
  return successResponse(res, 200, 'Vendors fetched successfully.', vendors, meta);
});

module.exports = listVendorsController;

