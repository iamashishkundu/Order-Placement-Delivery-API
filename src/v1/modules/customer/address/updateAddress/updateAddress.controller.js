const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { updateAddress } = require('./updateAddress.service');

const updateAddressController = asyncHandler(async (req, res) => {
  const address = await updateAddress(req.user.id, req.params.addressId, req.body);
  return successResponse(res, 200, 'Address updated successfully.', address);
});

module.exports = updateAddressController;

