const asyncHandler = require('../../../../../common/utils/asyncHandler');
const { successResponse } = require('../../../../../common/utils/apiResponse');
const { deleteAddress } = require('./deleteAddress.service');

const deleteAddressController = asyncHandler(async (req, res) => {
  const result = await deleteAddress(req.user.id, req.params.addressId);
  return successResponse(res, 200, result.message);
});

module.exports = deleteAddressController;

