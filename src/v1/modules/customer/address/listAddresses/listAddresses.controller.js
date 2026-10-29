const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { listAddresses } = require('./listAddresses.service');

const listAddressesController = asyncHandler(async (req, res) => {
  const addresses = await listAddresses(req.user.id);
  return successResponse(res, 200, 'Addresses fetched successfully.', addresses);
});

module.exports = listAddressesController;

