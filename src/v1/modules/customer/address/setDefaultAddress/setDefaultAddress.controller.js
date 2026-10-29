const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { setDefaultAddress } = require('./setDefaultAddress.service');

const setDefaultAddressController = asyncHandler(async (req, res) => {
  const address = await setDefaultAddress(req.user.id, req.params.addressId);
  return successResponse(res, 200, 'Default address set successfully.', address);
});

module.exports = setDefaultAddressController;

